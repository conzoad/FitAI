import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Meal } from '../models/types';
import { MEAL_TYPE_LABELS, MEAL_TYPE_ICONS } from '../utils/constants';
import { colors } from '../theme/colors';

interface Props {
  meal: Meal;
  onPress: () => void;
  onDelete?: () => void;
}

export default function MealCard({ meal, onPress, onDelete }: Props) {
  const itemNames = meal.items.map((i) => i.name).join(', ');

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.icon}>{MEAL_TYPE_ICONS[meal.type]}</Text>
          <Text style={styles.type}>{MEAL_TYPE_LABELS[meal.type]}</Text>
        </View>
        <Text style={styles.calories}>{Math.round(meal.totalMacros.calories)} ккал</Text>
      </View>
      {itemNames ? <Text style={styles.items} numberOfLines={2}>{itemNames}</Text> : null}
      <Text style={styles.macros}>
        Б:{Math.round(meal.totalMacros.proteins)}  Ж:{Math.round(meal.totalMacros.fats)}  У:{Math.round(meal.totalMacros.carbs)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 20,
  },
  type: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  calories: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.calories,
  },
  items: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 6,
  },
  macros: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
