import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getAllExercises, getAllMuscleGroups, getExercisesByGroup } from '../services/exerciseDatabase';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { useExercisePrefsStore } from '../stores/useExercisePrefsStore';
import { Exercise, MuscleGroup, ExerciseCategory, Equipment, ExerciseForce, ExerciseLevel, WorkoutStackParamList } from '../models/types';
import ExerciseCard from '../components/ExerciseCard';
import { MUSCLE_GROUP_LABELS, EQUIPMENT_LABELS, EXERCISE_CATEGORY_LABELS, EXERCISE_FORCE_LABELS, EXERCISE_LEVEL_LABELS } from '../utils/constants';
import { darkColors } from '../theme/colors';
import { useColors } from '../theme/useColors';

type Nav = NativeStackNavigationProp<WorkoutStackParamList, 'ExerciseList'>;
type Route = RouteProp<WorkoutStackParamList, 'ExerciseList'>;
type SortMode = 'default' | 'name' | 'level' | 'category';

export default function ExerciseListScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const isSelectMode = route.params?.onSelect === true;
  const addExercise = useWorkoutStore((s) => s.addExercise);

  const favorites = useExercisePrefsStore((s) => s.favorites);
  const colorTags = useExercisePrefsStore((s) => s.colorTags);
  const customExercises = useExercisePrefsStore((s) => s.customExercises);

  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup | 'all'>('all');
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Filter state
  const [filterCategory, setFilterCategory] = useState<ExerciseCategory | null>(null);
  const [filterEquipment, setFilterEquipment] = useState<Equipment | null>(null);
  const [filterForce, setFilterForce] = useState<ExerciseForce | null>(null);
  const [filterLevel, setFilterLevel] = useState<ExerciseLevel | null>(null);

  const activeFilterCount = [filterCategory, filterEquipment, filterForce, filterLevel].filter(Boolean).length;

  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const groups = useMemo(() => getAllMuscleGroups(), []);

  const allExercises = useMemo(() => getAllExercises(customExercises), [customExercises]);

  const filteredExercises = useMemo(() => {
    let list = selectedGroup === 'all'
      ? allExercises
      : allExercises.filter((e) => e.muscleGroup === selectedGroup);

    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q));
    }

    // Filters
    if (filterCategory) list = list.filter((e) => e.category === filterCategory);
    if (filterEquipment) list = list.filter((e) => e.equipment === filterEquipment);
    if (filterForce) list = list.filter((e) => e.force === filterForce);
    if (filterLevel) list = list.filter((e) => e.level === filterLevel);

    // Sort
    if (sortMode === 'name') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    } else if (sortMode === 'level') {
      const order: Record<ExerciseLevel, number> = { beginner: 0, intermediate: 1, advanced: 2 };
      list = [...list].sort((a, b) => order[a.level] - order[b.level]);
    } else if (sortMode === 'category') {
      list = [...list].sort((a, b) => a.category.localeCompare(b.category));
    }

    // Favorites first
    const favSet = new Set(favorites);
    const favs = list.filter((e) => favSet.has(e.id));
    const rest = list.filter((e) => !favSet.has(e.id));
    return [...favs, ...rest];
  }, [selectedGroup, allExercises, search, filterCategory, filterEquipment, filterForce, filterLevel, sortMode, favorites]);

  const handleSelect = useCallback((exercise: Exercise) => {
    if (isSelectMode) {
      addExercise(exercise);
      navigation.goBack();
    } else {
      navigation.navigate('ExerciseDetail', { exerciseId: exercise.id });
    }
  }, [isSelectMode, addExercise, navigation]);

  const clearFilters = () => {
    setFilterCategory(null);
    setFilterEquipment(null);
    setFilterForce(null);
    setFilterLevel(null);
  };

  const renderFilterChips = <T extends string>(
    label: string,
    options: Record<string, string>,
    selected: T | null,
    onSelect: (val: T | null) => void
  ) => (
    <View style={styles.filterSection}>
      <Text style={styles.filterSectionLabel}>{label}</Text>
      <View style={styles.chipRow}>
        {Object.entries(options).map(([key, val]) => (
          <TouchableOpacity
            key={key}
            style={[styles.modalChip, selected === key && styles.modalChipActive]}
            onPress={() => onSelect(selected === key ? null : key as T)}
          >
            <Text style={[styles.modalChipText, selected === key && styles.modalChipTextActive]}>
              {val}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {isSelectMode ? 'Выберите упражнение' : 'Каталог упражнений'}
        </Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск упражнений..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity
          style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
          onPress={() => setFilterModalVisible(true)}
        >
          <Text style={styles.filterButtonText}>
            ⚙{activeFilterCount > 0 ? ` ${activeFilterCount}` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sort row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortRow} contentContainerStyle={styles.sortContent}>
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

      {/* Muscle group filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.filterChip, selectedGroup === 'all' && styles.filterActive]}
          onPress={() => setSelectedGroup('all')}
        >
          <Text style={[styles.filterText, selectedGroup === 'all' && styles.filterTextActive]}>
            Все
          </Text>
        </TouchableOpacity>
        {groups.map((group) => (
          <TouchableOpacity
            key={group}
            style={[styles.filterChip, selectedGroup === group && styles.filterActive]}
            onPress={() => setSelectedGroup(group)}
          >
            <Text style={[styles.filterText, selectedGroup === group && styles.filterTextActive]}>
              {MUSCLE_GROUP_LABELS[group]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ExerciseCard
            exercise={item}
            onPress={() => handleSelect(item)}
            colorTag={colorTags[item.id]}
            isFavorite={favorites.includes(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Упражнения не найдены</Text>
        }
      />

      {/* FAB for creating custom exercise */}
      {!isSelectMode && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreateExercise')}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Filter Modal */}
      <Modal visible={filterModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Фильтры</Text>
              <TouchableOpacity onPress={clearFilters}>
                <Text style={styles.clearText}>Сбросить</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              {renderFilterChips('Вид', EXERCISE_CATEGORY_LABELS, filterCategory, setFilterCategory)}
              {renderFilterChips('Оборудование', EQUIPMENT_LABELS, filterEquipment, setFilterEquipment)}
              {renderFilterChips('Усилие', EXERCISE_FORCE_LABELS, filterForce, setFilterForce)}
              {renderFilterChips('Уровень', EXERCISE_LEVEL_LABELS, filterLevel, setFilterLevel)}
            </ScrollView>

            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.applyText}>Применить</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function getStyles(c: typeof darkColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 8,
    },
    backButton: {
      marginBottom: 8,
    },
    backText: {
      fontSize: 16,
      color: c.workout,
      fontWeight: '600',
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: c.text,
    },
    searchRow: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      gap: 8,
      marginBottom: 8,
    },
    searchInput: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 15,
      color: c.text,
      borderWidth: 1,
      borderColor: c.border,
    },
    filterButton: {
      backgroundColor: c.surface,
      borderRadius: 12,
      paddingHorizontal: 14,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    filterButtonActive: {
      backgroundColor: c.workout,
      borderColor: c.workout,
    },
    filterButtonText: {
      fontSize: 16,
      color: c.text,
      fontWeight: '600',
    },
    sortRow: {
      marginBottom: 6,
      flexGrow: 0,
      flexShrink: 0,
    },
    sortContent: {
      paddingHorizontal: 20,
      alignItems: 'center',
    },
    sortChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 14,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      marginRight: 6,
    },
    sortChipActive: {
      backgroundColor: c.workoutLight,
      borderColor: c.workout,
    },
    sortChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: c.textSecondary,
    },
    sortChipTextActive: {
      color: c.workout,
    },
    filterRow: {
      marginBottom: 8,
      flexGrow: 0,
      flexShrink: 0,
    },
    filterContent: {
      paddingHorizontal: 20,
      alignItems: 'center',
    },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 18,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      marginRight: 6,
    },
    filterActive: {
      backgroundColor: c.workout,
      borderColor: c.workout,
    },
    filterText: {
      fontSize: 13,
      fontWeight: '600',
      color: c.textSecondary,
    },
    filterTextActive: {
      color: '#FFFFFF',
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 80,
    },
    emptyText: {
      fontSize: 14,
      color: c.textSecondary,
      textAlign: 'center',
      padding: 40,
    },
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: c.workout,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    fabText: {
      fontSize: 28,
      color: '#FFFFFF',
      fontWeight: '300',
      marginTop: -2,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: c.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: c.text,
    },
    clearText: {
      fontSize: 14,
      color: c.workout,
      fontWeight: '600',
    },
    filterSection: {
      marginBottom: 16,
    },
    filterSectionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: c.textSecondary,
      marginBottom: 8,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    modalChip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 16,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      marginRight: 6,
      marginBottom: 6,
    },
    modalChipActive: {
      backgroundColor: c.workout,
      borderColor: c.workout,
    },
    modalChipText: {
      fontSize: 13,
      fontWeight: '500',
      color: c.textSecondary,
    },
    modalChipTextActive: {
      color: '#FFFFFF',
    },
    applyButton: {
      backgroundColor: c.workout,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 12,
    },
    applyText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
}
