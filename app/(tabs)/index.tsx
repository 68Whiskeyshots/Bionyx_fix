import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Link } from 'expo-router';
import { Settings } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';

const quickActions = [
  { id: '1', emoji: '🏃', title: 'Running', subtitle: 'Analyze your sprint' },
  { id: '2', emoji: '⚽', title: 'Soccer', subtitle: 'Track ball control' },
  { id: '3', emoji: '🏋️‍♀️', title: 'Weightlifting', subtitle: 'Check your form' },
  { id: '4', emoji: '🏈', title: 'Throws', subtitle: 'Perfect your technique' },
];

const recentSessions = [
  { id: '1', title: 'Last Sprint', date: 'Jul 8', metrics: '4.8 m/s peak • 0.19 s contact' },
  { id: '2', title: 'Morning Workout', date: 'Jul 7', metrics: '12 reps • 95% form accuracy' },
  { id: '3', title: 'Soccer Practice', date: 'Jul 6', metrics: '87% ball control • 23 touches' },
];

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.appBar}>
        <Image source={require('@/assets/images/icon.png')} style={{ width: 32, height: 32 }} />
        <Text style={styles.appBarTitle}>BIONYX</Text>
        <Link href="/settings" asChild>
          <TouchableOpacity>
            <Settings size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </Link>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Quick Action Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity key={action.id} style={styles.quickActionCard}>
                <Text style={styles.quickActionEmoji}>{action.emoji}</Text>
                <Text style={styles.quickActionTitle}>{action.title}</Text>
                <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Sessions Carousel */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Sessions</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carousel}
          >
            {recentSessions.map((session) => (
              <TouchableOpacity key={session.id} style={styles.sessionCard}>
                <Text style={styles.sessionTitle}>{session.title} • {session.date}</Text>
                <Text style={styles.sessionMetrics}>{session.metrics}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tip of the Day */}
        <TouchableOpacity style={styles.tipBanner}>
          <Text style={styles.tipHeader}>💡 Tip of the Day</Text>
          <Text style={styles.tipBody}>
            Keep your core engaged during sprints to maintain better posture and reduce injury risk.
          </Text>
        </TouchableOpacity>

        {/* Start Analysis Button */}
        <View style={styles.actionSection}>
          <Link href="/camera" asChild>
            <TouchableOpacity style={styles.analyzeButton}>
              <Text style={styles.analyzeButtonText}>🔍 Start Analysis</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Copyright */}
        <Text style={styles.copyright}>© 2025 Dark Matter Labs. All Rights Reserved.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  appBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: COLORS.background,
    marginTop: 44, // For safe area
  },
  appBarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  quickActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  quickActionCard: {
    width: '48%',
    margin: '1%',
    padding: 16,
    borderRadius: 8,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  carousel: {
    paddingHorizontal: 16,
  },
  sessionCard: {
    width: 200,
    padding: 16,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: COLORS.cardBg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  sessionMetrics: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  tipBanner: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primaryBrandBlue,
  },
  tipHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  tipBody: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  actionSection: {
    paddingHorizontal: 16,
    marginVertical: 24,
  },
  analyzeButton: {
    backgroundColor: COLORS.accentTeal,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  analyzeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.background,
  },
  copyright: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginVertical: 24,
  },
});