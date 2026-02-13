import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { WorkoutStackParamList } from '../models/types';
import { getExerciseById } from '../services/exerciseDatabase';
import { MUSCLE_LABELS } from '../utils/constants';
import SetRow from '../components/SetRow';
import { colors } from '../theme/colors';

type Nav = NativeStackNavigationProp<WorkoutStackParamList, 'StartWorkout'>;

export default function StartWorkoutScreen() {
  const navigation = useNavigation<Nav>();
  const activeWorkout = useWorkoutStore((s) => s.activeWorkout);
  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  const addSet = useWorkoutStore((s) => s.addSet);
  const removeSet = useWorkoutStore((s) => s.removeSet);
  const removeExercise = useWorkoutStore((s) => s.removeExercise);
  const finishWorkout = useWorkoutStore((s) => s.finishWorkout);
  const cancelWorkout = useWorkoutStore((s) => s.cancelWorkout);

  const [timer, setTimer] = useState(0);
  const [weightInputs, setWeightInputs] = useState<Record<string, string>>({});
  const [repsInputs, setRepsInputs] = useState<Record<string, string>>({});
  const [showGif, setShowGif] = useState<Record<string, boolean>>({});

  const toggleGif = (exerciseId: string) => {
    setShowGif((prev) => ({ ...prev, [exerciseId]: !prev[exerciseId] }));
  };

  useEffect(() => {
    if (!activeWorkout) {
      startWorkout();
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (activeWorkout) {
        setTimer(Math.floor((Date.now() - activeWorkout.startTime) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeWorkout?.startTime]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAddSet = (exerciseId: string) => {
    const weight = parseFloat(weightInputs[exerciseId] || '0');
    const reps = parseInt(repsInputs[exerciseId] || '0', 10);
    if (weight <= 0 || reps <= 0) {
      Alert.alert('Ошибка', 'Укажите вес и повторения');
      return;
    }
    addSet(exerciseId, weight, reps, false);
  };

  const handleFinish = () => {
    if (!activeWorkout || activeWorkout.exercises.length === 0) {
      Alert.alert('Ошибка', 'Добавьте хотя бы одно упражнение');
      return;
    }
    const hasAnySets = activeWorkout.exercises.some((ex) => ex.sets.length > 0);
    if (!hasAnySets) {
      Alert.alert('Ошибка', 'Добавьте хотя бы один подход');
      return;
    }
    Alert.alert('Завершить тренировку?', `Длительность: ${formatTime(timer)}`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Завершить',
        onPress: () => {
          finishWorkout();
          navigation.goBack();
        },
      },
    ]);
  };

  const handleCancel = () => {
    Alert.alert('Отменить тренировку?', 'Все данные будут потеряны', [
      { text: 'Нет', style: 'cancel' },
      {
        text: 'Да, отменить',
        style: 'destructive',
        onPress: () => {
          cancelWorkout();
          navigation.goBack();
        },
      },
    ]);
  };

  if (!activeWorkout) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.loadingText}>Загрузка...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.timerBar}>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.cancelText}>Отмена</Text>
          </TouchableOpacity>
          <Text style={styles.timerText}>{formatTime(timer)}</Text>
          <TouchableOpacity onPress={handleFinish} style={styles.finishButton}>
            <Text style={styles.finishText}>Готово</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          {activeWorkout.exercises.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Добавьте упражнения из каталога</Text>
            </View>
          ) : (
            activeWorkout.exercises.map((ex) => {
              const exerciseData = getExerciseById(ex.exerciseId);
              const gifUrl = exerciseData?.gifUrl;

              return (
                <View key={ex.id} style={styles.exerciseBlock}>
                  <View style={styles.exerciseHeader}>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{ex.exerciseName}</Text>
                      {exerciseData?.targetMuscles && (
                        <Text style={styles.muscleSubtext}>
                          {exerciseData.targetMuscles.primary.map((m) => MUSCLE_LABELS[m] || m).join(', ')}
                          {exerciseData.targetMuscles.secondary.length > 0 &&
                            ` + ${exerciseData.targetMuscles.secondary.map((m) => MUSCLE_LABELS[m] || m).join(', ')}`}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: ex.exerciseId })}
                      style={styles.detailButton}
                    >
                      <Text style={styles.detailIcon}>i</Text>
                    </TouchableOpacity>
                    {gifUrl && (
                      <TouchableOpacity onPress={() => toggleGif(ex.id)} style={styles.infoButton}>
                        <Text style={styles.infoIcon}>{showGif[ex.id] ? '▲' : '▼'}</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => removeExercise(ex.id)}>
                      <Text style={styles.removeExercise}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  {showGif[ex.id] && gifUrl && (
                    <View style={styles.gifPanel}>
                      <Image
                        source={{ uri: gifUrl }}
                        style={styles.inlineGif}
                        resizeMode="contain"
                      />
                    </View>
                  )}

                  {ex.sets.length > 0 && (
                    <View style={styles.setsContainer}>
                      <View style={styles.setsHeader}>
                        <Text style={styles.setsHeaderText}>Подход</Text>
                        <Text style={styles.setsHeaderText}>Вес × Повт.</Text>
                        <Text style={styles.setsHeaderText}>Объём</Text>
                      </View>
                      {ex.sets.map((s, idx) => (
                        <SetRow
                          key={s.id}
                          set={s}
                          index={idx + 1}
                          editable
                          onRemove={() => removeSet(ex.id, s.id)}
                        />
                      ))}
                    </View>
                  )}

                  <View style={styles.addSetRow}>
                    <TextInput
                      style={styles.input}
                      placeholder="Вес"
                      keyboardType="decimal-pad"
                      value={weightInputs[ex.id] || ''}
                      onChangeText={(t) =>
                        setWeightInputs((prev) => ({ ...prev, [ex.id]: t }))
                      }
                    />
                    <Text style={styles.inputSeparator}>×</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Повт."
                      keyboardType="number-pad"
                      value={repsInputs[ex.id] || ''}
                      onChangeText={(t) =>
                        setRepsInputs((prev) => ({ ...prev, [ex.id]: t }))
                      }
                    />
                    <TouchableOpacity
                      style={styles.addSetButton}
                      onPress={() => handleAddSet(ex.id)}
                    >
                      <Text style={styles.addSetText}>+ Подход</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}

          <TouchableOpacity
            style={styles.addExerciseButton}
            onPress={() => navigation.navigate('ExerciseList', { onSelect: true })}
          >
            <Text style={styles.addExerciseText}>+ Добавить упражнение</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
    color: colors.textSecondary,
  },
  timerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelText: {
    fontSize: 15,
    color: colors.error,
    fontWeight: '600',
  },
  timerText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.workout,
    fontVariant: ['tabular-nums'],
  },
  finishButton: {
    backgroundColor: colors.workout,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  finishText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  exerciseBlock: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  muscleSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  detailButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.workoutLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  detailIcon: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.workout,
    fontStyle: 'italic',
  },
  infoButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  infoIcon: {
    fontSize: 14,
    color: colors.workout,
  },
  removeExercise: {
    fontSize: 18,
    color: colors.error,
    paddingLeft: 10,
  },
  gifPanel: {
    width: '100%',
    height: 180,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  inlineGif: {
    width: '100%',
    height: '100%',
  },
  setsContainer: {
    paddingTop: 4,
  },
  setsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  setsHeaderText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  addSetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputSeparator: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  addSetButton: {
    backgroundColor: colors.workoutLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addSetText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.workout,
  },
  addExerciseButton: {
    borderWidth: 2,
    borderColor: colors.workout,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  addExerciseText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.workout,
  },
});
