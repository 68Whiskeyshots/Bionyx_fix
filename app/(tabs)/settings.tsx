import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useState } from 'react';
import { Settings, Info, Zap, Shield, Smartphone, Activity } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';

export default function SettingsScreen() {
  const [highPerformanceMode, setHighPerformanceMode] = useState(false);
  const [showConfidence, setShowConfidence] = useState(false);
  const [showKeypoints, setShowKeypoints] = useState(true);

  const showFeatureInfo = (feature: string) => {
    let message = '';
    switch (feature) {
      case 'performance':
        message = 'High performance mode increases processing speed but uses more battery. Recommended for longer analysis sessions.';
        break;
      case 'display':
        message = 'Customize how pose detection results are displayed on screen. Higher confidence keypoints appear larger and more opaque.';
        break;
      default:
        message = 'This feature enhances your pose detection experience.';
    }
    
    Alert.alert('Feature Info', message);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Settings size={32} color={COLORS.primaryBrandBlue} />
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pose Detection</Text>
        
        <View style={styles.infoCard}>
          <Activity size={24} color={COLORS.primaryBrandBlue} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Real-time Analysis</Text>
            <Text style={styles.infoText}>
              BIONYX analyzes poses in real-time at 5 FPS. Simply tap the play button to start analysis.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Zap size={20} color={COLORS.primaryBrandBlue} />
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
              <Info size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <Switch
              value={highPerformanceMode}
              onValueChange={setHighPerformanceMode}
              trackColor={{ false: '#767577', true: COLORS.primaryBrandBlue }}
              thumbColor={highPerformanceMode ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Display</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Info size={20} color={COLORS.primaryBrandBlue} />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Show Confidence Scores</Text>
              <Text style={styles.settingDescription}>
                Display pose detection confidence percentages
              </Text>
            </View>
          </View>
          <View style={styles.settingControls}>
            <TouchableOpacity 
              style={styles.infoButton} 
              onPress={() => showFeatureInfo('display')}
            >
              <Info size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <Switch
              value={showConfidence}
              onValueChange={setShowConfidence}
              trackColor={{ false: '#767577', true: COLORS.primaryBrandBlue }}
              thumbColor={showConfidence ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Shield size={20} color={COLORS.primaryBrandBlue} />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Show Keypoints</Text>
              <Text style={styles.settingDescription}>
                Display individual body keypoints and skeleton
              </Text>
            </View>
          </View>
          <View style={styles.settingControls}>
            <TouchableOpacity 
              style={styles.infoButton} 
              onPress={() => showFeatureInfo('display')}
            >
              <Info size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <Switch
              value={showKeypoints}
              onValueChange={setShowKeypoints}
              trackColor={{ false: '#767577', true: COLORS.primaryBrandBlue }}
              thumbColor={showKeypoints ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        
        <View style={styles.infoCard}>
          <Info size={24} color={COLORS.primaryBrandBlue} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>TensorFlow.js Pose Detection</Text>
            <Text style={styles.infoText}>
              BIONYX uses TensorFlow.js MoveNet model to detect human poses in real-time.
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
          BIONYX by Dark Matter Labs
        </Text>
        <Text style={styles.footerVersion}>Version 1.0.0</Text>
        <Text style={styles.footerVersion}>© 2025 Dark Matter Labs. All Rights Reserved.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    color: COLORS.textPrimary,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBg,
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
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
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
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: COLORS.cardBg,
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
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
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
    color: COLORS.textSecondary,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 12,
    color: '#636366',
  },
});