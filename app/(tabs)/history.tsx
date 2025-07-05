import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS } from '@/constants/colors';
import { Calendar, Clock, TrendingUp } from 'lucide-react-native';

const historyData = [
  {
    id: '1',
    date: 'July 8, 2024',
    sessions: [
      { id: '1-1', type: 'Sprint Analysis', time: '10:30 AM', metrics: 'Peak velocity: 8.2 m/s' },
      { id: '1-2', type: 'Form Check', time: '2:15 PM', metrics: 'Form score: 92%' },
    ],
  },
  {
    id: '2',
    date: 'July 7, 2024',
    sessions: [
      { id: '2-1', type: 'Weightlifting', time: '6:00 AM', metrics: 'Total reps: 45' },
    ],
  },
];

export default function HistoryScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>Track your progress over time</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {historyData.map((day) => (
          <View key={day.id} style={styles.daySection}>
            <View style={styles.dateHeader}>
              <Calendar size={16} color={COLORS.textSecondary} />
              <Text style={styles.dateText}>{day.date}</Text>
            </View>
            {day.sessions.map((session) => (
              <TouchableOpacity key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <Text style={styles.sessionType}>{session.type}</Text>
                  <View style={styles.timeContainer}>
                    <Clock size={12} color={COLORS.textSecondary} />
                    <Text style={styles.sessionTime}>{session.time}</Text>
                  </View>
                </View>
                <Text style={styles.sessionMetrics}>{session.metrics}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  daySection: {
    marginBottom: 24,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  sessionCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionType: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sessionTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  sessionMetrics: {
    fontSize: 14,
    color: COLORS.accentTeal,
  },
});