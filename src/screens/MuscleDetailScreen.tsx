import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { format, subDays } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { useExercisePrefsStore } from '../stores/useExercisePrefsStore';
import { WorkoutStackParamList, MuscleId } from '../models/types';
import { getExerciseById } from '../services/exerciseDatabase';
import { darkColors } from '../theme/colors';
import { useColors } from '../theme/useColors';
import { useLanguageStore } from '../stores/useLanguageStore';
import { t } from '../i18n/translations';

type Route = RouteProp<WorkoutStackParamList, 'MuscleDetail'>;

interface MuscleExerciseEntry {
  exerciseName: string;
  role: 'primary' | 'secondary';
  sets: number;
  totalReps: number;
}

interface DayData {
  dateKey: string;
  dateLabel: string;
  exercises: MuscleExerciseEntry[];
}

export default function MuscleDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation();
  const { muscleId } = route.params;
  const sessions = useWorkoutStore((s) => s.sessions);
  const customExercises = useExercisePrefsStore((s) => s.customExercises);

  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const lang = useLanguageStore((s) => s.language);
  const T = t(lang);
  const dateLocale = lang === 'ru' ? ru : enUS;

  const muscleName = T.labels.muscles[muscleId] || muscleId;

  const dayData = useMemo(() => {
    const result: DayData[] = [];
    const today = new Date();

    for (let i = 0; i < 5; i++) {
      const date = subDays(today, i);
      const key = format(date, 'yyyy-MM-dd');
      const dateLabel = format(date, 'd MMMM, EEEE', { locale: dateLocale });
      const daySessions = sessions[key] || [];
      const exercises: MuscleExerciseEntry[] = [];

      for (const session of daySessions) {
        for (const workoutExercise of session.exercises) {
          const exerciseData = getExerciseById(workoutExercise.exerciseId, customExercises);
          if (!exerciseData || !exerciseData.targetMuscles) continue;

          const muscleIdTyped = muscleId as MuscleId;
          let role: 'primary' | 'secondary' | null = null;

          if (exerciseData.targetMuscles.primary.includes(muscleIdTyped)) {
            role = 'primary';
          } else if (exerciseData.targetMuscles.secondary.includes(muscleIdTyped)) {
            role = 'secondary';
          }

          if (role) {
            const workingSets = workoutExercise.sets.filter((s) => !s.isWarmup);
            exercises.push({
              exerciseName: workoutExercise.exerciseName,
              role,
              sets: workingSets.length,
              totalReps: workingSets.reduce((sum, s) => sum + s.reps, 0),
            });
          }
        }
      }

      if (exercises.length > 0) {
        result.push({ dateKey: key, dateLabel, exercises });
      }
    }

    return result;
  }, [sessions, customExercises, muscleId, dateLocale]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>{T.common.back}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{muscleName}</Text>

        {dayData.length === 0 ? (
          <Text style={styles.emptyText}>{T.muscleDetail.noData}</Text>
        ) : (
          dayData.map((day) => (
            <View key={day.dateKey} style={styles.daySection}>
              <Text style={styles.dateHeader}>{day.dateLabel}</Text>

              {day.exercises.map((entry, idx) => (
                <View key={`${day.dateKey}-${idx}`} style={styles.exerciseCard}>
                  <View style={styles.exerciseHeader}>
                    <Text style={styles.exerciseName}>{entry.exerciseName}</Text>
                    <View
                      style={[
                        styles.roleBadge,
                        entry.role === 'primary'
                          ? styles.roleBadgePrimary
                          : styles.roleBadgeSecondary,
                      ]}
                    >
                      <Text
                        style={[
                          styles.roleBadgeText,
                          entry.role === 'primary'
                            ? styles.roleBadgeTextPrimary
                            : styles.roleBadgeTextSecondary,
                        ]}
                      >
                        {entry.role === 'primary' ? T.muscleDetail.primary : T.muscleDetail.secondary}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.setsInfo}>
                    {entry.sets} {entry.sets === 1 ? T.muscleDetail.sets : entry.sets < 5 ? T.muscleDetail.sets2_4 : T.muscleDetail.sets5plus} {'\u00B7'} {entry.totalReps} {entry.totalReps === 1 ? T.muscleDetail.reps : entry.totalReps < 5 ? T.muscleDetail.reps2_4 : T.muscleDetail.reps5plus}
                  </Text>
                </View>
              ))}
            </View>
          ))
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
    backButton: {
      marginBottom: 12,
    },
    backText: {
      fontSize: 16,
      color: c.workout,
      fontWeight: '600',
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: c.text,
      marginBottom: 20,
    },
    emptyText: {
      fontSize: 15,
      color: c.textSecondary,
      textAlign: 'center',
      marginTop: 40,
    },
    daySection: {
      marginBottom: 20,
    },
    dateHeader: {
      fontSize: 16,
      fontWeight: '600',
      color: c.text,
      marginBottom: 10,
      textTransform: 'capitalize',
    },
    exerciseCard: {
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
    exerciseHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    exerciseName: {
      fontSize: 15,
      fontWeight: '600',
      color: c.text,
      flex: 1,
      marginRight: 8,
    },
    roleBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    roleBadgePrimary: {
      backgroundColor: 'rgba(255, 107, 107, 0.15)',
    },
    roleBadgeSecondary: {
      backgroundColor: 'rgba(254, 202, 87, 0.15)',
    },
    roleBadgeText: {
      fontSize: 12,
      fontWeight: '600',
    },
    roleBadgeTextPrimary: {
      color: '#FF6B6B',
    },
    roleBadgeTextSecondary: {
      color: '#FECA57',
    },
    setsInfo: {
      fontSize: 13,
      color: c.textSecondary,
    },
  });
}
