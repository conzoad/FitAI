import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Exercise } from '../models/types';
import { MUSCLE_GROUP_LABELS, MUSCLE_GROUP_ICONS, EQUIPMENT_LABELS, EXERCISE_LEVEL_LABELS } from '../utils/constants';
import { colors } from '../theme/colors';

interface ExerciseCardProps {
  exercise: Exercise;
  onPress?: () => void;
  colorTag?: string;
  isFavorite?: boolean;
}

export default function ExerciseCard({ exercise, onPress, colorTag, isFavorite }: ExerciseCardProps) {
  const [gifLoading, setGifLoading] = useState(true);
  const [gifError, setGifError] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.card, colorTag ? { borderLeftWidth: 4, borderLeftColor: colorTag } : undefined]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        {exercise.gifUrl && !gifError ? (
          <>
            {gifLoading && (
              <View style={styles.gifLoading}>
                <ActivityIndicator size="small" color={colors.workout} />
              </View>
            )}
            <Image
              source={{ uri: exercise.gifUrl }}
              style={styles.thumbnailGif}
              resizeMode="cover"
              onLoad={() => setGifLoading(false)}
              onError={() => { setGifLoading(false); setGifError(true); }}
            />
          </>
        ) : (
          <Text style={styles.icon}>{MUSCLE_GROUP_ICONS[exercise.muscleGroup] || '💪'}</Text>
        )}
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          {isFavorite && <Text style={styles.star}>★ </Text>}
          <Text style={styles.name} numberOfLines={1}>{exercise.name}</Text>
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          {MUSCLE_GROUP_LABELS[exercise.muscleGroup]} · {EQUIPMENT_LABELS[exercise.equipment]}
        </Text>
      </View>
      <View style={styles.badges}>
        {exercise.isCompound && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Базовое</Text>
          </View>
        )}
        <View style={[styles.levelBadge, styles[`level_${exercise.level}`]]}>
          <Text style={styles.levelText}>{EXERCISE_LEVEL_LABELS[exercise.level]}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.workoutLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  gifLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  thumbnailGif: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  icon: {
    fontSize: 20,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    fontSize: 14,
    color: '#FECA57',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badges: {
    alignItems: 'flex-end',
    gap: 4,
    marginLeft: 8,
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
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  level_beginner: {
    backgroundColor: 'rgba(85, 239, 196, 0.15)',
  },
  level_intermediate: {
    backgroundColor: 'rgba(254, 202, 87, 0.15)',
  },
  level_advanced: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
  },
  levelText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
} as Record<string, any>);
