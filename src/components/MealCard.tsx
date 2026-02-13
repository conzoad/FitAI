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

const ACCENT_COLORS: Record<string, string> = {
  breakfast: colors.fats,
  lunch: colors.carbs,
  dinner: colors.proteins,
  snack: colors.primaryLight,
};

export default function MealCard({ meal, onPress, onDelete }: Props) {
  const itemNames = meal.items.map((i) => i.name).join(', ');
  const accentColor = ACCENT_COLORS[meal.type] || colors.primary;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      <View style={styles.body}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.icon}>{MEAL_TYPE_ICONS[meal.type]}</Text>
            <Text style={styles.type}>{MEAL_TYPE_LABELS[meal.type]}</Text>
          </View>
          <View style={[styles.calorieBadge, { backgroundColor: accentColor + '20' }]}>
            <Text style={[styles.calories, { color: accentColor }]}>{Math.round(meal.totalMacros.calories)} ккал</Text>
          </View>
        </View>
        {itemNames ? <Text style={styles.items} numberOfLines={2}>{itemNames}</Text> : null}
        <View style={styles.macrosRow}>
          <Text style={[styles.macroItem, { color: colors.proteins }]}>
            Б:{Math.round(meal.totalMacros.proteins)}
          </Text>
          <Text style={styles.macroDot}>·</Text>
          <Text style={[styles.macroItem, { color: colors.fats }]}>
            Ж:{Math.round(meal.totalMacros.fats)}
          </Text>
          <Text style={styles.macroDot}>·</Text>
          <Text style={[styles.macroItem, { color: colors.carbs }]}>
            У:{Math.round(meal.totalMacros.carbs)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  accent: {
    width: 4,
  },
  body: {
    flex: 1,
    padding: 14,
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
  calorieBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  calories: {
    fontSize: 14,
    fontWeight: '700',
  },
  items: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
  macrosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  macroItem: {
    fontSize: 13,
    fontWeight: '600',
  },
  macroDot: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
