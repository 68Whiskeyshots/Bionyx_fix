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

const IS_ANDROID = Platform.OS === 'android';
const IS_IOS = Platform.OS === 'ios';

// Camera preview size - following template pattern
const CAM_PREVIEW_WIDTH = Dimensions.get('window').width;
const CAM_PREVIEW_HEIGHT = Math.round(CAM_PREVIEW_WIDTH / (IS_IOS ? 9 / 16 : 3 / 4));

// Output tensor size - following template pattern
const OUTPUT_TENSOR_WIDTH = 180;
const OUTPUT_TENSOR_HEIGHT = Math.round(OUTPUT_TENSOR_WIDTH / (IS_IOS ? 9 / 16 : 3 / 4));

// Control settings
const AUTO_RENDER = false;
const MIN_KEYPOINT_SCORE = 0.3;

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
  const [orientation, setOrientation] = useState<ScreenOrientation.Orientation>(
    ScreenOrientation.Orientation.PORTRAIT_UP
  );
  
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  const rafId = useRef<number | null>(null);
  
  // Camera type for expo-camera v13 API
  const cameraType = facing === 'front' ? 1 : 0;

  useEffect(() => {
    const initializeTensorFlow = async () => {
      try {
        console.log('Initializing TensorFlow...');
        
        // Set initial orientation
        const curOrientation = await ScreenOrientation.getOrientationAsync();
        setOrientation(curOrientation);
        
        // Wait for tfjs to initialize
        await tf.ready();
        console.log('TensorFlow ready with backend:', tf.getBackend());
        setIsTfReady(true);

        // Configure MoveNet model - using Thunder for better accuracy
        const movenetModelConfig: poseDetection.MoveNetModelConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,
          enableSmoothing: true,
        };

        console.log('Loading MoveNet Thunder model...');
        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          movenetModelConfig
        );

        detectorRef.current = detector;
        setIsModelReady(true);
        console.log('MoveNet Thunder model loaded successfully');
      } catch (error) {
        console.error('Failed to initialize TensorFlow:', error);
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
      if (rafId.current != null && rafId.current !== 0) {
        cancelAnimationFrame(rafId.current);
        rafId.current = 0;
      }
      subscription?.remove();
    };
  }, []);

  const isPortrait = () => {
    return (
      orientation === ScreenOrientation.Orientation.PORTRAIT_UP ||
      orientation === ScreenOrientation.Orientation.PORTRAIT_DOWN
    );
  };

  const getOutputTensorWidth = () => {
    // Following template pattern for orientation handling
    return isPortrait() || IS_ANDROID
      ? OUTPUT_TENSOR_WIDTH
      : OUTPUT_TENSOR_HEIGHT;
  };

  const getOutputTensorHeight = () => {
    return isPortrait() || IS_ANDROID
      ? OUTPUT_TENSOR_HEIGHT
      : OUTPUT_TENSOR_WIDTH;
  };

  const getTextureRotationAngleInDegrees = () => {
    // On Android, no rotation needed
    if (IS_ANDROID) {
      return 0;
    }

    // iOS rotation handling
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
    console.log('Camera stream ready - starting processing loop');
    
    const loop = async () => {
      // Check if we should stop
      if (rafId.current === 0 || !isAnalyzing || !detectorRef.current) {
        // Still need to consume frames even when not analyzing
        const imageTensor = images.next().value;
        if (imageTensor) {
          tf.dispose(imageTensor);
        }
        
        if (!AUTO_RENDER) {
          updatePreview();
          gl.endFrameEXP();
        }
        
        rafId.current = requestAnimationFrame(loop);
        return;
      }

      try {
        // Get the tensor from camera
        const imageTensor = images.next().value as tf.Tensor3D;
        
        if (!imageTensor) {
          rafId.current = requestAnimationFrame(loop);
          return;
        }

        const startTs = Date.now();
        
        // Run pose detection
        const poses = await detectorRef.current.estimatePoses(
          imageTensor,
          undefined,
          Date.now()
        );
        
        const latency = Date.now() - startTs;
        const fps = Math.floor(1000 / latency);
        
        if (onFpsUpdate) {
          onFpsUpdate(fps);
        }

        // Convert poses to our format
        const convertedPoses = convertPoses(poses);
        onPosesDetected(convertedPoses);
        
        // Clean up tensor
        tf.dispose(imageTensor);
        
        // Manual rendering when AUTO_RENDER is false
        if (!AUTO_RENDER) {
          updatePreview();
          gl.endFrameEXP();
        }
        
      } catch (error) {
        console.error('Error in processing loop:', error);
      }
      
      // Schedule next frame
      rafId.current = requestAnimationFrame(loop);
    };

    // Start the loop
    rafId.current = 1; // Set to non-zero to indicate loop is active
    loop();
  };

  const convertPoses = (poses: poseDetection.Pose[]): Pose[] => {
    return poses.map(pose => {
      const keypoints = pose.keypoints
        .filter((k) => (k.score ?? 0) > MIN_KEYPOINT_SCORE)
        .map((k) => {
          // Flip horizontally on Android or when using back camera
          const flipX = IS_ANDROID || facing === 'back';
          const x = flipX ? getOutputTensorWidth() - k.x : k.x;
          const y = k.y;
          
          // Scale to screen coordinates
          const screenX = (x / getOutputTensorWidth()) * 
            (isPortrait() ? CAM_PREVIEW_WIDTH : CAM_PREVIEW_HEIGHT);
          const screenY = (y / getOutputTensorHeight()) * 
            (isPortrait() ? CAM_PREVIEW_HEIGHT : CAM_PREVIEW_WIDTH);
          
          return {
            x: screenX,
            y: screenY,
            score: k.score || 0,
            name: k.name || 'unknown',
          };
        });

      return {
        keypoints,
        score: pose.score || 0,
      };
    });
  };

  if (!isTfReady || !isModelReady) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.camera} />
      </View>
    );
  }

  return (
    <TensorCamera
      style={styles.camera}
      autorender={AUTO_RENDER}
      type={cameraType}
      resizeWidth={getOutputTensorWidth()}
      resizeHeight={getOutputTensorHeight()}
      resizeDepth={3}
      rotation={getTextureRotationAngleInDegrees()}
      onReady={handleCameraStream}
    />
  );
}

const styles = StyleSheet.create({
  camera: {
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
});