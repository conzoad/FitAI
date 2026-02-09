import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useProfileStore } from '../stores/useProfileStore';
import { useDiaryStore } from '../stores/useDiaryStore';
import { HomeStackParamList } from '../models/types';
import GoalProgressRing from '../components/GoalProgressRing';
import MacroSummaryBar from '../components/MacroSummaryBar';
import MealCard from '../components/MealCard';
import EmptyState from '../components/EmptyState';
import { formatDateRussian } from '../utils/dateHelpers';
import { colors } from '../theme/colors';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const profile = useProfileStore((s) => s.profile);
  const todayEntry = useDiaryStore((s) => s.getTodayEntry());

  const consumed = todayEntry.totalMacros;
  const lastMeals = todayEntry.meals.slice(-3).reverse();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.greeting}>
          Привет, {profile.name || 'друг'}!
        </Text>
        <Text style={styles.date}>{formatDateRussian(new Date())}</Text>

        <View style={styles.ringContainer}>
          <GoalProgressRing
            consumed={consumed.calories}
            target={profile.targetCalories}
          />
        </View>

        <MacroSummaryBar
          macros={consumed}
          targets={{
            targetProteins: profile.targetProteins,
            targetFats: profile.targetFats,
            targetCarbs: profile.targetCarbs,
          }}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Последние приёмы пищи</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Stats')}>
            <Text style={styles.statsLink}>Статистика</Text>
          </TouchableOpacity>
        </View>

        {lastMeals.length > 0 ? (
          lastMeals.map((meal) => (
            <MealCard key={meal.id} meal={meal} onPress={() => {}} />
          ))
        ) : (
          <EmptyState
            icon="🍽️"
            title="Пока пусто"
            subtitle="Добавьте первый приём пищи, нажав +"
          />
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
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
  },
  date: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 20,
  },
  ringContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  statsLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
});
