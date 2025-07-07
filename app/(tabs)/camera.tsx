import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, Platform } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Camera, RotateCcw, Play, Square, Activity, Timer } from 'lucide-react-native';
import { usePoseDetection } from '@/hooks/usePoseDetection';
import PoseCanvas from '@/components/PoseCanvas';
import { COLORS } from '@/constants/colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedDelay, setSelectedDelay] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [showTimerOptions, setShowTimerOptions] = useState(false);
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
    isInitialized,
    detectPosesFromUri,
    initializeTensorFlow,
    cleanup,
  } = usePoseDetection();

  useEffect(() => {
    initializeTensorFlow();
    return cleanup;
  }, []);

  useEffect(() => {
    if (isAnalyzing) {
      startAnalysis();
    } else {
      stopAnalysis();
    }
    return () => {
      stopAnalysis();
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    };
  }, [isAnalyzing]);

  useEffect(() => {
    if (poses.length > 0) {
      updateStats();
    }
  }, [poses]);

  const startAnalysis = () => {
    console.log('Starting analysis...');
    frameCountRef.current = 0;
    startTimeRef.current = Date.now();
    
    analysisInterval.current = setInterval(async () => {
      console.log('Analysis interval tick, isInitialized:', isInitialized);
      if (cameraRef.current && !isLoading && isInitialized) {
        try {
          console.log('Taking picture...');
          // For mobile platforms, use base64 to avoid file:// URI issues
          const photo = await cameraRef.current.takePictureAsync({
            quality: 0.5, // Lower quality for better performance
            base64: true,
            skipProcessing: true,
          });
          
          if (photo?.uri) {
            console.log('Photo captured, calling detectPosesFromUri');
            // Don't await to allow next frame to be processed
            detectPosesFromUri(photo.uri, facing, cameraLayout, photo.base64).then(() => {
              console.log('Frame processed:', frameCountRef.current);
            }).catch(err => {
              console.error('Error in detectPosesFromUri:', err);
            });
            frameCountRef.current++;
          } else {
            console.error('No photo URI received');
          }
        } catch (err) {
          console.error('Failed to capture/analyze frame:', err);
        }
      }
    }, 100); // 10 FPS for more responsive real-time inference
  };

  const stopAnalysis = () => {
    console.log('Stopping analysis...');
    if (analysisInterval.current) {
      clearInterval(analysisInterval.current);
      analysisInterval.current = undefined;
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
    if (isAnalyzing) {
      // Stop analysis
      setIsAnalyzing(false);
      setCountdown(0);
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    } else {
      // Start analysis with countdown
      if (selectedDelay > 0) {
        startCountdown();
      } else {
        setIsAnalyzing(true);
      }
    }
  };

  const startCountdown = () => {
    setCountdown(selectedDelay);
    let timeLeft = selectedDelay;
    
    countdownInterval.current = setInterval(() => {
      timeLeft -= 1;
      setCountdown(timeLeft);
      
      if (timeLeft <= 0) {
        clearInterval(countdownInterval.current);
        setCountdown(0);
        setIsAnalyzing(true);
      }
    }, 1000);
  };

  const selectTimer = (seconds: number) => {
    setSelectedDelay(seconds);
    setShowTimerOptions(false);
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const getButtonIcon = () => {
    if (isAnalyzing) return <Square size={32} color="#fff" />;
    return <Play size={32} color="#fff" />;
  };

  const getButtonStyle = () => {
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
          <Camera size={64} color={COLORS.primaryBrandBlue} />
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

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Activity size={48} color={COLORS.primaryBrandBlue} />
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
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setCameraLayout({ width, height });
        }}
      />

      {/* Pose overlay */}
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

      {/* Timer selection overlay */}
      {showTimerOptions && (
        <View style={styles.timerOptionsOverlay}>
          <View style={styles.timerOptionsContainer}>
            <Text style={styles.timerOptionsTitle}>Select Countdown Timer</Text>
            <View style={styles.timerOptionsGrid}>
              {[0, 5, 15, 30].map((seconds) => (
                <TouchableOpacity
                  key={seconds}
                  style={[
                    styles.timerOption,
                    selectedDelay === seconds && styles.timerOptionActive
                  ]}
                  onPress={() => selectTimer(seconds)}
                >
                  <Text style={[
                    styles.timerOptionText,
                    selectedDelay === seconds && styles.timerOptionTextActive
                  ]}>
                    {seconds === 0 ? 'None' : `${seconds}s`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Countdown display */}
      {countdown > 0 && (
        <View style={styles.countdownOverlay}>
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownNumber}>{countdown}</Text>
            <Text style={styles.countdownText}>Get ready!</Text>
          </View>
        </View>
      )}

      {/* Control buttons */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
          <RotateCcw size={24} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={getButtonStyle()} 
          onPress={toggleAnalysis}
          disabled={countdown > 0}
        >
          {getButtonIcon()}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={() => setShowTimerOptions(!showTimerOptions)}
        >
          <Timer size={24} color="#fff" />
          {selectedDelay > 0 && (
            <View style={styles.timerBadge}>
              <Text style={styles.timerBadgeText}>{selectedDelay}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Instructions overlay */}
      {!isAnalyzing && poses.length === 0 && (
        <View style={styles.instructionsOverlay}>
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>Ready to detect poses!</Text>
            <Text style={styles.instructionsText}>
              • Tap play button to start pose detection{'\n'}
              • Stand in view for best results{'\n'}
              • Real-time analysis at 5 FPS
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  loadingSubtext: {
    color: COLORS.textSecondary,
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
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 12,
  },
  permissionText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: COLORS.primaryBrandBlue,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  permissionButtonText: {
    color: COLORS.textPrimary,
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
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.primaryBrandBlue,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
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
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '500',
  },
  statsValue: {
    color: COLORS.textPrimary,
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
  spacer: {
    width: 50,
  },
  analyzeButton: {
    backgroundColor: COLORS.primaryBrandBlue,
    borderRadius: 35,
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzeButtonActive: {
    backgroundColor: '#ff4444',
  },
  instructionsOverlay: {
    position: 'absolute',
    top: '30%',
    left: 20,
    right: 20,
    zIndex: 5,
  },
  instructionsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  instructionsTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  instructionsText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  timerOptionsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  timerOptionsContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 20,
    padding: 24,
    width: '80%',
    maxWidth: 300,
  },
  timerOptionsTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  timerOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  timerOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  timerOptionActive: {
    backgroundColor: COLORS.primaryBrandBlue,
    borderColor: COLORS.primaryBrandBlue,
  },
  timerOptionText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  timerOptionTextActive: {
    color: COLORS.textPrimary,
  },
  timerBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.primaryBrandBlue,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  timerBadgeText: {
    color: COLORS.textPrimary,
    fontSize: 10,
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
    zIndex: 10,
  },
  countdownContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 100,
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownNumber: {
    color: COLORS.primaryBrandBlue,
    fontSize: 72,
    fontWeight: '700',
  },
  countdownText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginTop: 8,
  },
});