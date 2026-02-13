import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { useExercisePrefsStore } from '../stores/useExercisePrefsStore';
import { WorkoutStackParamList } from '../models/types';
import { getExerciseById, getAllExercises } from '../services/exerciseDatabase';
import { MUSCLE_LABELS } from '../utils/constants';
import { colors } from '../theme/colors';

type Route = RouteProp<WorkoutStackParamList, 'ProgramDetail'>;
type Nav = NativeStackNavigationProp<WorkoutStackParamList, 'ProgramDetail'>;

export default function ProgramDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { programId } = route.params;
  const programs = useWorkoutStore((s) => s.programs);
  const activeWorkout = useWorkoutStore((s) => s.activeWorkout);
  const startWorkoutFromProgram = useWorkoutStore((s) => s.startWorkoutFromProgram);
  const customExercises = useExercisePrefsStore((s) => s.customExercises);

  const program = useMemo(() => programs.find((p) => p.id === programId), [programs, programId]);
  const allExercises = useMemo(() => getAllExercises(customExercises), [customExercises]);

  if (!program) {
    return (
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.errorText}>Программа не найдена</Text>
      </SafeAreaView>
    );
  }

  const handleStart = () => {
    if (activeWorkout) {
      Alert.alert('Внимание', 'У вас уже есть активная тренировка. Завершите или отмените её.');
      return;
    }
    startWorkoutFromProgram(program, allExercises);
    navigation.navigate('StartWorkout');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Назад</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{program.name}</Text>
        <Text style={styles.meta}>{program.exercises.length} упражнений</Text>

        {program.exercises.map((pe, idx) => {
          const exerciseData = getExerciseById(pe.exerciseId, customExercises);
          const gifUrl = exerciseData?.gifUrl;
          const muscles = exerciseData?.targetMuscles;

          return (
            <TouchableOpacity
              key={`${pe.exerciseId}-${idx}`}
              style={styles.exerciseCard}
              onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: pe.exerciseId })}
              activeOpacity={0.7}
            >
              {gifUrl ? (
                <Image source={{ uri: gifUrl }} style={styles.gif} resizeMode="contain" />
              ) : (
                <View style={[styles.gif, styles.gifPlaceholder]}>
                  <Text style={styles.gifPlaceholderText}>🏋️</Text>
                </View>
              )}
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>
                  {exerciseData?.name || pe.exerciseId}
                </Text>
                <Text style={styles.exerciseTarget}>
                  {pe.targetSets} × {pe.targetReps}
                </Text>
                {muscles && (
                  <View style={styles.muscleRow}>
                    {muscles.primary.map((m) => (
                      <View key={m} style={styles.muscleChip}>
                        <Text style={styles.muscleChipText}>{MUSCLE_LABELS[m] || m}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.startButton} onPress={handleStart}>
          <Text style={styles.startButtonText}>Начать тренировку</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 100,
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
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  meta: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gif: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: colors.background,
  },
  gifPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gifPlaceholderText: {
    fontSize: 24,
  },
  exerciseInfo: {
    flex: 1,
    marginLeft: 12,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  exerciseTarget: {
    fontSize: 13,
    color: colors.workout,
    fontWeight: '600',
    marginTop: 2,
  },
  muscleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  muscleChip: {
    backgroundColor: colors.workoutLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  muscleChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.workout,
  },
  arrow: {
    fontSize: 16,
    color: colors.textMuted,
    marginLeft: 8,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 34,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  startButton: {
    backgroundColor: colors.workout,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: colors.workout,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
