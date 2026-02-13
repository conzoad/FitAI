import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { WorkoutSession } from '../models/types';
import { darkColors } from '../theme/colors';
import { useColors } from '../theme/useColors';

interface WorkoutCardProps {
  session: WorkoutSession;
  onPress?: () => void;
}

export default function WorkoutCard({ session, onPress }: WorkoutCardProps) {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const exerciseCount = session.exercises.length;
  const totalSets = session.exercises.reduce((sum, ex) => sum + ex.sets.filter((s) => !s.isWarmup).length, 0);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.accentBar} />
      <View style={styles.body}>
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
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{totalSets}</Text>
            <Text style={styles.statLabel}>подходов</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.volume }]}>
              {session.totalVolume >= 1000
                ? `${(session.totalVolume / 1000).toFixed(1)}т`
                : `${session.totalVolume}кг`}
            </Text>
            <Text style={styles.statLabel}>объём</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function getStyles(c: typeof darkColors) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    accentBar: {
      width: 4,
      backgroundColor: c.workout,
    },
    body: {
      flex: 1,
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    iconContainer: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: c.workoutLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
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
      color: c.text,
    },
    time: {
      fontSize: 13,
      color: c.textSecondary,
      marginTop: 2,
    },
    exercises: {
      marginBottom: 14,
    },
    exerciseName: {
      fontSize: 14,
      color: c.textSecondary,
      marginBottom: 3,
      lineHeight: 20,
    },
    moreText: {
      fontSize: 13,
      color: c.textMuted,
      fontStyle: 'italic',
    },
    statsRow: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingTop: 12,
      alignItems: 'center',
    },
    stat: {
      flex: 1,
      alignItems: 'center',
    },
    statDivider: {
      width: 1,
      height: 24,
      backgroundColor: c.border,
    },
    statValue: {
      fontSize: 17,
      fontWeight: '800',
      color: c.workout,
    },
    statLabel: {
      fontSize: 11,
      color: c.textMuted,
      marginTop: 2,
      letterSpacing: 0.3,
    },
  });
}
