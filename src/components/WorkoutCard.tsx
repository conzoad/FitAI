import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { WorkoutSession } from '../models/types';
import { colors } from '../theme/colors';

interface WorkoutCardProps {
  session: WorkoutSession;
  onPress?: () => void;
}

export default function WorkoutCard({ session, onPress }: WorkoutCardProps) {
  const exerciseCount = session.exercises.length;
  const totalSets = session.exercises.reduce((sum, ex) => sum + ex.sets.filter((s) => !s.isWarmup).length, 0);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🏋️</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>Тренировка</Text>
          <Text style={styles.time}>
            {new Date(session.startTime).toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
            })}
            {' · '}
            {session.duration} мин
          </Text>
        </View>
      </View>

      <View style={styles.exercises}>
        {session.exercises.slice(0, 3).map((ex) => (
          <Text key={ex.id} style={styles.exerciseName} numberOfLines={1}>
            {ex.exerciseName} — {ex.sets.filter((s) => !s.isWarmup).length} подх.
          </Text>
        ))}
        {session.exercises.length > 3 && (
          <Text style={styles.moreText}>
            +{session.exercises.length - 3} ещё
          </Text>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{exerciseCount}</Text>
          <Text style={styles.statLabel}>упражн.</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{totalSets}</Text>
          <Text style={styles.statLabel}>подходов</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.volume }]}>
            {session.totalVolume >= 1000
              ? `${(session.totalVolume / 1000).toFixed(1)}т`
              : `${session.totalVolume}кг`}
          </Text>
          <Text style={styles.statLabel}>объём</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.workoutLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  icon: {
    fontSize: 18,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  time: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 1,
  },
  exercises: {
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  moreText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.workout,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
