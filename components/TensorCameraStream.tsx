import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { Camera } from 'expo-camera';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import { cameraWithTensors } from '@tensorflow/tfjs-react-native';
import { ExpoWebGLRenderingContext } from 'expo-gl';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Pose } from '@/types/pose';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
// Ensure screen dimensions are integers
const SCREEN_WIDTH = Math.round(screenWidth);
const SCREEN_HEIGHT = Math.round(screenHeight);

// Lightning model configuration
const OUTPUT_TENSOR_WIDTH = 192;
const OUTPUT_TENSOR_HEIGHT = 192;
const IS_ANDROID = Platform.OS === 'android';
const AUTO_RENDER = false; // Manual rendering control
const TARGET_FPS = 5; // 5 FPS for controlled inference

interface TensorCameraStreamProps {
  facing: 'front' | 'back';
  onPosesDetected: (poses: Pose[]) => void;
  onFpsUpdate?: (fps: number) => void;
  isAnalyzing: boolean;
}

// Create TensorCamera component
const TensorCamera = cameraWithTensors(Camera);

export default function TensorCameraStream({ 
  facing, 
  onPosesDetected, 
  onFpsUpdate,
  isAnalyzing 
}: TensorCameraStreamProps) {
  const [isModelReady, setIsModelReady] = useState(false);
  const [isTfReady, setIsTfReady] = useState(false);
  const [orientation, setOrientation] = useState(ScreenOrientation.Orientation.PORTRAIT_UP);
  
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  const rafId = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(Date.now());

  // Get camera type for expo-camera v13 API - use numeric values
  const cameraType = facing === 'front' ? 1 : 0; // front = 1, back = 0

  useEffect(() => {
    const initializeTensorFlow = async () => {
      try {
        console.log('Initializing TensorFlow for TensorCamera...');
        
        // Initialize TensorFlow with WebGL backend
        await tf.ready();
        
        // Check available backends and set appropriately
        const backends = tf.engine().backendNames();
        console.log('Available TensorFlow backends:', backends);
        
        if (backends.includes('webgl')) {
          await tf.setBackend('webgl');
          console.log('Using WebGL backend for better performance');
        } else if (backends.includes('cpu')) {
          await tf.setBackend('cpu');
          console.log('Falling back to CPU backend');
        }
        
        console.log('TensorFlow ready with backend:', tf.getBackend());
        setIsTfReady(true);

        // Configure MoveNet Lightning model
        const movenetModelConfig: poseDetection.MoveNetModelConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: true,
        };

        console.log('Loading MoveNet Lightning model from web...');
        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          movenetModelConfig
        );

        detectorRef.current = detector;
        setIsModelReady(true);
        console.log('MoveNet Lightning model loaded successfully (192x192 input)');
      } catch (error) {
        console.error('Failed to initialize TensorCamera:', error);
      }
    };

    initializeTensorFlow();

    // Listen for orientation changes
    const subscription = ScreenOrientation.addOrientationChangeListener((event) => {
      setOrientation(event.orientationInfo.orientation);
    });

    return () => {
      if (detectorRef.current) {
        detectorRef.current.dispose();
      }
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
      subscription?.remove();
    };
  }, []);

  // Stop processing when not analyzing
  useEffect(() => {
    if (!isAnalyzing) {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      onPosesDetected([]);
    }
  }, [isAnalyzing, onPosesDetected]);

  const getTextureRotationAngleInDegrees = () => {
    if (IS_ANDROID) return 0;
    
    switch (orientation) {
      case ScreenOrientation.Orientation.PORTRAIT_DOWN:
        return 180;
      case ScreenOrientation.Orientation.LANDSCAPE_LEFT:
        return facing === 'front' ? 270 : 90;
      case ScreenOrientation.Orientation.LANDSCAPE_RIGHT:
        return facing === 'front' ? 90 : 270;
      default:
        return 0;
    }
  };

  const handleCameraStream = async (
    images: IterableIterator<tf.Tensor3D>,
    updatePreview: () => void,
    gl: ExpoWebGLRenderingContext
  ) => {
    try {
      console.log('TensorCamera stream ready - starting frame processing loop at 5 FPS');
      
      // Validate stream components
      if (!images || !updatePreview || !gl) {
        console.error('Invalid camera stream components');
        return;
      }
      
      const frameDelay = 1000 / TARGET_FPS; // 200ms between frames
      let lastFrameTime = 0;
      
      const loop = async () => {
      try {
        const currentTime = Date.now();
        
        // Skip frame if not enough time has passed for 5 FPS
        if (currentTime - lastFrameTime < frameDelay) {
          if (!AUTO_RENDER) {
            updatePreview();
            gl.endFrameEXP();
          }
          rafId.current = requestAnimationFrame(loop);
          return;
        }
        
        lastFrameTime = currentTime;
        
        // Only process if analyzing and model is ready
        if (!isAnalyzing || !detectorRef.current) {
          // Still need to consume the frame and update preview
          const imageTensor = images.next().value as tf.Tensor3D;
          if (imageTensor) {
            imageTensor.dispose();
          }
          
          if (!AUTO_RENDER) {
            updatePreview();
            gl.endFrameEXP();
          }
          
          rafId.current = requestAnimationFrame(loop);
          return;
        }

        // Get next frame tensor from camera stream
        let imageTensor: tf.Tensor3D | undefined;
        try {
          const next = images.next();
          imageTensor = next.value as tf.Tensor3D;
        } catch (error) {
          console.error('Failed to capture image:', error);
          rafId.current = requestAnimationFrame(loop);
          return;
        }
        
        if (!imageTensor) {
          rafId.current = requestAnimationFrame(loop);
          return;
        }

        const startTs = Date.now();
        
        try {
          // Validate tensor shape before processing
          const [height, width, channels] = imageTensor.shape;
          
          // Check if dimensions need rounding
          if (!Number.isInteger(height) || !Number.isInteger(width) || !Number.isInteger(channels)) {
            console.warn('Non-integer tensor shape detected:', imageTensor.shape);
            console.log('Resizing tensor to valid integer dimensions...');
            
            // Calculate rounded dimensions while maintaining aspect ratio
            const roundedHeight = Math.round(height);
            const roundedWidth = Math.round(width);
            
            // Resize to rounded dimensions first, then to model input size
            const roundedTensor = tf.image.resizeBilinear(imageTensor, [roundedHeight, roundedWidth]);
            const validTensor = tf.image.resizeBilinear(roundedTensor, [OUTPUT_TENSOR_HEIGHT, OUTPUT_TENSOR_WIDTH]);
            
            tf.dispose([imageTensor, roundedTensor]);
            
            const poses = await detectorRef.current.estimatePoses(validTensor);
            tf.dispose(validTensor);
            
            const convertedPoses = convertPoses(poses);
            onPosesDetected(convertedPoses);
          } else {
            // Process frame with Lightning model
            // The tensor should already be 192x192 from TensorCamera resizing
            console.log('Processing frame tensor shape:', imageTensor.shape, 'dtype:', imageTensor.dtype);
            
            const poses = await detectorRef.current.estimatePoses(imageTensor);
            const convertedPoses = convertPoses(poses);
            onPosesDetected(convertedPoses);
            
            // Dispose tensor to prevent memory leaks
            tf.dispose(imageTensor);
          }
        } catch (error) {
          console.error('Error detecting poses:', error);
          tf.dispose(imageTensor);
        }
        
        const latency = Date.now() - startTs;
        
        // Update FPS counter
        frameCountRef.current++;
        const now = Date.now();
        if (now - lastFpsUpdateRef.current > 1000) {
          const avgFps = (frameCountRef.current * 1000) / (now - lastFpsUpdateRef.current);
          console.log(`TensorCamera FPS: ${avgFps.toFixed(1)} (target: ${TARGET_FPS}), Latency: ${latency}ms`);
          
          if (onFpsUpdate) {
            onFpsUpdate(Math.min(Math.floor(avgFps), TARGET_FPS));
          }
          
          frameCountRef.current = 0;
          lastFpsUpdateRef.current = now;
        }
        
        // Manual rendering control
        if (!AUTO_RENDER) {
          updatePreview();
          gl.endFrameEXP();
        }
        
        // Continue the loop
        rafId.current = requestAnimationFrame(loop);
        
      } catch (error) {
        console.error('Error in TensorCamera frame processing loop:', error);
        // Continue the loop even on error
        rafId.current = requestAnimationFrame(loop);
      }
    };

      // Start the processing loop
      loop();
    } catch (error) {
      console.error('Failed to initialize camera stream:', error);
    }
  };

  // Helper function to convert poses to our format
  const convertPoses = (poses: poseDetection.Pose[]): Pose[] => {
    const scaleX = SCREEN_WIDTH / OUTPUT_TENSOR_WIDTH;
    const scaleY = SCREEN_HEIGHT / OUTPUT_TENSOR_HEIGHT;

    return poses.map(pose => ({
      keypoints: pose.keypoints.map(kp => ({
        x: facing === 'front' 
          ? SCREEN_WIDTH - (kp.x * scaleX) // Mirror for front camera
          : kp.x * scaleX,
        y: kp.y * scaleY,
        score: kp.score || 0,
        name: kp.name || 'unknown',
      })),
      score: pose.score || 0,
    }));
  };

  if (!isTfReady || !isModelReady) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.camera} />
      </View>
    );
  }

  // Platform-specific texture dimensions - ensure integer values
  let textureDims: { width: number; height: number } | undefined;
  if (Platform.OS === 'ios') {
    textureDims = { width: 1920, height: 1080 };
  } else if (Platform.OS === 'android') {
    textureDims = { width: 1280, height: 720 };
  }

  return (
    <TensorCamera
      style={styles.camera}
      autorender={AUTO_RENDER}
      type={cameraType}
      resizeWidth={Math.round(OUTPUT_TENSOR_WIDTH)}    // Lightning model size (192)
      resizeHeight={Math.round(OUTPUT_TENSOR_HEIGHT)}   // Lightning model size (192)
      resizeDepth={3}
      rotation={Math.round(getTextureRotationAngleInDegrees())}
      onReady={handleCameraStream}
      useCustomShadersToResize={false}
      cameraTextureHeight={Math.round(textureDims?.height ?? 1080)}
      cameraTextureWidth={Math.round(textureDims?.width ?? 1920)}
    />
  );
}

const styles = StyleSheet.create({
  camera: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
});