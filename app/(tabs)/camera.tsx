import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { CameraType, useCameraPermissions } from 'expo-camera';
import { Camera, RotateCcw, Play, Pause, Activity } from 'lucide-react-native';
import { PoseCanvas } from '@/components/PoseCanvas';
import TensorCameraStream from '@/components/TensorCameraStream';
import { Pose } from '@/types/pose';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [poses, setPoses] = useState<Pose[]>([]);
  const [isTfReady, setIsTfReady] = useState(false);
  const [stats, setStats] = useState({
    fps: 0,
    frameCount: 0,
    poseCount: 0,
    avgConfidence: 0,
  });
  
  const frameCountRef = useRef(0);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const initializeTensorFlow = async () => {
      try {
        // Wait for TensorFlow to be ready
        await tf.ready();
        setIsTfReady(true);
      } catch (error) {
        console.error('Failed to initialize TensorFlow:', error);
      }
    };

    initializeTensorFlow();
  }, []);

  useEffect(() => {
    if (poses.length > 0 && isAnalyzing) {
      updateStats();
    }
  }, [poses, isAnalyzing]);

  const handlePosesDetected = (detectedPoses: Pose[]) => {
    setPoses(detectedPoses);
    if (isAnalyzing) {
      frameCountRef.current++;
    }
  };

  const handleFpsUpdate = (fps: number) => {
    setStats(prev => ({ ...prev, fps }));
  };

  const updateStats = () => {
    const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
    
    const confidenceSum = poses.reduce((sum, pose) => {
      const avgPoseConfidence = pose.keypoints.reduce((kSum, kp) => kSum + kp.score, 0) / pose.keypoints.length;
      return sum + avgPoseConfidence;
    }, 0);
    
    setStats(prev => ({
      ...prev,
      frameCount: frameCountRef.current,
      poseCount: poses.length,
      avgConfidence: poses.length > 0 ? Math.round((confidenceSum / poses.length) * 100) : 0,
    }));
  };

  const toggleAnalysis = () => {
    if (!isAnalyzing) {
      frameCountRef.current = 0;
      startTimeRef.current = Date.now();
    }
    setIsAnalyzing(!isAnalyzing);
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Camera size={64} color="#007AFF" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need access to your camera to detect poses in real-time.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!isTfReady) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Activity size={48} color="#007AFF" />
          <Text style={styles.loadingText}>Initializing AI Model...</Text>
          <Text style={styles.loadingSubtext}>This may take a moment</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <TensorCameraStream
          facing={facing}
          onPosesDetected={handlePosesDetected}
          onFpsUpdate={handleFpsUpdate}
          isAnalyzing={isAnalyzing}
        />
      </View>
      
      {/* Pose visualization overlay */}
      <PoseCanvas poses={poses} />
      
      {/* Stats overlay */}
      <View style={styles.statsContainer}>
        <View style={styles.statsBox}>
          <Text style={styles.statsLabel}>FPS</Text>
          <Text style={styles.statsValue}>{stats.fps}</Text>
        </View>
        <View style={styles.statsBox}>
          <Text style={styles.statsLabel}>Poses</Text>
          <Text style={styles.statsValue}>{stats.poseCount}</Text>
        </View>
        <View style={styles.statsBox}>
          <Text style={styles.statsLabel}>Confidence</Text>
          <Text style={styles.statsValue}>{stats.avgConfidence}%</Text>
        </View>
      </View>

      {/* Control buttons */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
          <RotateCcw size={24} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.analyzeButton, isAnalyzing && styles.analyzeButtonActive]} 
          onPress={toggleAnalysis}
        >
          {isAnalyzing ? <Pause size={32} color="#fff" /> : <Play size={32} color="#fff" />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  loadingSubtext: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 8,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 12,
  },
  permissionText: {
    color: '#8E8E93',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    flexDirection: 'column',
    gap: 8,
  },
  statsBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    padding: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  statsLabel: {
    color: '#8E8E93',
    fontSize: 10,
    fontWeight: '500',
  },
  statsValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 35,
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzeButtonActive: {
    backgroundColor: '#ff4444',
  },
});