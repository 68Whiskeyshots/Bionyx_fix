import { useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import * as tf from '@tensorflow/tfjs';
import { Pose } from '@/types/pose';

export function usePoseDetection() {
  const [poses, setPoses] = useState<Pose[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const modelRef = useRef<tf.GraphModel | null>(null);
  const isProcessingRef = useRef(false);

  const initializeTensorFlow = useCallback(async () => {
    if (isInitialized) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Platform-specific initialization
      if (Platform.OS === 'web') {
        // Web platform
        await tf.setBackend('webgl');
      } else {
        // Mobile platform - use CPU backend for Expo Go compatibility
        await tf.setBackend('cpu');
      }
      
      await tf.ready();
      
      // Load MoveNet model - use a CORS-friendly alternative URL
      const modelUrl = 'https://storage.googleapis.com/tfjs-models/savedmodel/movenet/singlepose/lightning/4/model.json';
      console.log('Loading MoveNet model...');
      
      const model = await tf.loadGraphModel(modelUrl);
      modelRef.current = model;
      
      console.log('Model loaded successfully');
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
    if (!modelRef.current || isProcessingRef.current) {
      return;
    }

    isProcessingRef.current = true;
    
    try {
      let imageTensor: tf.Tensor3D;
      
      if (Platform.OS === 'web') {
        // Web platform
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imageUri;
        });
        
        imageTensor = tf.browser.fromPixels(img);
      } else {
        // Mobile platform - use node.js image decoding
        const response = await fetch(imageUri);
        const arrayBuffer = await response.arrayBuffer();
        const imageBuffer = new Uint8Array(arrayBuffer);
        
        // Decode image using TensorFlow.js node utilities
        imageTensor = tf.node.decodeImage(imageBuffer, 3) as tf.Tensor3D;
      }
      
      // Preprocess image for MoveNet
      const resized = tf.image.resizeBilinear(imageTensor, [192, 192]);
      const normalized = resized.div(255.0);
      const batched = normalized.expandDims(0);
      
      // Run inference
      const predictions = modelRef.current.predict(batched) as tf.Tensor;
      const predictionData = await predictions.data();
      
      // Parse MoveNet output
      const poses = parseMoveNetOutput(predictionData, 192, 192);
      
      setPoses(poses);
      
      // Cleanup tensors
      imageTensor.dispose();
      resized.dispose();
      normalized.dispose();
      batched.dispose();
      predictions.dispose();
      
    } catch (err) {
      console.error('Error detecting poses:', err);
      setError('Failed to detect poses. Please try again.');
    } finally {
      isProcessingRef.current = false;
    }
  }, []);

  const parseMoveNetOutput = (data: Float32Array, width: number, height: number): Pose[] => {
    const poses: Pose[] = [];
    const numKeypoints = 17;
    
    // MoveNet outputs keypoints in format [y, x, confidence]
    const keypoints = [];
    for (let i = 0; i < numKeypoints; i++) {
      const y = data[i * 3];
      const x = data[i * 3 + 1];
      const confidence = data[i * 3 + 2];
      
      keypoints.push({
        x: x * width,
        y: y * height,
        score: confidence,
        name: getKeypointName(i),
      });
    }
    
    // Filter out low-confidence keypoints
    const validKeypoints = keypoints.filter(kp => kp.score > 0.3);
    
    if (validKeypoints.length > 0) {
      const avgScore = validKeypoints.reduce((sum, kp) => sum + kp.score, 0) / validKeypoints.length;
      
      poses.push({
        keypoints: validKeypoints,
        score: avgScore,
      });
    }
    
    return poses;
  };

  const getKeypointName = (index: number): string => {
    const keypointNames = [
      'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
      'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
      'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
      'left_knee', 'right_knee', 'left_ankle', 'right_ankle'
    ];
    return keypointNames[index] || `keypoint_${index}`;
  };

  const cleanup = useCallback(() => {
    if (modelRef.current) {
      modelRef.current.dispose();
      modelRef.current = null;
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