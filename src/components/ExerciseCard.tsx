import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Exercise } from '../models/types';
import { MUSCLE_GROUP_LABELS, MUSCLE_GROUP_ICONS } from '../utils/constants';
import { colors } from '../theme/colors';

interface ExerciseCardProps {
  exercise: Exercise;
  onPress?: () => void;
}

export default function ExerciseCard({ exercise, onPress }: ExerciseCardProps) {
  const [gifLoading, setGifLoading] = useState(true);
  const [gifError, setGifError] = useState(false);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
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
