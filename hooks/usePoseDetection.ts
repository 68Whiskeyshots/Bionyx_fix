import { useState, useCallback, useRef } from 'react';
import { Platform, Dimensions } from 'react-native';
import * as tf from '@tensorflow/tfjs';
// CRITICAL: Only use @tensorflow/tfjs-react-native (not @tensorflow/tfjs-platform-react-native)
import '@tensorflow/tfjs-react-native';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { Pose } from '@/types/pose';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export function usePoseDetection() {
  const [poses, setPoses] = useState<Pose[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  const isProcessingRef = useRef(false);

  const initializeTensorFlow = useCallback(async () => {
    if (isInitialized) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Platform-specific initialization
      if (Platform.OS === 'web') {
        // Web platform - use WebGL backend
        await tf.setBackend('webgl');
      } else {
        // Mobile platform - use CPU backend for better compatibility
        await tf.setBackend('cpu');
      }
      
      await tf.ready();
      console.log('TensorFlow.js backend:', tf.getBackend());
      
      // Create MoveNet detector with optimized config
      const detectorConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
        multiPoseMaxDimension: 256,
        enableTracking: false,
        trackerType: poseDetection.TrackerType.BoundingBox,
      };
      
      console.log('Loading MoveNet detector...');
      const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        detectorConfig
      );
      
      detectorRef.current = detector;
      console.log('MoveNet detector loaded successfully');
      
      setIsInitialized(true);
      setError(null);
    } catch (err) {
      console.error('Failed to initialize TensorFlow.js:', err);
      setError('Failed to initialize AI model. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  const detectPosesFromUri = useCallback(async (
    imageUri: string, 
    cameraFacing: 'front' | 'back' = 'back',
    cameraLayout: { width: number; height: number } = { width: screenWidth, height: screenHeight }
  ) => {
    if (!detectorRef.current || isProcessingRef.current) {
      return;
    }

    isProcessingRef.current = true;
    
    try {
      let imageElement: HTMLImageElement | tf.Tensor3D;
      let originalWidth = screenWidth;
      let originalHeight = screenHeight;
      
      if (Platform.OS === 'web') {
        // Web platform - create image element
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            originalWidth = img.naturalWidth;
            originalHeight = img.naturalHeight;
            resolve();
          };
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = imageUri;
        });
        
        imageElement = img;
      } else {
        // Mobile platform - create tensor from image
        try {
          const response = await fetch(imageUri);
          const arrayBuffer = await response.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // Decode image to get dimensions and tensor
          const imageTensor = tf.node.decodeImage(uint8Array, 3) as tf.Tensor3D;
          const [height, width] = imageTensor.shape;
          
          originalWidth = width;
          originalHeight = height;
          imageElement = imageTensor;
        } catch (err) {
          console.error('Mobile image processing error:', err);
          // Fallback: assume camera dimensions
          originalWidth = screenWidth;
          originalHeight = screenHeight;
          
          // Create a dummy tensor for testing
          const dummyTensor = tf.zeros([originalHeight, originalWidth, 3]) as tf.Tensor3D;
          imageElement = dummyTensor;
        }
      }
      
      // Detect poses using the proper API
      const detectedPoses = await detectorRef.current.estimatePoses(imageElement);
      
      // Calculate scaling factors for coordinate transformation
      // The model processes images at various sizes, but we need to scale back to camera view
      const scaleX = cameraLayout.width / originalWidth;
      const scaleY = cameraLayout.height / originalHeight;
      
      // Convert to our pose format with proper coordinate transformation
      const convertedPoses: Pose[] = detectedPoses.map(pose => ({
        keypoints: pose.keypoints.map(kp => ({
          x: cameraFacing === 'front' 
            ? cameraLayout.width - (kp.x * scaleX) // Mirror X for front camera
            : kp.x * scaleX, // Normal X for back camera
          y: kp.y * scaleY, // Scale Y coordinate to screen height
          score: kp.score || 0,
          name: kp.name || 'unknown',
        })),
        score: pose.score || 0,
      }));
      
      setPoses(convertedPoses);
      
      // Cleanup tensor if created
      if (Platform.OS !== 'web' && imageElement instanceof tf.Tensor) {
        imageElement.dispose();
      }
      
    } catch (err) {
      console.error('Error detecting poses:', err);
      setError('Failed to detect poses. Please try again.');
    } finally {
      isProcessingRef.current = false;
    }
  }, []);

  const cleanup = useCallback(() => {
    if (detectorRef.current) {
      detectorRef.current.dispose();
      detectorRef.current = null;
    }
    setIsInitialized(false);
    setPoses([]);
  }, []);

  return {
    poses,
    isLoading,
    error,
    isInitialized,
    detectPosesFromUri,
    initializeTensorFlow,
    cleanup,
  };
}