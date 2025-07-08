import { useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { Platform } from 'react-native';
import { Pose } from '@/types/pose';

export function usePoseDetection() {
  const [poses, setPoses] = useState<Pose[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detector, setDetector] = useState<poseDetection.PoseDetector | null>(null);

  const initializeTensorFlow = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize TensorFlow.js
      await tf.ready();
      console.log('TensorFlow.js initialized with backend:', tf.getBackend());

      // Load MoveNet model
      const movenetModelConfig: poseDetection.MoveNetModelConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,
        enableSmoothing: true,
      };

      const newDetector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        movenetModelConfig
      );

      setDetector(newDetector);
      setIsLoading(false);
    } catch (err) {
      console.error('Error initializing TensorFlow:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize AI model');
      setIsLoading(false);
    }
  }, []);

  const cleanup = useCallback(() => {
    if (detector) {
      detector.dispose();
      setDetector(null);
    }
  }, [detector]);

  return {
    poses,
    isLoading,
    error,
    initializeTensorFlow,
    cleanup,
  };
}