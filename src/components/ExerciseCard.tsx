import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Exercise } from '../models/types';
import { MUSCLE_GROUP_LABELS, MUSCLE_GROUP_ICONS } from '../utils/constants';
import { colors } from '../theme/colors';

interface ExerciseCardProps {
  exercise: Exercise;
  onPress?: () => void;
}

export default function ExerciseCard({ exercise, onPress }: ExerciseCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{MUSCLE_GROUP_ICONS[exercise.muscleGroup] || '💪'}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{exercise.name}</Text>
        <Text style={styles.meta}>
          {MUSCLE_GROUP_LABELS[exercise.muscleGroup]} · {exercise.equipment}
        </Text>
      </View>
      {exercise.isCompound && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Базовое</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.workoutLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    backgroundColor: colors.workoutLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    color: colors.workout,
    fontWeight: '600',
  },
});
