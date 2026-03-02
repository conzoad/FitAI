import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { useExercisePrefsStore } from '../stores/useExercisePrefsStore';
import { WorkoutStackParamList } from '../models/types';
import { getExerciseById } from '../services/exerciseDatabase';
import { COLOR_TAG_PALETTE } from '../utils/constants';
import { computeExerciseRecords, computeSessionMetrics } from '../utils/calculations';
import ExerciseProgressCharts from '../components/ExerciseProgressCharts';
import RecordsCard from '../components/RecordsCard';
import MuscleMapDiagram from '../components/MuscleMapDiagram';
import { darkColors } from '../theme/colors';
import { useColors } from '../theme/useColors';
import { useLanguageStore } from '../stores/useLanguageStore';
import { t } from '../i18n/translations';

type Route = RouteProp<WorkoutStackParamList, 'ExerciseDetail'>;
type TabKey = 'progress' | 'records' | 'history';

export default function ExerciseDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<NativeStackNavigationProp<WorkoutStackParamList>>();
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

  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const lang = useLanguageStore((s) => s.language);
  const T = t(lang);

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'progress', label: T.exercise.progress },
    { key: 'records', label: T.exercise.records },
    { key: 'history', label: T.exercise.history },
  ];

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
        <Text style={styles.errorText}>{T.exercise.notFound}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>{T.common.back}</Text>
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

        {exercise.isCustom && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('CreateExercise', { exerciseId: exercise.id })}
          >
            <Text style={styles.editButtonText}>{T.exercise.edit}</Text>
          </TouchableOpacity>
        )}

        {/* Meta chips */}
        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Text style={styles.metaText}>{T.labels.muscleGroups[exercise.muscleGroup]}</Text>
          </View>
          <View style={styles.metaChip}>
            <Text style={styles.metaText}>{T.labels.equipment[exercise.equipment]}</Text>
          </View>
          <View style={[styles.metaChip, { backgroundColor: colors.workoutLight }]}>
            <Text style={[styles.metaText, { color: colors.workout }]}>
              {exercise.isCompound ? T.exercise.compound : T.exercise.isolation}
            </Text>
          </View>
          <View style={styles.metaChip}>
            <Text style={styles.metaText}>{T.labels.exerciseCategories[exercise.category]}</Text>
          </View>
          <View style={styles.metaChip}>
            <Text style={styles.metaText}>{T.labels.exerciseForce[exercise.force]}</Text>
          </View>
          <View style={styles.metaChip}>
            <Text style={styles.metaText}>{T.labels.exerciseLevels[exercise.level]}</Text>
          </View>
        </View>

        {exercise.photoUrl && (
          <View style={styles.gifContainer}>
            <Image
              source={{ uri: exercise.photoUrl }}
              style={styles.gifImage}
              resizeMode="contain"
            />
          </View>
        )}

        {exercise.gifUrl && !gifError && !exercise.photoUrl && (
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
            <Text style={styles.sectionTitle}>{T.exercise.targetMuscles}</Text>
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
              <Text style={styles.historyCount}>{history.length} {T.exercise.trainingCount}</Text>
            </View>

            {history.length > 0 ? (
              history
                .slice()
                .reverse()
                .map((h, idx) => (
                  <View key={idx} style={styles.historyItem}>
                    <Text style={styles.historyDate}>
                      {new Date(h.date).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', {
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
              <Text style={styles.noHistory}>{T.exercise.noDataHint}</Text>
            )}
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
    backButton: {
      marginBottom: 12,
    },
    backText: {
      fontSize: 16,
      color: c.workout,
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
      color: c.text,
      flex: 1,
    },
    favButton: {
      padding: 8,
    },
    favStar: {
      fontSize: 28,
      color: c.textSecondary,
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
    editButton: {
      backgroundColor: 'rgba(162, 155, 254, 0.12)',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      alignSelf: 'flex-start',
      marginBottom: 14,
    },
    editButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: c.workout,
    },
    metaRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 14,
      flexWrap: 'wrap',
    },
    metaChip: {
      backgroundColor: c.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
    metaText: {
      fontSize: 13,
      color: c.textSecondary,
      fontWeight: '500',
    },
    gifContainer: {
      width: '100%',
      height: 250,
      backgroundColor: c.surface,
      borderRadius: 12,
      marginBottom: 14,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.border,
    },
    gifLoading: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: c.surface,
    },
    gifImage: {
      width: '100%',
      height: '100%',
    },
    description: {
      fontSize: 15,
      color: c.text,
      lineHeight: 22,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: c.text,
      marginBottom: 10,
    },
    tabBar: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 4,
      marginBottom: 4,
      borderWidth: 1,
      borderColor: c.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 10,
    },
    tabActive: {
      backgroundColor: c.workout,
    },
    tabText: {
      fontSize: 13,
      fontWeight: '600',
      color: c.textSecondary,
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
      color: c.textSecondary,
    },
    historyItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: 10,
      padding: 12,
      marginBottom: 6,
    },
    historyDate: {
      fontSize: 14,
      fontWeight: '600',
      color: c.text,
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
      color: c.workout,
      fontWeight: '600',
      backgroundColor: c.workoutLight,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    noHistory: {
      fontSize: 14,
      color: c.textSecondary,
      textAlign: 'center',
      padding: 30,
    },
    errorText: {
      fontSize: 16,
      color: c.textSecondary,
      textAlign: 'center',
      marginTop: 40,
    },
  });
}
