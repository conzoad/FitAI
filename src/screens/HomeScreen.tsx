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
import { formatDateLocalized, todayKey } from '../utils/dateHelpers';
import { darkColors } from '../theme/colors';
import { useLanguageStore } from '../stores/useLanguageStore';
import { t } from '../i18n/translations';
import { useColors } from '../theme/useColors';
import { EMPTY_MACROS } from '../utils/constants';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

export default function HomeScreen() {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const lang = useLanguageStore((s) => s.language);
  const T = t(lang);

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
        <View style={styles.greetingCard}>
          <Text style={styles.greeting}>
            {T.home.greeting.replace('{name}', profile.name || T.home.friendDefault)} 👋
          </Text>
          <Text style={styles.date}>{formatDateLocalized(new Date(), lang)}</Text>
        </View>

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
          <Text style={styles.sectionTitle}>{T.home.recentMeals}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Stats')}>
            <View style={styles.statsLinkBadge}>
              <Text style={styles.statsLink}>{T.home.statsLink}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {lastMeals.length > 0 ? (
          lastMeals.map((meal) => (
            <MealCard key={meal.id} meal={meal} onPress={() => navigation.navigate('MealDetail', { mealId: meal.id, date: todayKey() })} />
          ))
        ) : (
          <EmptyState
            icon="🍽️"
            title={T.home.emptyMealsTitle}
            subtitle={T.home.emptyMealsSubtitle}
          />
        )}

        {/* Workout Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{T.home.workouts}</Text>
        </View>

        {todayWorkouts.length > 0 ? (
          todayWorkouts.map((session) => (
            <View key={session.id} style={styles.workoutCard}>
              <View style={styles.workoutAccent} />
              <View style={styles.workoutBody}>
                <View style={styles.workoutHeader}>
                  <View style={styles.workoutIconCircle}>
                    <Text style={styles.workoutIcon}>🏋️</Text>
                  </View>
                  <View style={styles.workoutInfo}>
                    <Text style={styles.workoutTitle}>{T.home.todayWorkout}</Text>
                    <Text style={styles.workoutMeta}>
                      {session.exercises.length} {T.common.exercises} · {session.duration} {T.common.min} ·{' '}
                      {session.totalVolume >= 1000
                        ? `${(session.totalVolume / 1000).toFixed(1)}${T.common.t}`
                        : `${session.totalVolume}${T.common.kg}`}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))
        ) : lastWorkout ? (
          <View style={styles.workoutCard}>
            <View style={styles.workoutAccent} />
            <View style={styles.workoutBody}>
              <View style={styles.workoutHeader}>
                <View style={styles.workoutIconCircle}>
                  <Text style={styles.workoutIcon}>🏋️</Text>
                </View>
                <View style={styles.workoutInfo}>
                  <Text style={styles.workoutTitle}>{T.home.lastWorkout}</Text>
                  <Text style={styles.workoutMeta}>
                    {lastWorkout.exercises.length} {T.common.exercises} · {lastWorkout.duration} {T.common.min} ·{' '}
                    {lastWorkout.totalVolume >= 1000
                      ? `${(lastWorkout.totalVolume / 1000).toFixed(1)}${T.common.t}`
                      : `${lastWorkout.totalVolume}${T.common.kg}`}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.workoutCard}>
            <View style={styles.workoutBody}>
              <Text style={styles.noWorkoutText}>
                {T.home.noWorkouts}
              </Text>
            </View>
          </View>
        )}
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
    greetingCard: {
      marginBottom: 6,
    },
    greeting: {
      fontSize: 28,
      fontWeight: '800',
      color: c.text,
      letterSpacing: -0.5,
    },
    date: {
      fontSize: 14,
      color: c.textSecondary,
      marginTop: 4,
      marginBottom: 16,
    },
    ringContainer: {
      alignItems: 'center',
      marginVertical: 10,
      marginBottom: 20,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 24,
      marginBottom: 14,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: c.text,
      letterSpacing: -0.2,
    },
    statsLinkBadge: {
      backgroundColor: 'rgba(108, 92, 231, 0.12)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
    },
    statsLink: {
      fontSize: 13,
      color: c.primary,
      fontWeight: '700',
    },
    workoutCard: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    workoutAccent: {
      width: 4,
      backgroundColor: c.workout,
    },
    workoutBody: {
      flex: 1,
      padding: 14,
    },
    workoutHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    workoutIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: c.workoutLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    workoutIcon: {
      fontSize: 18,
    },
    workoutInfo: {
      flex: 1,
    },
    workoutTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
    },
    workoutMeta: {
      fontSize: 13,
      color: c.textSecondary,
      marginTop: 3,
    },
    noWorkoutText: {
      fontSize: 14,
      color: c.textMuted,
      textAlign: 'center',
      paddingVertical: 8,
    },
  });
}
