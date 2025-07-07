import { useState, useCallback, useRef } from 'react';
import { Platform, Dimensions } from 'react-native';
import * as tf from '@tensorflow/tfjs';
// CRITICAL: Only use @tensorflow/tfjs-react-native (not @tensorflow/tfjs-platform-react-native)
import '@tensorflow/tfjs-react-native';
import { decodeJpeg } from '@tensorflow/tfjs-react-native';
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
      console.log('TensorFlow initialization complete, ready for inference');
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
    cameraLayout: { width: number; height: number } = { width: screenWidth, height: screenHeight },
    base64?: string
  ) => {
    if (!detectorRef.current) {
      console.warn('Detector not initialized');
      return;
    }
    
    // For real-time inference, we'll allow overlapping processing
    // but still track if we're processing to provide feedback
    if (isProcessingRef.current) {
      console.log('Still processing previous frame, but continuing with new frame');
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
          console.log('Processing image for mobile platform');
          console.log('Image URI:', imageUri);
          
          // First, let's check if we have base64 data
          if (base64) {
            console.log('Using base64 image data, length:', base64?.length || 0);
            
            // Remove the data:image/jpeg;base64, prefix if present
            const base64Data = base64.replace(/^data:image\/[a-z]+;base64,/, '');
            
            // Convert base64 to Uint8Array
            // Using a simple base64 decoder that works in React Native
            const base64ToUint8Array = (base64: string): Uint8Array => {
              const binaryString = typeof atob !== 'undefined' ? atob(base64) : (() => {
                // Simple base64 decoder for React Native
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
                let str = base64.replace(/=+$/, '');
                let output = '';
                
                if (str.length % 4 === 1) {
                  throw new Error('Invalid base64 string');
                }
                
                for (let bc = 0, bs = 0, buffer, i = 0; buffer = str.charAt(i++);
                  ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) 
                    ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
                ) {
                  buffer = chars.indexOf(buffer);
                }
                
                return output;
              })();
              
              const uint8Array = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                uint8Array[i] = binaryString.charCodeAt(i);
              }
              return uint8Array;
            };
            
            const uint8Array = base64ToUint8Array(base64Data);
            
            console.log('Converted base64 to binary, size:', uint8Array.length, 'bytes');
            
            // Decode JPEG image to tensor
            let imageTensor = decodeJpeg(uint8Array, 3) as tf.Tensor3D;
            let [height, width, channels] = imageTensor.shape;
            
            console.log('Decoded image tensor shape:', [height, width, channels]);
            
            // Ensure dimensions are integers
            if (!Number.isInteger(height) || !Number.isInteger(width)) {
              console.warn('Non-integer dimensions detected, resizing to nearest integers');
              const targetHeight = Math.round(height);
              const targetWidth = Math.round(width);
              
              // Resize the tensor to have integer dimensions
              const resizedTensor = tf.image.resizeBilinear(imageTensor, [targetHeight, targetWidth]);
              imageTensor.dispose();
              imageTensor = resizedTensor as tf.Tensor3D;
              height = targetHeight;
              width = targetWidth;
              
              console.log('Resized tensor shape:', [height, width, channels]);
            }
            
            originalWidth = width;
            originalHeight = height;
            imageElement = imageTensor;
          } else {
            // For URI-based images on mobile, we need a different approach
            // Since fetch might not work with file:// URIs on some platforms
            console.log('URI-based image detected, using fallback approach');
            
            // For now, create a dummy tensor to test the pipeline
            // In a production app, you would need to use a proper image loading library
            const dummyWidth = cameraLayout.width || screenWidth;
            const dummyHeight = cameraLayout.height || screenHeight;
            
            console.warn('Creating dummy tensor for testing. Implement proper image loading for production.');
            const imageTensor = tf.zeros([dummyHeight, dummyWidth, 3], 'int32') as tf.Tensor3D;
            
            originalWidth = dummyWidth;
            originalHeight = dummyHeight;
            imageElement = imageTensor;
          }
        } catch (err) {
          console.error('Mobile image processing error:', err);
          console.error('Error details:', {
            message: err.message,
            stack: err.stack,
            imageUri,
            hasBase64: !!base64
          });
          
          // Create a fallback dummy tensor to prevent app crash
          console.log('Creating fallback dummy tensor');
          const fallbackTensor = tf.zeros([256, 256, 3], 'float32') as tf.Tensor3D;
          originalWidth = 256;
          originalHeight = 256;
          imageElement = fallbackTensor;
        }
      }
      
      // Preprocess the image for MoveNet if it's a tensor
      if (Platform.OS !== 'web' && imageElement instanceof tf.Tensor) {
        // MoveNet expects normalized pixel values in range [0, 1]
        const normalizedTensor = tf.div(imageElement, 255.0);
        
        // Ensure the tensor has the right dtype
        const floatTensor = tf.cast(normalizedTensor, 'float32');
        
        // Dispose of the original tensor and use the preprocessed one
        (imageElement as tf.Tensor).dispose();
        normalizedTensor.dispose();
        imageElement = floatTensor;
        
        console.log('Preprocessed tensor for MoveNet:', floatTensor.shape, floatTensor.dtype);
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
      console.error('Error stack:', err.stack);
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