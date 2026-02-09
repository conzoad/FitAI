import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useProfileStore } from '../stores/useProfileStore';
import { useDiaryStore } from '../stores/useDiaryStore';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { HomeStackParamList } from '../models/types';
import GoalProgressRing from '../components/GoalProgressRing';
import MacroSummaryBar from '../components/MacroSummaryBar';
import MealCard from '../components/MealCard';
import EmptyState from '../components/EmptyState';
import { formatDateRussian, todayKey } from '../utils/dateHelpers';
import { colors } from '../theme/colors';
import { EMPTY_MACROS } from '../utils/constants';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const profile = useProfileStore((s) => s.profile);
  const entries = useDiaryStore((s) => s.entries);
  const todayEntry = entries[todayKey()] || { date: todayKey(), meals: [], totalMacros: EMPTY_MACROS };
  const workoutSessions = useWorkoutStore((s) => s.sessions);

  const consumed = todayEntry.totalMacros;
  const lastMeals = todayEntry.meals.slice(-3).reverse();

  const todayWorkouts = useMemo(() => {
    const today = todayKey();
    return workoutSessions[today] || [];
  }, [workoutSessions]);

  const lastWorkout = useMemo(() => {
    const allDates = Object.keys(workoutSessions).sort().reverse();
    for (const date of allDates) {
      const daySessions = workoutSessions[date];
      if (daySessions && daySessions.length > 0) {
        return daySessions[daySessions.length - 1];
      }
    }
    return null;
  }, [workoutSessions]);

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

        {/* Workout Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Тренировки</Text>
        </View>

        {todayWorkouts.length > 0 ? (
          todayWorkouts.map((session) => (
            <View key={session.id} style={styles.workoutCard}>
              <View style={styles.workoutHeader}>
                <Text style={styles.workoutIcon}>🏋️</Text>
                <View style={styles.workoutInfo}>
                  <Text style={styles.workoutTitle}>Тренировка сегодня</Text>
                  <Text style={styles.workoutMeta}>
                    {session.exercises.length} упр. · {session.duration} мин ·{' '}
                    {session.totalVolume >= 1000
                      ? `${(session.totalVolume / 1000).toFixed(1)}т`
                      : `${session.totalVolume}кг`}
                  </Text>
                </View>
              </View>
            </View>
          ))
        ) : lastWorkout ? (
          <View style={styles.workoutCard}>
            <View style={styles.workoutHeader}>
              <Text style={styles.workoutIcon}>🏋️</Text>
              <View style={styles.workoutInfo}>
                <Text style={styles.workoutTitle}>Последняя тренировка</Text>
                <Text style={styles.workoutMeta}>
                  {lastWorkout.exercises.length} упр. · {lastWorkout.duration} мин ·{' '}
                  {lastWorkout.totalVolume >= 1000
                    ? `${(lastWorkout.totalVolume / 1000).toFixed(1)}т`
                    : `${lastWorkout.totalVolume}кг`}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.workoutCard}>
            <Text style={styles.noWorkoutText}>
              Нет тренировок. Перейдите на вкладку "Трениров." чтобы начать!
            </Text>
          </View>
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
  workoutCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  workoutIcon: {
    fontSize: 24,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  workoutMeta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  noWorkoutText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
