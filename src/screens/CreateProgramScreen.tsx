import React, { useState, useMemo } from 'react';
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
import { useExercisePrefsStore } from '../stores/useExercisePrefsStore';
import { getAllExercises } from '../services/exerciseDatabase';
import { EQUIPMENT_LABELS } from '../utils/constants';
import { WorkoutStackParamList, Exercise, ProgramExercise, MuscleGroup, ExerciseLevel } from '../models/types';
import { darkColors } from '../theme/colors';
import { useColors } from '../theme/useColors';

type Nav = NativeStackNavigationProp<WorkoutStackParamList, 'CreateProgram'>;
type SortMode = 'default' | 'name' | 'level' | 'category';

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
  const customExercises = useExercisePrefsStore((s) => s.customExercises);
  const favorites = useExercisePrefsStore((s) => s.favorites);
  const colorTags = useExercisePrefsStore((s) => s.colorTags);

  const [name, setName] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [filterGroup, setFilterGroup] = useState<MuscleGroup | 'all'>('all');
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('default');

  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const allExercises = getAllExercises(customExercises);

  const filteredExercises = useMemo(() => {
    let list = filterGroup === 'all'
      ? allExercises
      : allExercises.filter((e) => e.muscleGroup === filterGroup);

    // Поиск
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q));
    }

    // Сортировка
    if (sortMode === 'name') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    } else if (sortMode === 'level') {
      const order: Record<ExerciseLevel, number> = { beginner: 0, intermediate: 1, advanced: 2 };
      list = [...list].sort((a, b) => order[a.level] - order[b.level]);
    } else if (sortMode === 'category') {
      list = [...list].sort((a, b) => a.category.localeCompare(b.category));
    }

    // Избранные первыми (только если сортировка по умолчанию)
    if (sortMode === 'default') {
      const favSet = new Set(favorites);
      const favs = list.filter((e) => favSet.has(e.id));
      const rest = list.filter((e) => !favSet.has(e.id));
      return [...favs, ...rest];
    }

    return list;
  }, [filterGroup, allExercises, search, sortMode, favorites]);

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
            <TextInput
              style={styles.searchInput}
              placeholder="Поиск упражнений..."
              placeholderTextColor={colors.textSecondary}
              value={search}
              onChangeText={setSearch}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortRow}>
              {([
                ['default', 'По умолчанию'],
                ['name', 'По имени'],
                ['level', 'По уровню'],
                ['category', 'По виду'],
              ] as [SortMode, string][]).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.sortChip, sortMode === key && styles.sortChipActive]}
                  onPress={() => setSortMode(key)}
                >
                  <Text style={[styles.sortChipText, sortMode === key && styles.sortChipTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
              const isFavorite = favorites.includes(ex.id);
              const tagColor = colorTags[ex.id];
              return (
                <TouchableOpacity
                  key={ex.id}
                  style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                  onPress={() => handleAddExercise(ex)}
                  disabled={isSelected}
                >
                  <View style={styles.pickerItemContent}>
                    <View>
                      <View style={styles.pickerItemHeader}>
                        {tagColor && <View style={[styles.colorDot, { backgroundColor: tagColor }]} />}
                        {isFavorite && <Text style={styles.favoriteIcon}>★</Text>}
                        <Text style={[styles.pickerItemName, isSelected && styles.pickerItemNameSelected]}>
                          {ex.name}
                        </Text>
                      </View>
                      <Text style={styles.pickerItemMeta}>
                        {MUSCLE_GROUP_LABELS[ex.muscleGroup]} · {EQUIPMENT_LABELS[ex.equipment]}
                      </Text>
                    </View>
                    {isSelected && <Text style={styles.checkMark}>✓</Text>}
                  </View>
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
      marginBottom: 8,
    },
    backText: {
      fontSize: 16,
      color: c.primary,
      fontWeight: '600',
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: c.text,
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: c.textSecondary,
      marginTop: 16,
      marginBottom: 8,
    },
    input: {
      backgroundColor: c.surface,
      borderRadius: 10,
      padding: 14,
      fontSize: 16,
      color: c.text,
      borderWidth: 1,
      borderColor: c.border,
    },
    exerciseItem: {
      backgroundColor: c.surface,
      borderRadius: 10,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
    exerciseInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    exerciseNumber: {
      fontSize: 15,
      fontWeight: '700',
      color: c.workout,
      width: 24,
    },
    exerciseName: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: c.text,
    },
    removeBtn: {
      fontSize: 16,
      color: c.error,
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
      color: c.textSecondary,
      marginBottom: 4,
    },
    setsRepsInput: {
      backgroundColor: c.background,
      borderRadius: 8,
      padding: 8,
      fontSize: 15,
      textAlign: 'center',
      borderWidth: 1,
      borderColor: c.border,
      color: c.text,
    },
    separator: {
      fontSize: 18,
      color: c.textSecondary,
      marginTop: 16,
    },
    addExerciseButton: {
      borderWidth: 2,
      borderColor: c.workout,
      borderStyle: 'dashed',
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginTop: 8,
    },
    addExerciseText: {
      fontSize: 15,
      fontWeight: '700',
      color: c.workout,
    },
    pickerContainer: {
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 12,
      marginTop: 8,
      borderWidth: 1,
      borderColor: c.workout,
    },
    searchInput: {
      backgroundColor: c.background,
      borderRadius: 10,
      padding: 12,
      fontSize: 15,
      color: c.text,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 10,
    },
    sortRow: {
      marginBottom: 10,
    },
    sortChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 14,
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
      marginRight: 6,
    },
    sortChipActive: {
      backgroundColor: c.primaryLight,
      borderColor: c.primary,
    },
    sortChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: c.textSecondary,
    },
    sortChipTextActive: {
      color: c.primary,
    },
    filterRow: {
      flexDirection: 'row',
      marginBottom: 10,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: c.background,
      marginRight: 6,
      borderWidth: 1,
      borderColor: c.border,
    },
    filterChipActive: {
      backgroundColor: c.workout,
      borderColor: c.workout,
    },
    filterChipText: {
      fontSize: 13,
      color: c.text,
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
      borderBottomColor: c.border,
    },
    pickerItemSelected: {
      opacity: 0.5,
    },
    pickerItemContent: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    pickerItemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    colorDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    favoriteIcon: {
      fontSize: 14,
      color: c.primary,
    },
    pickerItemName: {
      fontSize: 15,
      fontWeight: '600',
      color: c.text,
    },
    pickerItemNameSelected: {
      color: c.textSecondary,
    },
    pickerItemMeta: {
      fontSize: 12,
      color: c.textSecondary,
      marginTop: 2,
    },
    checkMark: {
      fontSize: 18,
      color: c.primary,
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
      color: c.workout,
    },
    saveButton: {
      backgroundColor: c.workout,
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
}
