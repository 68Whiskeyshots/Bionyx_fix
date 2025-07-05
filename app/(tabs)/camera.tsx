import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, Platform } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { Camera, RotateCcw, Play, Pause, Activity, Video, Square } from 'lucide-react-native';
import { usePoseDetection } from '@/hooks/usePoseDetection';
import PoseCanvas from '@/components/PoseCanvas';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaLibraryPermission, requestMediaLibraryPermission] = MediaLibrary.usePermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [countdownValue, setCountdownValue] = useState(0);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownEnabled, setCountdownEnabled] = useState(true);
  const [countdownDuration, setCountdownDuration] = useState(3);
  const [saveVideoEnabled, setSaveVideoEnabled] = useState(true);
  const [cameraLayout, setCameraLayout] = useState({ 
    width: screenWidth, 
    height: screenHeight 
  });
  const [stats, setStats] = useState({
    fps: 0,
    frameCount: 0,
    poseCount: 0,
    avgConfidence: 0,
  });
  
  const cameraRef = useRef<CameraView>(null);
  const analysisInterval = useRef<NodeJS.Timeout>();
  const countdownInterval = useRef<NodeJS.Timeout>();
  const frameCountRef = useRef(0);
  const startTimeRef = useRef(Date.now());

  const {
    poses,
    isLoading,
    error,
    detectPosesFromUri,
    initializeTensorFlow,
    cleanup,
  } = usePoseDetection();

  useEffect(() => {
    initializeTensorFlow();
    return cleanup;
  }, []);

  useEffect(() => {
    if (isAnalyzing && !isRecording) {
      startAnalysis();
    } else if (!isAnalyzing && !isRecording) {
      stopAnalysis();
    }
    return () => stopAnalysis();
  }, [isAnalyzing, isRecording]);

  useEffect(() => {
    if (poses.length > 0) {
      updateStats();
    }
  }, [poses]);

  const startAnalysis = () => {
    frameCountRef.current = 0;
    startTimeRef.current = Date.now();
    
    analysisInterval.current = setInterval(async () => {
      if (cameraRef.current && !isLoading) {
        try {
          const photo = await cameraRef.current.takePictureAsync({
            quality: 0.7,
            base64: false,
            skipProcessing: true,
          });
          
          if (photo?.uri) {
            await detectPosesFromUri(photo.uri, facing, cameraLayout);
            frameCountRef.current++;
          }
        } catch (err) {
          console.error('Failed to capture/analyze frame:', err);
        }
      }
    }, 200); // 5 FPS
  };

  const stopAnalysis = () => {
    if (analysisInterval.current) {
      clearInterval(analysisInterval.current);
      analysisInterval.current = undefined;
    }
  };

  const startCountdown = () => {
    setShowCountdown(true);
    setCountdownValue(countdownDuration);
    
    countdownInterval.current = setInterval(() => {
      setCountdownValue((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval.current!);
          setShowCountdown(false);
          startRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelCountdown = () => {
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = undefined;
    }
    setShowCountdown(false);
    setCountdownValue(0);
  };

  const startRecording = async () => {
    if (!cameraRef.current) return;

    // Check media library permissions for saving video
    if (Platform.OS !== 'web' && saveVideoEnabled && !mediaLibraryPermission?.granted) {
      const { granted } = await requestMediaLibraryPermission();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Media library access is needed to save videos to your device.'
        );
        return;
      }
    }

    try {
      setIsRecording(true);
      setIsAnalyzing(true); // Continue pose detection during recording
      
      const videoRecordPromise = cameraRef.current.recordAsync({
        quality: '720p',
        maxDuration: 60, // 60 seconds max
        mute: false,
      });

      console.log('Recording started...');
      
      // Wait for recording to complete
      const video = await videoRecordPromise;
      
      if (video && saveVideoEnabled && Platform.OS !== 'web') {
        try {
          await MediaLibrary.saveToLibraryAsync(video.uri);
          Alert.alert('Success', 'Video saved to your photo library!');
        } catch (saveError) {
          console.error('Failed to save video:', saveError);
          Alert.alert('Error', 'Failed to save video to library');
        }
      }
      
    } catch (err) {
      console.error('Recording failed:', err);
      Alert.alert('Error', 'Failed to record video');
    } finally {
      setIsRecording(false);
      setIsAnalyzing(false);
    }
  };

  const stopRecording = async () => {
    if (!cameraRef.current || !isRecording) return;
    
    try {
      await cameraRef.current.stopRecording();
      console.log('Recording stopped');
    } catch (err) {
      console.error('Failed to stop recording:', err);
    }
  };

  const updateStats = () => {
    const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
    const fps = elapsedTime > 0 ? frameCountRef.current / elapsedTime : 0;
    
    const confidenceSum = poses.reduce((sum, pose) => {
      const avgPoseConfidence = pose.keypoints.reduce((kSum, kp) => kSum + kp.score, 0) / pose.keypoints.length;
      return sum + avgPoseConfidence;
    }, 0);
    
    setStats({
      fps: Math.round(fps * 10) / 10,
      frameCount: frameCountRef.current,
      poseCount: poses.length,
      avgConfidence: poses.length > 0 ? Math.round((confidenceSum / poses.length) * 100) : 0,
    });
  };

  const toggleAnalysis = () => {
    if (isRecording) {
      // Stop recording
      stopRecording();
    } else if (showCountdown) {
      // Cancel countdown
      cancelCountdown();
    } else if (isAnalyzing) {
      // Stop analysis
      setIsAnalyzing(false);
    } else {
      // Start countdown or recording
      if (countdownEnabled) {
        startCountdown();
      } else {
        startRecording();
      }
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const getButtonIcon = () => {
    if (isRecording) return <Square size={32} color="#fff" />;
    if (showCountdown) return <Activity size={32} color="#fff" />;
    if (isAnalyzing) return <Pause size={32} color="#fff" />;
    return <Play size={32} color="#fff" />;
  };

  const getButtonStyle = () => {
    if (isRecording) return [styles.analyzeButton, styles.recordButtonActive];
    if (showCountdown) return [styles.analyzeButton, styles.countdownButtonActive];
    if (isAnalyzing) return [styles.analyzeButton, styles.analyzeButtonActive];
    return styles.analyzeButton;
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
            We need access to your camera to detect poses and record videos.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading) {
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

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={initializeTensorFlow}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        mode="video"
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          console.log('Camera layout:', { width, height, facing });
          setCameraLayout({ width, height });
        }}
      >
      </CameraView>
      
      {/* Countdown overlay */}
      {showCountdown && (
        <View style={styles.countdownOverlay}>
          <Text style={styles.countdownText}>{countdownValue}</Text>
          <Text style={styles.countdownLabel}>Get Ready!</Text>
        </View>
      )}
      
      {/* Recording indicator */}
      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>REC</Text>
        </View>
      )}
      
      {/* Pose visualization overlay - positioned outside CameraView */}
      <PoseCanvas poses={poses} cameraFacing={facing} cameraLayout={cameraLayout} />
      
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
          style={getButtonStyle()} 
          onPress={toggleAnalysis}
        >
          {getButtonIcon()}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={() => setCountdownEnabled(!countdownEnabled)}
        >
          <Text style={[styles.controlButtonText, { color: countdownEnabled ? '#007AFF' : '#8E8E93' }]}>
            {countdownDuration}s
          </Text>
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
  camera: {
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    color: '#ff4444',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
  },
  errorText: {
    color: '#8E8E93',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  countdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 10,
  },
  countdownText: {
    color: '#fff',
    fontSize: 120,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  countdownLabel: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 60,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 5,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 6,
  },
  recordingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    flexDirection: 'column',
    gap: 8,
    zIndex: 5,
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
    zIndex: 5,
  },
  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
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
  countdownButtonActive: {
    backgroundColor: '#FF9500',
  },
  recordButtonActive: {
    backgroundColor: '#ff0000',
  },
});