import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useDiaryStore } from '../stores/useDiaryStore';
import { DiaryStackParamList, FoodItem, Macros } from '../models/types';
import { MEAL_TYPE_LABELS, MEAL_TYPE_ICONS, EMPTY_MACROS } from '../utils/constants';
import FoodItemCard from '../components/FoodItemCard';
import { darkColors } from '../theme/colors';
import { useColors } from '../theme/useColors';

type Route = RouteProp<DiaryStackParamList, 'MealDetail'>;

function parseGrams(amount: string): number | null {
  const match = amount.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}

export default function MealDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation();
  const { mealId, date } = route.params;
  const entries = useDiaryStore((s) => s.entries);
  const removeMeal = useDiaryStore((s) => s.removeMeal);
  const updateMealItem = useDiaryStore((s) => s.updateMealItem);
  const [isEditing, setIsEditing] = useState(false);
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const entry = useMemo(
    () => entries[date] || { date, meals: [], totalMacros: EMPTY_MACROS },
    [entries, date]
  );
  const meal = entry.meals.find((m) => m.id === mealId);

  const handleItemUpdate = useCallback(
    (item: FoodItem, field: string, value: string) => {
      if (field !== 'amount') return;

      const originalGrams = parseGrams(item.amount);
      const newGrams = parseGrams(value);

      if (!originalGrams || !newGrams || originalGrams === 0) {
        updateMealItem(date, mealId, item.id, value, item.macros);
        return;
      }

      const ratio = newGrams / originalGrams;
      const newMacros: Macros = {
        calories: Math.round(item.macros.calories * ratio),
        proteins: Math.round(item.macros.proteins * ratio * 10) / 10,
        fats: Math.round(item.macros.fats * ratio * 10) / 10,
        carbs: Math.round(item.macros.carbs * ratio * 10) / 10,
      };

      updateMealItem(date, mealId, item.id, value, newMacros);
    },
    [date, mealId, updateMealItem]
  );

  if (!meal) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.errorText}>Приём пищи не найден</Text>
      </SafeAreaView>
    );
  }

  const handleDelete = () => {
    Alert.alert('Удалить?', 'Удалить этот приём пищи?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => {
          removeMeal(date, mealId);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Назад</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.icon}>{MEAL_TYPE_ICONS[meal.type]}</Text>
          <Text style={styles.title}>{MEAL_TYPE_LABELS[meal.type]}</Text>
        </View>

        <Text style={styles.time}>
          {new Date(meal.timestamp).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>

        {meal.photoUri && (
          <Image source={{ uri: meal.photoUri }} style={styles.photo} />
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Состав</Text>
          <TouchableOpacity
            onPress={() => setIsEditing(!isEditing)}
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>
              {isEditing ? 'Готово' : 'Изменить'}
            </Text>
          </TouchableOpacity>
        </View>

        {meal.items.map((item) => (
          <FoodItemCard
            key={item.id}
            item={{
              name: item.name,
              amount: item.amount,
              calories: item.macros.calories,
              proteins: item.macros.proteins,
              fats: item.macros.fats,
              carbs: item.macros.carbs,
            }}
            editable={isEditing}
            onUpdate={(field, value) => handleItemUpdate(item, field, value)}
          />
        ))}

        <View style={styles.totalCard}>
          <Text style={styles.totalTitle}>Итого</Text>
          <View style={styles.totalRow}>
            <View style={styles.totalItem}>
              <Text style={[styles.totalValue, { color: colors.calories }]}>
                {Math.round(meal.totalMacros.calories)}
              </Text>
              <Text style={styles.totalLabel}>ккал</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={[styles.totalValue, { color: colors.proteins }]}>
                {Math.round(meal.totalMacros.proteins)}
              </Text>
              <Text style={styles.totalLabel}>белки</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={[styles.totalValue, { color: colors.fats }]}>
                {Math.round(meal.totalMacros.fats)}
              </Text>
              <Text style={styles.totalLabel}>жиры</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={[styles.totalValue, { color: colors.carbs }]}>
                {Math.round(meal.totalMacros.carbs)}
              </Text>
              <Text style={styles.totalLabel}>углеводы</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteText}>Удалить приём пищи</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(c: typeof darkColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.background,
    },
    container: {
      flex: 1,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
    },
    backButton: {
      marginBottom: 16,
    },
    backText: {
      fontSize: 16,
      color: c.primary,
      fontWeight: '600',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    icon: {
      fontSize: 28,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: c.text,
    },
    time: {
      fontSize: 14,
      color: c.textSecondary,
      marginTop: 4,
      marginBottom: 16,
    },
    photo: {
      width: '100%',
      height: 200,
      borderRadius: 12,
      marginBottom: 16,
      backgroundColor: c.border,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: c.text,
    },
    editButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: 'rgba(108, 92, 231, 0.12)',
    },
    editButtonText: {
      color: c.primary,
      fontSize: 14,
      fontWeight: '600',
    },
    totalCard: {
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 16,
      marginTop: 12,
    },
    totalTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: c.text,
      marginBottom: 12,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    totalItem: {
      alignItems: 'center',
    },
    totalValue: {
      fontSize: 20,
      fontWeight: '700',
    },
    totalLabel: {
      fontSize: 12,
      color: c.textSecondary,
      marginTop: 2,
    },
    deleteButton: {
      marginTop: 24,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.error,
      alignItems: 'center',
    },
    deleteText: {
      color: c.error,
      fontSize: 16,
      fontWeight: '600',
    },
    errorText: {
      fontSize: 16,
      color: c.textSecondary,
      textAlign: 'center',
      marginTop: 40,
    },
  });
}
