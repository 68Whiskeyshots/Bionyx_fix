import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { Camera, Zap, Smartphone, Shield } from 'lucide-react-native';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Pose Detection</Text>
        <Text style={styles.subtitle}>Real-time pose analysis on mobile</Text>
      </View>

      <View style={styles.featuresContainer}>
        <View style={styles.feature}>
          <View style={styles.iconContainer}>
            <Zap size={32} color="#007AFF" />
          </View>
          <Text style={styles.featureTitle}>Real-time Processing</Text>
          <Text style={styles.featureDescription}>
            Analyze poses at 3-5 FPS on mobile devices
          </Text>
        </View>

        <View style={styles.feature}>
          <View style={styles.iconContainer}>
            <Smartphone size={32} color="#007AFF" />
          </View>
          <Text style={styles.featureTitle}>Mobile Optimized</Text>
          <Text style={styles.featureDescription}>
            Works perfectly in Expo Go without ejecting
          </Text>
        </View>

        <View style={styles.feature}>
          <View style={styles.iconContainer}>
            <Shield size={32} color="#007AFF" />
          </View>
          <Text style={styles.featureTitle}>Privacy First</Text>
          <Text style={styles.featureDescription}>
            All processing happens on-device
          </Text>
        </View>
      </View>

      <View style={styles.actionContainer}>
        <Link href="/camera" asChild>
          <TouchableOpacity style={styles.startButton}>
            <Camera size={20} color="#fff" />
            <Text style={styles.startButtonText}>Start Pose Detection</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>How it works</Text>
        <Text style={styles.infoText}>
          This app uses TensorFlow.js to detect human poses in real-time using your device's camera.
          The AI model runs entirely on your device, ensuring privacy and security.
        </Text>
        <Text style={styles.infoText}>
          • Detects 17 key body points
          • Real-time confidence scoring
          • Cross-platform compatibility
          • Memory efficient processing
        </Text>
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
    paddingBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  featuresContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  feature: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  startButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  infoContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 12,
  },
});