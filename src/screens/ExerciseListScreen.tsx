import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EXERCISES, getAllMuscleGroups, getExercisesByGroup } from '../services/exerciseDatabase';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { Exercise, MuscleGroup, WorkoutStackParamList } from '../models/types';
import ExerciseCard from '../components/ExerciseCard';
import { MUSCLE_GROUP_LABELS } from '../utils/constants';
import { colors } from '../theme/colors';

type Nav = NativeStackNavigationProp<WorkoutStackParamList, 'ExerciseList'>;
type Route = RouteProp<WorkoutStackParamList, 'ExerciseList'>;

export default function ExerciseListScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const isSelectMode = route.params?.onSelect === true;
  const addExercise = useWorkoutStore((s) => s.addExercise);

  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup | 'all'>('all');

  const groups = useMemo(() => getAllMuscleGroups(), []);

  const filteredExercises = useMemo(() => {
    if (selectedGroup === 'all') return EXERCISES;
    return getExercisesByGroup(selectedGroup);
  }, [selectedGroup]);

  const handleSelect = (exercise: Exercise) => {
    if (isSelectMode) {
      addExercise(exercise);
      navigation.goBack();
    } else {
      navigation.navigate('ExerciseDetail', { exerciseId: exercise.id });
    }
  };

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
          <ExerciseCard exercise={item} onPress={() => handleSelect(item)} />
        )}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.workout,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  filterRow: {
    maxHeight: 50,
    marginBottom: 8,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterActive: {
    backgroundColor: colors.workout,
    borderColor: colors.workout,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
});
