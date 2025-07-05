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
        // Mobile platform - convert to tensor
        const response = await fetch(imageUri);
        const arrayBuffer = await response.arrayBuffer();
        const imageArray = new Uint8Array(arrayBuffer);
        
        // Create a simple image tensor for mobile
        // Note: This is a simplified approach - in production you'd want proper image decoding
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            resolve();
          };
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = imageUri;
        });
        
        imageElement = tf.browser.fromPixels(canvas);
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