import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { EXERCISES } from '../services/exerciseDatabase';
import { WorkoutStackParamList, Exercise, ProgramExercise, MuscleGroup } from '../models/types';
import { colors } from '../theme/colors';

type Nav = NativeStackNavigationProp<WorkoutStackParamList, 'CreateProgram'>;

const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'Грудь',
  back: 'Спина',
  shoulders: 'Плечи',
  biceps: 'Бицепс',
  triceps: 'Трицепс',
  legs: 'Ноги',
  glutes: 'Ягодицы',
  abs: 'Пресс',
  cardio: 'Кардио',
  fullBody: 'Всё тело',
};

interface SelectedExercise extends ProgramExercise {
  name: string;
}

export default function CreateProgramScreen() {
  const navigation = useNavigation<Nav>();
  const addProgram = useWorkoutStore((s) => s.addProgram);
  const [name, setName] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [filterGroup, setFilterGroup] = useState<MuscleGroup | 'all'>('all');

  const filteredExercises = filterGroup === 'all'
    ? EXERCISES
    : EXERCISES.filter((e) => e.muscleGroup === filterGroup);

  const handleAddExercise = (exercise: Exercise) => {
    if (selectedExercises.some((e) => e.exerciseId === exercise.id)) return;
    setSelectedExercises((prev) => [
      ...prev,
      {
        exerciseId: exercise.id,
        name: exercise.name,
        targetSets: 3,
        targetReps: '10',
      },
    ]);
    setShowPicker(false);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setSelectedExercises((prev) => prev.filter((e) => e.exerciseId !== exerciseId));
  };

  const handleUpdateSets = (exerciseId: string, sets: string) => {
    const val = parseInt(sets) || 0;
    setSelectedExercises((prev) =>
      prev.map((e) => e.exerciseId === exerciseId ? { ...e, targetSets: val } : e)
    );
  };

  const handleUpdateReps = (exerciseId: string, reps: string) => {
    setSelectedExercises((prev) =>
      prev.map((e) => e.exerciseId === exerciseId ? { ...e, targetReps: reps } : e)
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Ошибка', 'Введите название программы');
      return;
    }
    if (selectedExercises.length === 0) {
      Alert.alert('Ошибка', 'Добавьте хотя бы одно упражнение');
      return;
    }
    addProgram(
      name.trim(),
      selectedExercises.map(({ exerciseId, targetSets, targetReps }) => ({
        exerciseId,
        targetSets,
        targetReps,
      }))
    );
    Alert.alert('Готово', 'Программа сохранена');
    navigation.goBack();
  };

  const muscleGroups: (MuscleGroup | 'all')[] = ['all', ...Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[]];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Назад</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Новая программа</Text>

        <Text style={styles.label}>Название</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Push/Pull/Legs, Грудь+Трицепс..."
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.label}>Упражнения ({selectedExercises.length})</Text>

        {selectedExercises.map((ex, idx) => (
          <View key={ex.exerciseId} style={styles.exerciseItem}>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseNumber}>{idx + 1}.</Text>
              <Text style={styles.exerciseName} numberOfLines={1}>{ex.name}</Text>
              <TouchableOpacity onPress={() => handleRemoveExercise(ex.exerciseId)}>
                <Text style={styles.removeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.setsRepsRow}>
              <View style={styles.setsRepsGroup}>
                <Text style={styles.setsRepsLabel}>Подходов</Text>
                <TextInput
                  style={styles.setsRepsInput}
                  value={String(ex.targetSets)}
                  onChangeText={(t) => handleUpdateSets(ex.exerciseId, t)}
                  keyboardType="number-pad"
                  selectTextOnFocus
                />
              </View>
              <Text style={styles.separator}>×</Text>
              <View style={styles.setsRepsGroup}>
                <Text style={styles.setsRepsLabel}>Повторений</Text>
                <TextInput
                  style={styles.setsRepsInput}
                  value={ex.targetReps}
                  onChangeText={(t) => handleUpdateReps(ex.exerciseId, t)}
                  selectTextOnFocus
                />
              </View>
            </View>
          </View>
        ))}

        {!showPicker ? (
          <TouchableOpacity
            style={styles.addExerciseButton}
            onPress={() => setShowPicker(true)}
          >
            <Text style={styles.addExerciseText}>+ Добавить упражнение</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.pickerContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
              {muscleGroups.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.filterChip, filterGroup === g && styles.filterChipActive]}
                  onPress={() => setFilterGroup(g)}
                >
                  <Text style={[styles.filterChipText, filterGroup === g && styles.filterChipTextActive]}>
                    {g === 'all' ? 'Все' : MUSCLE_GROUP_LABELS[g]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {filteredExercises.map((ex) => {
              const isSelected = selectedExercises.some((s) => s.exerciseId === ex.id);
              return (
                <TouchableOpacity
                  key={ex.id}
                  style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                  onPress={() => handleAddExercise(ex)}
                  disabled={isSelected}
                >
                  <View>
                    <Text style={[styles.pickerItemName, isSelected && styles.pickerItemNameSelected]}>
                      {ex.name}
                    </Text>
                    <Text style={styles.pickerItemMeta}>
                      {MUSCLE_GROUP_LABELS[ex.muscleGroup]} · {ex.equipment}
                    </Text>
                  </View>
                  {isSelected && <Text style={styles.checkMark}>✓</Text>}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.closePicker}
              onPress={() => setShowPicker(false)}
            >
              <Text style={styles.closePickerText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        )}

        {selectedExercises.length > 0 && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveText}>Сохранить программу</Text>
          </TouchableOpacity>
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
    marginBottom: 8,
  },
  backText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseItem: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.workout,
    width: 24,
  },
  exerciseName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  removeBtn: {
    fontSize: 16,
    color: colors.error,
    paddingHorizontal: 6,
  },
  setsRepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingLeft: 24,
    gap: 8,
  },
  setsRepsGroup: {
    flex: 1,
  },
  setsRepsLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  setsRepsInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 8,
    fontSize: 15,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
  separator: {
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: 16,
  },
  addExerciseButton: {
    borderWidth: 2,
    borderColor: colors.workout,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  addExerciseText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.workout,
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.workout,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.background,
    marginRight: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.workout,
    borderColor: colors.workout,
  },
  filterChipText: {
    fontSize: 13,
    color: colors.text,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerItemSelected: {
    opacity: 0.5,
  },
  pickerItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  pickerItemNameSelected: {
    color: colors.textSecondary,
  },
  pickerItemMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  checkMark: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '700',
  },
  closePicker: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  closePickerText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.workout,
  },
  saveButton: {
    backgroundColor: colors.workout,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
