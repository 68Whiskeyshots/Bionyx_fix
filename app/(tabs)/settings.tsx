import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useState } from 'react';
import { Settings, Info, Zap, Shield, Smartphone } from 'lucide-react-native';

export default function SettingsScreen() {
  const [highPerformanceMode, setHighPerformanceMode] = useState(false);
  const [showConfidence, setShowConfidence] = useState(true);
  const [showKeypoints, setShowKeypoints] = useState(true);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Settings size={32} color="#007AFF" />
        <Text style={styles.title}>Settings</Text>
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
          <Switch
            value={highPerformanceMode}
            onValueChange={setHighPerformanceMode}
            trackColor={{ false: '#767577', true: '#007AFF' }}
            thumbColor={highPerformanceMode ? '#fff' : '#f4f3f4'}
          />
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
                Display individual body keypoints
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