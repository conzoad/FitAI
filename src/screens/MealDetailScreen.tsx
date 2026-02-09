import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useDiaryStore } from '../stores/useDiaryStore';
import { DiaryStackParamList } from '../models/types';
import { MEAL_TYPE_LABELS, MEAL_TYPE_ICONS } from '../utils/constants';
import FoodItemCard from '../components/FoodItemCard';
import { colors } from '../theme/colors';

type Route = RouteProp<DiaryStackParamList, 'MealDetail'>;

export default function MealDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation();
  const { mealId, date } = route.params;
  const getEntry = useDiaryStore((s) => s.getEntry);
  const removeMeal = useDiaryStore((s) => s.removeMeal);
  const entry = getEntry(date);
  const meal = entry.meals.find((m) => m.id === mealId);

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

        <Text style={styles.sectionTitle}>Состав</Text>
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

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.primary,
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
    color: colors.text,
  },
  time: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  totalCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  totalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
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
    color: colors.textSecondary,
    marginTop: 2,
  },
  deleteButton: {
    marginTop: 24,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: 'center',
  },
  deleteText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
});
