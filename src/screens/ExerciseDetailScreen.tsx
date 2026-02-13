import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { useExercisePrefsStore } from '../stores/useExercisePrefsStore';
import { WorkoutStackParamList } from '../models/types';
import { getExerciseById } from '../services/exerciseDatabase';
import { MUSCLE_GROUP_LABELS, EQUIPMENT_LABELS, EXERCISE_CATEGORY_LABELS, EXERCISE_FORCE_LABELS, EXERCISE_LEVEL_LABELS, COLOR_TAG_PALETTE } from '../utils/constants';
import { computeExerciseRecords, computeSessionMetrics } from '../utils/calculations';
import ExerciseProgressCharts from '../components/ExerciseProgressCharts';
import RecordsCard from '../components/RecordsCard';
import MuscleMapDiagram from '../components/MuscleMapDiagram';
import { colors } from '../theme/colors';

type Route = RouteProp<WorkoutStackParamList, 'ExerciseDetail'>;
type TabKey = 'progress' | 'records' | 'history';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'progress', label: 'Прогресс' },
  { key: 'records', label: 'Рекорды' },
  { key: 'history', label: 'История' },
];

export default function ExerciseDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation();
  const { exerciseId } = route.params;
  const sessions = useWorkoutStore((s) => s.sessions);
  const [gifLoading, setGifLoading] = useState(true);
  const [gifError, setGifError] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('progress');

  const favorites = useExercisePrefsStore((s) => s.favorites);
  const colorTags = useExercisePrefsStore((s) => s.colorTags);
  const customExercises = useExercisePrefsStore((s) => s.customExercises);
  const toggleFavorite = useExercisePrefsStore((s) => s.toggleFavorite);
  const setColorTag = useExercisePrefsStore((s) => s.setColorTag);

  const isFavorite = favorites.includes(exerciseId);
  const currentColor = colorTags[exerciseId] || null;

  const exercise = useMemo(() => getExerciseById(exerciseId, customExercises), [exerciseId, customExercises]);

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

  const records = useMemo(() => computeExerciseRecords(history), [history]);
  const metrics = useMemo(() => computeSessionMetrics(history), [history]);

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

        <View style={styles.titleRow}>
          <Text style={styles.title}>{exercise.name}</Text>
          <TouchableOpacity onPress={() => toggleFavorite(exerciseId)} style={styles.favButton}>
            <Text style={[styles.favStar, isFavorite && styles.favStarActive]}>
              {isFavorite ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Color picker */}
        <View style={styles.colorRow}>
          {COLOR_TAG_PALETTE.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.colorCircle,
                { backgroundColor: c },
                currentColor === c && styles.colorCircleActive,
              ]}
              onPress={() => setColorTag(exerciseId, currentColor === c ? null : c)}
            />
          ))}
        </View>

        {/* Meta chips */}
        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Text style={styles.metaText}>{MUSCLE_GROUP_LABELS[exercise.muscleGroup]}</Text>
          </View>
          <View style={styles.metaChip}>
            <Text style={styles.metaText}>{EQUIPMENT_LABELS[exercise.equipment]}</Text>
          </View>
          <View style={[styles.metaChip, { backgroundColor: colors.workoutLight }]}>
            <Text style={[styles.metaText, { color: colors.workout }]}>
              {exercise.isCompound ? 'Базовое' : 'Изолирующее'}
            </Text>
          </View>
          <View style={styles.metaChip}>
            <Text style={styles.metaText}>{EXERCISE_CATEGORY_LABELS[exercise.category]}</Text>
          </View>
          <View style={styles.metaChip}>
            <Text style={styles.metaText}>{EXERCISE_FORCE_LABELS[exercise.force]}</Text>
          </View>
          <View style={styles.metaChip}>
            <Text style={styles.metaText}>{EXERCISE_LEVEL_LABELS[exercise.level]}</Text>
          </View>
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

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'progress' && (
          <ExerciseProgressCharts metrics={metrics} />
        )}

        {activeTab === 'records' && (
          <RecordsCard records={records} />
        )}

        {activeTab === 'history' && (
          <View style={styles.historySection}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyCount}>{history.length} тренировок</Text>
            </View>

            {history.length > 0 ? (
              history
                .slice()
                .reverse()
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
                ))
            ) : (
              <Text style={styles.noHistory}>Нет данных. Выполните это упражнение в тренировке!</Text>
            )}
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
  backButton: {
    marginBottom: 12,
  },
  backText: {
    fontSize: 16,
    color: colors.workout,
    fontWeight: '600',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  favButton: {
    padding: 8,
  },
  favStar: {
    fontSize: 28,
    color: colors.textSecondary,
  },
  favStarActive: {
    color: '#FECA57',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  colorCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircleActive: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: colors.workout,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  historySection: {
    paddingTop: 8,
  },
  historyHeader: {
    marginBottom: 10,
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
