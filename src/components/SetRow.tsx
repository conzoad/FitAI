import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { WorkoutSet } from '../models/types';
import { colors } from '../theme/colors';

interface SetRowProps {
  set: WorkoutSet;
  index: number;
  onRemove?: () => void;
  editable?: boolean;
}

export default function SetRow({ set, index, onRemove, editable = false }: SetRowProps) {
  return (
    <View style={[styles.row, set.isWarmup && styles.warmupRow]}>
      <View style={styles.indexContainer}>
        <Text style={[styles.index, set.isWarmup && styles.warmupText]}>
          {set.isWarmup ? 'Р' : index}
        </Text>
      </View>
      <View style={styles.dataContainer}>
        <Text style={styles.weight}>{set.weight} кг</Text>
        <Text style={styles.separator}>×</Text>
        <Text style={styles.reps}>{set.reps} повт.</Text>
      </View>
      <Text style={styles.volume}>
        {Math.round(set.weight * set.reps)} кг
      </Text>
      {editable && onRemove && (
        <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
          <Text style={styles.removeText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  warmupRow: {
    backgroundColor: '#FFF8E1',
  },
  indexContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.workoutLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  index: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.workout,
  },
  warmupText: {
    color: colors.warmup,
  },
  dataContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  weight: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  separator: {
    fontSize: 14,
    color: colors.textSecondary,
    marginHorizontal: 6,
  },
  reps: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  volume: {
    fontSize: 13,
    color: colors.textSecondary,
    marginRight: 8,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    fontSize: 16,
    color: colors.error,
  },
});
