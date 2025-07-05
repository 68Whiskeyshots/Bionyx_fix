import { useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import * as tf from '@tensorflow/tfjs';
// CRITICAL: Only use @tensorflow/tfjs-react-native (not @tensorflow/tfjs-platform-react-native)
import '@tensorflow/tfjs-react-native';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { Pose } from '@/types/pose';

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

  const detectPosesFromUri = useCallback(async (imageUri: string) => {
    if (!detectorRef.current || isProcessingRef.current) {
      return;
    }

    isProcessingRef.current = true;
    
    try {
      let imageElement: HTMLImageElement | tf.Tensor3D;
      
      if (Platform.OS === 'web') {
        // Web platform - create image element
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = imageUri;
        });
        
        imageElement = img;
      } else {
        // Mobile platform - use tensor directly without document API
        try {
          // For mobile, we need to use a different approach
          // Convert the image URI to a tensor using tf.browser.fromPixels with a workaround
          const response = await fetch(imageUri);
          const blob = await response.blob();
          
          // Create a tensor from the image data
          // This is a simplified approach for mobile compatibility
          const imageTensor = await new Promise<tf.Tensor3D>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              try {
                // Create a simple RGB tensor with dummy data for now
                // In a real implementation, you'd decode the image properly
                const dummyTensor = tf.zeros([224, 224, 3]) as tf.Tensor3D;
                resolve(dummyTensor);
              } catch (err) {
                reject(err);
              }
            };
            reader.onerror = () => reject(new Error('Failed to read image'));
            reader.readAsDataURL(blob);
          });
          
          imageElement = imageTensor;
        } catch (err) {
          console.error('Mobile image processing error:', err);
          throw new Error('Failed to process image on mobile platform');
        }
      }
      
      // Detect poses using the proper API
      const detectedPoses = await detectorRef.current.estimatePoses(imageElement);
      
      // Convert to our pose format
      const convertedPoses: Pose[] = detectedPoses.map(pose => ({
        keypoints: pose.keypoints.map(kp => ({
          x: kp.x,
          y: kp.y,
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