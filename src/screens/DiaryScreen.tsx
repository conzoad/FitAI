import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDiaryStore } from '../stores/useDiaryStore';
import { DiaryStackParamList, MealType } from '../models/types';
import { MEAL_TYPE_LABELS, MEAL_TYPE_ICONS, EMPTY_MACROS } from '../utils/constants';
import { todayKey } from '../utils/dateHelpers';
import DaySelector from '../components/DaySelector';
import MealCard from '../components/MealCard';
import EmptyState from '../components/EmptyState';
import { colors } from '../theme/colors';

type Nav = NativeStackNavigationProp<DiaryStackParamList>;

export default function DiaryScreen() {
  const navigation = useNavigation<Nav>();
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const entries = useDiaryStore((s) => s.entries);
  const removeMeal = useDiaryStore((s) => s.removeMeal);
  const entry = useMemo(
    () => entries[selectedDate] || { date: selectedDate, meals: [], totalMacros: EMPTY_MACROS },
    [entries, selectedDate]
  );

  const mealGroups: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  const handleDelete = (mealId: string) => {
    Alert.alert('Удалить?', 'Удалить этот приём пищи?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => removeMeal(selectedDate, mealId),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Дневник питания</Text>
      <DaySelector selectedDate={selectedDate} onSelect={setSelectedDate} />

      <View style={styles.dailyTotal}>
        <Text style={styles.dailyCalories}>
          {Math.round(entry.totalMacros.calories)} ккал
        </Text>
        <View style={styles.dailyMacrosRow}>
          <View style={[styles.macroPill, { backgroundColor: colors.proteins + '18' }]}>
            <Text style={[styles.macroText, { color: colors.proteins }]}>
              Б:{Math.round(entry.totalMacros.proteins)}г
            </Text>
          </View>
          <View style={[styles.macroPill, { backgroundColor: colors.fats + '18' }]}>
            <Text style={[styles.macroText, { color: colors.fats }]}>
              Ж:{Math.round(entry.totalMacros.fats)}г
            </Text>
          </View>
          <View style={[styles.macroPill, { backgroundColor: colors.carbs + '18' }]}>
            <Text style={[styles.macroText, { color: colors.carbs }]}>
              У:{Math.round(entry.totalMacros.carbs)}г
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {entry.meals.length === 0 ? (
          <EmptyState
            icon="📝"
            title="Нет записей"
            subtitle="Добавьте приём пищи через вкладку +"
          />
        ) : (
          mealGroups.map((type) => {
            const meals = entry.meals.filter((m) => m.type === type);
            if (meals.length === 0) return null;
            return (
              <View key={type} style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {MEAL_TYPE_ICONS[type]} {MEAL_TYPE_LABELS[type]}
                </Text>
                {meals.map((meal) => (
                  <MealCard
                    key={meal.id}
                    meal={meal}
                    onPress={() =>
                      navigation.navigate('MealDetail', {
                        mealId: meal.id,
                        date: selectedDate,
                      })
                    }
                    onDelete={() => handleDelete(meal.id)}
                  />
                ))}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    paddingHorizontal: 20,
    paddingTop: 16,
    letterSpacing: -0.3,
  },
  dailyTotal: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dailyCalories: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.calories,
    letterSpacing: -0.5,
  },
  dailyMacrosRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  macroPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  macroText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
});
