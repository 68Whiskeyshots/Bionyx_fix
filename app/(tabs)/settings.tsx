import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useState } from 'react';
import { Settings, Info, Zap, Shield, Smartphone, Video, Timer, Save } from 'lucide-react-native';

export default function SettingsScreen() {
  const [highPerformanceMode, setHighPerformanceMode] = useState(false);
  const [showConfidence, setShowConfidence] = useState(false);
  const [showKeypoints, setShowKeypoints] = useState(true);
  const [countdownEnabled, setCountdownEnabled] = useState(true);
  const [countdownDuration, setCountdownDuration] = useState(3);
  const [saveVideoEnabled, setSaveVideoEnabled] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  const handleCountdownDurationChange = (duration: number) => {
    setCountdownDuration(duration);
  };

  const showFeatureInfo = (feature: string) => {
    let message = '';
    switch (feature) {
      case 'countdown':
        message = 'Countdown timer gives you time to get into position before recording starts. You can adjust the duration or disable it completely.';
        break;
      case 'autosave':
        message = 'When enabled, recorded videos are automatically saved to your device\'s photo library. Requires media library permissions.';
        break;
      case 'performance':
        message = 'High performance mode increases processing speed but uses more battery. Recommended for longer recording sessions.';
        break;
      default:
        message = 'This feature enhances your pose detection experience.';
    }
    
    Alert.alert('Feature Info', message);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Settings size={32} color="#007AFF" />
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recording</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Timer size={20} color="#007AFF" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Countdown Timer</Text>
              <Text style={styles.settingDescription}>
                {countdownEnabled ? `${countdownDuration} second countdown before recording` : 'Start recording immediately'}
              </Text>
            </View>
          </View>
          <View style={styles.settingControls}>
            <TouchableOpacity 
              style={styles.infoButton} 
              onPress={() => showFeatureInfo('countdown')}
            >
              <Info size={16} color="#8E8E93" />
            </TouchableOpacity>
            <Switch
              value={countdownEnabled}
              onValueChange={setCountdownEnabled}
              trackColor={{ false: '#767577', true: '#007AFF' }}
              thumbColor={countdownEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {countdownEnabled && (
          <View style={styles.subSettingContainer}>
            <Text style={styles.subSettingLabel}>Countdown Duration</Text>
            <View style={styles.durationButtons}>
              {[1, 3, 5, 10].map((duration) => (
                <TouchableOpacity
                  key={duration}
                  style={[
                    styles.durationButton,
                    countdownDuration === duration && styles.durationButtonActive
                  ]}
                  onPress={() => handleCountdownDurationChange(duration)}
                >
                  <Text style={[
                    styles.durationButtonText,
                    countdownDuration === duration && styles.durationButtonTextActive
                  ]}>
                    {duration}s
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Save size={20} color="#007AFF" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Auto-Save Videos</Text>
              <Text style={styles.settingDescription}>
                Automatically save recorded videos to photo library
              </Text>
            </View>
          </View>
          <View style={styles.settingControls}>
            <TouchableOpacity 
              style={styles.infoButton} 
              onPress={() => showFeatureInfo('autosave')}
            >
              <Info size={16} color="#8E8E93" />
            </TouchableOpacity>
            <Switch
              value={saveVideoEnabled}
              onValueChange={setSaveVideoEnabled}
              trackColor={{ false: '#767577', true: '#007AFF' }}
              thumbColor={saveVideoEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Zap size={20} color="#007AFF" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>High Performance Mode</Text>
              <Text style={styles.settingDescription}>
                Increase processing speed (uses more battery)
              </Text>
            </View>
          </View>
          <View style={styles.settingControls}>
            <TouchableOpacity 
              style={styles.infoButton} 
              onPress={() => showFeatureInfo('performance')}
            >
              <Info size={16} color="#8E8E93" />
            </TouchableOpacity>
            <Switch
              value={highPerformanceMode}
              onValueChange={setHighPerformanceMode}
              trackColor={{ false: '#767577', true: '#007AFF' }}
              thumbColor={highPerformanceMode ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Display</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Show Confidence Scores</Text>
              <Text style={styles.settingDescription}>
                Display pose detection confidence percentages
              </Text>
            </View>
          </View>
          <Switch
            value={showConfidence}
            onValueChange={setShowConfidence}
            trackColor={{ false: '#767577', true: '#007AFF' }}
            thumbColor={showConfidence ? '#fff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Show Keypoints</Text>
              <Text style={styles.settingDescription}>
                Display individual body keypoints and skeleton
              </Text>
            </View>
          </View>
          <Switch
            value={showKeypoints}
            onValueChange={setShowKeypoints}
            trackColor={{ false: '#767577', true: '#007AFF' }}
            thumbColor={showKeypoints ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Video Recording</Text>
        
        <View style={styles.infoCard}>
          <Video size={24} color="#007AFF" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Recording Features</Text>
            <Text style={styles.infoText}>
              Record your pose detection sessions with optional countdown timer. 
              Videos are saved in 720p quality with pose overlays included.
            </Text>
          </View>
        </View>

        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Timer size={16} color="#34C759" />
            <Text style={styles.featureText}>Customizable countdown timer (1-10 seconds)</Text>
          </View>
          <View style={styles.featureItem}>
            <Save size={16} color="#34C759" />
            <Text style={styles.featureText}>Auto-save to photo library</Text>
          </View>
          <View style={styles.featureItem}>
            <Video size={16} color="#34C759" />
            <Text style={styles.featureText}>720p HD video quality</Text>
          </View>
          <View style={styles.featureItem}>
            <Zap size={16} color="#34C759" />
            <Text style={styles.featureText}>Real-time pose overlay during recording</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        
        <View style={styles.infoCard}>
          <Info size={24} color="#007AFF" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>TensorFlow.js Pose Detection</Text>
            <Text style={styles.infoText}>
              This app uses TensorFlow.js MoveNet model to detect human poses in real-time.
              All processing happens on your device for maximum privacy.
            </Text>
          </View>
        </View>

        <View style={styles.specsList}>
          <View style={styles.specItem}>
            <Shield size={16} color="#34C759" />
            <Text style={styles.specText}>Privacy-first: On-device processing</Text>
          </View>
          <View style={styles.specItem}>
            <Smartphone size={16} color="#34C759" />
            <Text style={styles.specText}>Expo Go compatible</Text>
          </View>
          <View style={styles.specItem}>
            <Zap size={16} color="#34C759" />
            <Text style={styles.specText}>Optimized for mobile performance</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Built with React Native & TensorFlow.js
        </Text>
        <Text style={styles.footerVersion}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C1E',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
  },
  settingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoButton: {
    padding: 4,
  },
  subSettingContainer: {
    backgroundColor: '#2C2C2E',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
  },
  subSettingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 12,
  },
  durationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  durationButton: {
    backgroundColor: '#3A3A3C',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 50,
    alignItems: 'center',
  },
  durationButtonActive: {
    backgroundColor: '#007AFF',
  },
  durationButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  durationButtonTextActive: {
    color: '#fff',
  },
  infoCard: {
    backgroundColor: '#1C1C1E',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  featuresList: {
    paddingHorizontal: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  specsList: {
    paddingHorizontal: 20,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  specText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 12,
    color: '#636366',
  },
});