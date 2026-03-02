import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDiaryStore } from '../stores/useDiaryStore';
import { DiaryStackParamList, MealType } from '../models/types';
import { MEAL_TYPE_LABELS, MEAL_TYPE_ICONS, EMPTY_MACROS } from '../utils/constants';
import { todayKey } from '../utils/dateHelpers';
import NutritionCalendar from '../components/NutritionCalendar';
import MealCard from '../components/MealCard';
import EmptyState from '../components/EmptyState';
import { darkColors } from '../theme/colors';
import { useColors } from '../theme/useColors';
import { useProfileStore } from '../stores/useProfileStore';
import { useLanguageStore } from '../stores/useLanguageStore';
import { t } from '../i18n/translations';

type Nav = NativeStackNavigationProp<DiaryStackParamList>;

export default function DiaryScreen() {
  const navigation = useNavigation<Nav>();
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const entries = useDiaryStore((s) => s.entries);
  const removeMeal = useDiaryStore((s) => s.removeMeal);
  const targetCalories = useProfileStore((s) => s.profile.targetCalories);
  const lang = useLanguageStore((s) => s.language);
  const T = t(lang);

  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const entry = useMemo(
    () => entries[selectedDate] || { date: selectedDate, meals: [], totalMacros: EMPTY_MACROS },
    [entries, selectedDate]
  );

  const mealGroups: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  const handleDelete = (mealId: string) => {
    Alert.alert(T.diary.deleteTitle, T.diary.deleteMessage, [
      { text: T.common.cancel, style: 'cancel' },
      {
        text: T.common.delete,
        style: 'destructive',
        onPress: () => removeMeal(selectedDate, mealId),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>{T.diary.title}</Text>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <NutritionCalendar
          entries={entries}
          targetCalories={targetCalories}
          onDayPress={setSelectedDate}
          selectedDate={selectedDate}
        />

        <View style={styles.dailyTotal}>
          <Text style={styles.dailyCalories}>
            {Math.round(entry.totalMacros.calories)} {T.common.kcal}
          </Text>
          <View style={styles.dailyMacrosRow}>
            <View style={[styles.macroPill, { backgroundColor: colors.proteins + '18' }]}>
              <Text style={[styles.macroText, { color: colors.proteins }]}>
                {T.diary.P}:{Math.round(entry.totalMacros.proteins)}{T.common.g}
              </Text>
            </View>
            <View style={[styles.macroPill, { backgroundColor: colors.fats + '18' }]}>
              <Text style={[styles.macroText, { color: colors.fats }]}>
                {T.diary.F}:{Math.round(entry.totalMacros.fats)}{T.common.g}
              </Text>
            </View>
            <View style={[styles.macroPill, { backgroundColor: colors.carbs + '18' }]}>
              <Text style={[styles.macroText, { color: colors.carbs }]}>
                {T.diary.C}:{Math.round(entry.totalMacros.carbs)}{T.common.g}
              </Text>
            </View>
          </View>
        </View>

        {entry.meals.length === 0 ? (
          <EmptyState
            icon="📝"
            title={T.diary.emptyTitle}
            subtitle={T.diary.emptySubtitle}
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
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('AddMeal')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function getStyles(c: typeof darkColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.background,
    },
    title: {
      fontSize: 26,
      fontWeight: '800',
      color: c.text,
      paddingHorizontal: 20,
      paddingTop: 16,
      letterSpacing: -0.3,
    },
    dailyTotal: {
      paddingHorizontal: 20,
      paddingVertical: 14,
      backgroundColor: c.surface,
      borderRadius: 16,
      alignItems: 'center',
      marginBottom: 14,
      borderWidth: 1,
      borderColor: c.border,
    },
    dailyCalories: {
      fontSize: 26,
      fontWeight: '800',
      color: c.calories,
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
      color: c.text,
      marginBottom: 10,
    },
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: c.primary,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 8,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
    },
    fabText: {
      color: '#FFFFFF',
      fontSize: 30,
      fontWeight: '600',
      lineHeight: 32,
    },
  });
}
