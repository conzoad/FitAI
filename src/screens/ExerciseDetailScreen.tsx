import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { WorkoutStackParamList } from '../models/types';
import { getExerciseById } from '../services/exerciseDatabase';
import { MUSCLE_GROUP_LABELS } from '../utils/constants';
import WorkoutProgressChart from '../components/WorkoutProgressChart';
import MuscleMapDiagram from '../components/MuscleMapDiagram';
import { colors } from '../theme/colors';

type Route = RouteProp<WorkoutStackParamList, 'ExerciseDetail'>;

export default function ExerciseDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation();
  const { exerciseId } = route.params;
  const sessions = useWorkoutStore((s) => s.sessions);
  const [gifLoading, setGifLoading] = useState(true);
  const [gifError, setGifError] = useState(false);

  const exercise = useMemo(() => getExerciseById(exerciseId), [exerciseId]);

  const history = useMemo(() => {
    const result: { date: string; sets: { id: string; weight: number; reps: number; isWarmup: boolean }[] }[] = [];

    const allDates = Object.keys(sessions).sort();
    for (const date of allDates) {
      const daySessions = sessions[date];
      for (const session of daySessions) {
        for (const ex of session.exercises) {
          if (ex.exerciseId === exerciseId && ex.sets.length > 0) {
            result.push({ date, sets: ex.sets });
          }
        }
      }
    }
    return result;
  }, [sessions, exerciseId]);

  const personalRecord = useMemo(() => {
    let maxWeight = 0;
    let maxReps = 0;
    for (const h of history) {
      for (const s of h.sets) {
        if (!s.isWarmup) {
          if (s.weight > maxWeight) {
            maxWeight = s.weight;
            maxReps = s.reps;
          }
        }
      }
    }
    return maxWeight > 0 ? { weight: maxWeight, reps: maxReps } : null;
  }, [history]);

  if (!exercise) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.errorText}>Упражнение не найдено</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Назад</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{exercise.name}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Text style={styles.metaText}>{MUSCLE_GROUP_LABELS[exercise.muscleGroup]}</Text>
          </View>
          <View style={styles.metaChip}>
            <Text style={styles.metaText}>{exercise.equipment}</Text>
          </View>
          {exercise.isCompound && (
            <View style={[styles.metaChip, { backgroundColor: colors.workoutLight }]}>
              <Text style={[styles.metaText, { color: colors.workout }]}>Базовое</Text>
            </View>
          )}
        </View>

        {exercise.gifUrl && !gifError && (
          <View style={styles.gifContainer}>
            {gifLoading && (
              <View style={styles.gifLoading}>
                <ActivityIndicator size="large" color={colors.workout} />
              </View>
            )}
            <Image
              source={{ uri: exercise.gifUrl }}
              style={styles.gifImage}
              resizeMode="contain"
              onLoad={() => setGifLoading(false)}
              onError={() => { setGifLoading(false); setGifError(true); }}
            />
          </View>
        )}

        <Text style={styles.description}>{exercise.description}</Text>

        {exercise.targetMuscles && (
          <>
            <Text style={styles.sectionTitle}>Задействованные мышцы</Text>
            <MuscleMapDiagram
              primary={exercise.targetMuscles.primary}
              secondary={exercise.targetMuscles.secondary}
            />
          </>
        )}

        {personalRecord && (
          <View style={styles.prCard}>
            <Text style={styles.prIcon}>🏆</Text>
            <View>
              <Text style={styles.prTitle}>Личный рекорд</Text>
              <Text style={styles.prValue}>
                {personalRecord.weight} кг × {personalRecord.reps} повт.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>История</Text>
          <Text style={styles.historyCount}>{history.length} тренировок</Text>
        </View>

        {history.length > 0 ? (
          <>
            <WorkoutProgressChart history={history} />

            {history
              .slice()
              .reverse()
              .slice(0, 10)
              .map((h, idx) => (
                <View key={idx} style={styles.historyItem}>
                  <Text style={styles.historyDate}>
                    {new Date(h.date).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                  <View style={styles.historySets}>
                    {h.sets
                      .filter((s) => !s.isWarmup)
                      .map((s, i) => (
                        <Text key={i} style={styles.historySet}>
                          {s.weight}×{s.reps}
                        </Text>
                      ))}
                  </View>
                </View>
              ))}
          </>
        ) : (
          <Text style={styles.noHistory}>Нет данных. Выполните это упражнение в тренировке!</Text>
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
  backButton: {
    marginBottom: 12,
  },
  backText: {
    fontSize: 16,
    color: colors.workout,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  metaChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  gifContainer: {
    width: '100%',
    height: 250,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  gifLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  gifImage: {
    width: '100%',
    height: '100%',
  },
  description: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 16,
  },
  prCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 12,
  },
  prIcon: {
    fontSize: 28,
  },
  prTitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  prValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  historyCount: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    width: 60,
  },
  historySets: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  historySet: {
    fontSize: 13,
    color: colors.workout,
    fontWeight: '600',
    backgroundColor: colors.workoutLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  noHistory: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: 30,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
});
