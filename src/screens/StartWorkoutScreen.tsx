import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Modal,
  Vibration,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { useExercisePrefsStore } from '../stores/useExercisePrefsStore';
import { WorkoutStackParamList } from '../models/types';

import { getExerciseById } from '../services/exerciseDatabase';
import { MUSCLE_LABELS } from '../utils/constants';
import SetRow from '../components/SetRow';
import { darkColors } from '../theme/colors';
import { useColors } from '../theme/useColors';
import { useLanguageStore } from '../stores/useLanguageStore';
import { t } from '../i18n/translations';
import {
  requestNotificationPermissions,
  showRestTimerNotification,
  clearRestTimerNotification,
  clearAllNotifications,
} from '../services/notificationService';

type Nav = NativeStackNavigationProp<WorkoutStackParamList, 'StartWorkout'>;

const REST_OPTIONS = [30, 45, 60, 90, 120, 150, 180];
const DEFAULT_REST = 90;

export default function StartWorkoutScreen() {
  const navigation = useNavigation<Nav>();
  const activeWorkout = useWorkoutStore((s) => s.activeWorkout);
  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  const addSet = useWorkoutStore((s) => s.addSet);
  const removeSet = useWorkoutStore((s) => s.removeSet);
  const removeExercise = useWorkoutStore((s) => s.removeExercise);
  const finishWorkout = useWorkoutStore((s) => s.finishWorkout);
  const cancelWorkout = useWorkoutStore((s) => s.cancelWorkout);

  const colors = useColors();
  const lang = useLanguageStore((s) => s.language);
  const T = t(lang);
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [timer, setTimer] = useState(0);
  const [weightInputs, setWeightInputs] = useState<Record<string, string>>({});
  const [repsInputs, setRepsInputs] = useState<Record<string, string>>({});
  const [showGif, setShowGif] = useState<Record<string, boolean>>({});
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});
  const [frozenElapsed, setFrozenElapsed] = useState<Record<string, number>>({});
  const customExercises = useExercisePrefsStore((s) => s.customExercises);

  // Timer states
  const [exerciseStartTimes, setExerciseStartTimes] = useState<Record<string, number>>({});
  const [exerciseElapsed, setExerciseElapsed] = useState<Record<string, number>>({});
  const [restTimers, setRestTimers] = useState<Record<string, { remaining: number; total: number }>>({});
  const [restDurations, setRestDurations] = useState<Record<string, number>>({});
  const [restModalExerciseId, setRestModalExerciseId] = useState<string | null>(null);

  // Pause rest timers when app goes to background
  const appState = useRef(AppState.currentState);
  const savedRestTimers = useRef<Record<string, { remaining: number; total: number }> | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        // Going to background: save rest timers
        savedRestTimers.current = { ...restTimers };
      } else if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // Returning to foreground: restore saved rest timers (effectively pausing them)
        if (savedRestTimers.current) {
          setRestTimers(savedRestTimers.current);
          savedRestTimers.current = null;
        }
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, [restTimers]);

  const toggleGif = (exerciseId: string) => {
    setShowGif((prev) => ({ ...prev, [exerciseId]: !prev[exerciseId] }));
  };

  const toggleExerciseComplete = (exerciseId: string) => {
    const wasCompleted = completedExercises[exerciseId];
    if (!wasCompleted) {
      // Freeze elapsed time
      setFrozenElapsed((prev) => ({ ...prev, [exerciseId]: exerciseElapsed[exerciseId] || 0 }));
    } else {
      // Resuming: reset start time so elapsed continues from frozen value
      const frozen = frozenElapsed[exerciseId] || 0;
      setExerciseStartTimes((prev) => ({ ...prev, [exerciseId]: Date.now() - frozen * 1000 }));
      setFrozenElapsed((prev) => {
        const next = { ...prev };
        delete next[exerciseId];
        return next;
      });
    }
    setCompletedExercises((prev) => ({ ...prev, [exerciseId]: !prev[exerciseId] }));
    // Stop rest timer when completing exercise
    setRestTimers((prev) => {
      const next = { ...prev };
      delete next[exerciseId];
      return next;
    });
  };

  useEffect(() => {
    if (!activeWorkout) {
      startWorkout();
    }
  }, []);

  // Request notification permissions on mount
  useEffect(() => {
    requestNotificationPermissions();
    return () => {
      clearAllNotifications();
    };
  }, []);

  // Initialize exercise start times when exercises appear
  useEffect(() => {
    if (!activeWorkout) return;
    const now = Date.now();
    setExerciseStartTimes((prev) => {
      const next = { ...prev };
      for (const ex of activeWorkout.exercises) {
        if (!next[ex.id]) {
          next[ex.id] = now;
        }
      }
      return next;
    });
  }, [activeWorkout?.exercises.length]);

  // Unified timer interval: total workout + per-exercise elapsed + rest countdowns
  useEffect(() => {
    const interval = setInterval(() => {
      // Skip all timer updates while app is in background
      if (appState.current !== 'active') return;

      const now = Date.now();

      // Update total workout timer
      if (activeWorkout) {
        setTimer(Math.floor((now - activeWorkout.startTime) / 1000));
      }

      // Update exercise elapsed times (skip completed)
      setExerciseElapsed((prev) => {
        const next: Record<string, number> = {};
        for (const [id, start] of Object.entries(exerciseStartTimes)) {
          if (completedExercises[id]) {
            next[id] = prev[id] ?? frozenElapsed[id] ?? Math.floor((now - start) / 1000);
          } else {
            next[id] = Math.floor((now - start) / 1000);
          }
        }
        return next;
      });

      // Update rest countdowns — continue into negative
      setRestTimers((prev) => {
        const next: Record<string, { remaining: number; total: number }> = {};
        let changed = false;
        for (const [id, rt] of Object.entries(prev)) {
          next[id] = { ...rt, remaining: rt.remaining - 1 };
          changed = true;
          if (rt.remaining === 1) {
            Vibration.vibrate(500);
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeWorkout?.startTime, exerciseStartTimes, completedExercises, frozenElapsed]);

  // Update notification when rest timers change
  useEffect(() => {
    const entries = Object.entries(restTimers);
    if (entries.length === 0) {
      clearRestTimerNotification();
      return;
    }
    // Show notification for the first active rest timer
    const [exerciseId, rt] = entries[0];
    const exercise = activeWorkout?.exercises.find((e) => e.id === exerciseId);
    const name = exercise?.exerciseName || T.startWorkout.exercise;
    showRestTimerNotification(name, rt.remaining, rt.total);
  }, [restTimers, activeWorkout?.exercises]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAddSet = (exerciseId: string) => {
    const weight = parseFloat(weightInputs[exerciseId] || '0');
    const reps = parseInt(repsInputs[exerciseId] || '0', 10);
    if (weight <= 0 || reps <= 0) {
      Alert.alert(T.common.error, T.startWorkout.errorWeightReps);
      return;
    }
    addSet(exerciseId, weight, reps, false);

    // Start rest countdown for this exercise
    const restSec = restDurations[exerciseId] || DEFAULT_REST;
    setRestTimers((prev) => ({
      ...prev,
      [exerciseId]: { remaining: restSec, total: restSec },
    }));
  };

  const handleSkipRest = (exerciseId: string) => {
    setRestTimers((prev) => {
      const next = { ...prev };
      delete next[exerciseId];
      if (Object.keys(next).length === 0) {
        clearRestTimerNotification();
      }
      return next;
    });
  };

  const handleFinish = () => {
    if (!activeWorkout || activeWorkout.exercises.length === 0) {
      Alert.alert(T.common.error, T.startWorkout.errorNoExercises);
      return;
    }
    const hasAnySets = activeWorkout.exercises.some((ex) => ex.sets.length > 0);
    if (!hasAnySets) {
      Alert.alert(T.common.error, T.startWorkout.errorNoSets);
      return;
    }
    Alert.alert(T.startWorkout.finishTitle, `${T.charts.duration}: ${formatTime(timer)}`, [
      { text: T.common.cancel, style: 'cancel' },
      {
        text: T.startWorkout.finish,
        onPress: () => {
          clearAllNotifications();
          finishWorkout();
          navigation.goBack();
        },
      },
    ]);
  };

  const handleCancel = () => {
    Alert.alert(T.startWorkout.cancelTitle, T.startWorkout.cancelMessage, [
      { text: T.startWorkout.cancelNo, style: 'cancel' },
      {
        text: T.startWorkout.cancelYes,
        style: 'destructive',
        onPress: () => {
          clearAllNotifications();
          cancelWorkout();
          navigation.goBack();
        },
      },
    ]);
  };

  const getRestProgress = (exerciseId: string): number => {
    const rt = restTimers[exerciseId];
    if (!rt || rt.total === 0) return 0;
    return Math.max(0, rt.remaining / rt.total);
  };

  const handleAddTime = (exerciseId: string, seconds: number) => {
    setRestTimers((prev) => {
      const rt = prev[exerciseId];
      if (!rt) return prev;
      const newRemaining = rt.remaining < 0 ? seconds : rt.remaining + seconds;
      return {
        ...prev,
        [exerciseId]: { remaining: newRemaining, total: rt.total + seconds },
      };
    });
  };

  if (!activeWorkout) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.loadingText}>{T.common.loading}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.timerBar}>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.cancelText}>{T.startWorkout.cancelWorkout}</Text>
          </TouchableOpacity>
          <Text style={styles.timerText}>{formatTime(timer)}</Text>
          <TouchableOpacity onPress={handleFinish} style={styles.finishButton}>
            <Text style={styles.finishText}>{T.startWorkout.done}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          {activeWorkout.exercises.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{T.startWorkout.addExercisesHint}</Text>
            </View>
          ) : (
            activeWorkout.exercises.map((ex) => {
              const exerciseData = getExerciseById(ex.exerciseId, customExercises);
              const gifUrl = exerciseData?.gifUrl;
              const thumbUrl = exerciseData?.photoUrl || exerciseData?.gifUrl;
              const restTimer = restTimers[ex.id];
              const isResting = restTimer !== undefined;
              const isOvertime = restTimer && restTimer.remaining < 0;
              const elapsed = exerciseElapsed[ex.id] || 0;
              const currentRestDuration = restDurations[ex.id] || DEFAULT_REST;
              const isCompleted = completedExercises[ex.id] || false;

              return (
                <View key={ex.id} style={[styles.exerciseBlock, isCompleted && styles.exerciseBlockCompleted]}>
                  <View style={styles.exerciseHeader}>
                    {thumbUrl && (
                      <Image
                        source={{ uri: thumbUrl }}
                        style={[styles.exerciseThumb, isCompleted && styles.exerciseThumbCompleted]}
                      />
                    )}
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>
                        {isCompleted ? '✓ ' : ''}{ex.exerciseName}
                      </Text>
                      <View style={styles.exerciseMetaRow}>
                        {exerciseData?.targetMuscles && (
                          <Text style={styles.muscleSubtext}>
                            {exerciseData.targetMuscles.primary.map((m) => MUSCLE_LABELS[m] || m).join(', ')}
                          </Text>
                        )}
                        <Text style={styles.exerciseTimer}>{formatTime(elapsed)}</Text>
                      </View>
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
                    <TouchableOpacity onPress={() => setRestModalExerciseId(ex.id)} style={styles.settingsButton}>
                      <Text style={styles.settingsIcon}>⚙</Text>
                    </TouchableOpacity>
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
                        <Text style={styles.setsHeaderIndex}>{T.startWorkout.set}</Text>
                        <Text style={styles.setsHeaderData}>{T.startWorkout.weightReps}</Text>
                        <Text style={styles.setsHeaderVolume}>{T.startWorkout.volume}</Text>
                        <View style={{ width: 28 }} />
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

                  {/* Rest countdown */}
                  {isResting && (
                    <View style={[styles.restBar, isOvertime && styles.restBarOvertime]}>
                      <View style={styles.restBarContent}>
                        <Text style={styles.restLabel}>{isOvertime ? T.startWorkout.restBreak : T.startWorkout.rest}</Text>
                        <Text style={[
                          styles.restCountdown,
                          isOvertime && { color: colors.error },
                        ]}>
                          {isOvertime
                            ? `-${formatTime(Math.abs(restTimer.remaining))}`
                            : formatTime(restTimer.remaining)}
                        </Text>
                        <TouchableOpacity onPress={() => handleAddTime(ex.id, 30)} style={styles.addTimeButton}>
                          <Text style={styles.addTimeText}>{T.startWorkout.plus30s}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleAddTime(ex.id, 60)} style={styles.addTimeButton}>
                          <Text style={styles.addTimeText}>{T.startWorkout.plus1m}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleAddTime(ex.id, 120)} style={styles.addTimeButton}>
                          <Text style={styles.addTimeText}>{T.startWorkout.plus2m}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleSkipRest(ex.id)} style={styles.skipRestButton}>
                          <Text style={styles.skipRestText}>{T.startWorkout.skip}</Text>
                        </TouchableOpacity>
                      </View>
                      {!isOvertime && (
                        <View style={styles.restProgressBg}>
                          <View
                            style={[
                              styles.restProgressFill,
                              { width: `${getRestProgress(ex.id) * 100}%` },
                            ]}
                          />
                        </View>
                      )}
                    </View>
                  )}

                  {!isCompleted && (
                    <View style={styles.addSetRow}>
                      <TextInput
                        style={styles.input}
                        placeholder={T.startWorkout.weight}
                        placeholderTextColor={colors.textMuted}
                        keyboardType="decimal-pad"
                        value={weightInputs[ex.id] || ''}
                        onChangeText={(t) =>
                          setWeightInputs((prev) => ({ ...prev, [ex.id]: t }))
                        }
                      />
                      <Text style={styles.inputSeparator}>×</Text>
                      <TextInput
                        style={styles.input}
                        placeholder={T.startWorkout.reps}
                        placeholderTextColor={colors.textMuted}
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
                        <Text style={styles.addSetText}>{T.startWorkout.addSet}</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={styles.exerciseFooter}>
                    {!isCompleted && (
                      <Text style={styles.restDurationText}>
                        {`${T.startWorkout.restTime}${currentRestDuration}s`}
                      </Text>
                    )}
                    <TouchableOpacity
                      style={[styles.completeExerciseButton, isCompleted && styles.completeExerciseButtonDone]}
                      onPress={() => toggleExerciseComplete(ex.id)}
                    >
                      <Text style={[styles.completeExerciseText, isCompleted && styles.completeExerciseTextDone]}>
                        {isCompleted ? T.startWorkout.resume : T.startWorkout.finish}
                      </Text>
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
            <Text style={styles.addExerciseText}>{T.startWorkout.addExercise}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Rest duration settings modal */}
      <Modal
        visible={restModalExerciseId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setRestModalExerciseId(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setRestModalExerciseId(null)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{T.startWorkout.restTimeTitle}</Text>
            {REST_OPTIONS.map((sec) => {
              const isSelected = restModalExerciseId
                ? (restDurations[restModalExerciseId] || DEFAULT_REST) === sec
                : false;
              return (
                <TouchableOpacity
                  key={sec}
                  style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                  onPress={() => {
                    if (restModalExerciseId) {
                      setRestDurations((prev) => ({ ...prev, [restModalExerciseId]: sec }));
                    }
                    setRestModalExerciseId(null);
                  }}
                >
                  <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}>
                    {sec >= 60 ? `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}` : `0:${sec.toString().padStart(2, '0')}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setRestModalExerciseId(null)}
            >
              <Text style={styles.modalCancelText}>{T.common.cancel}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
    loadingText: {
      textAlign: 'center',
      marginTop: 40,
      color: c.textSecondary,
    },
    timerBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    cancelText: {
      fontSize: 15,
      color: c.error,
      fontWeight: '600',
    },
    timerText: {
      fontSize: 22,
      fontWeight: '700',
      color: c.workout,
      fontVariant: ['tabular-nums'],
    },
    finishButton: {
      backgroundColor: c.workout,
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
      color: c.textSecondary,
      textAlign: 'center',
    },
    exerciseBlock: {
      backgroundColor: c.surface,
      borderRadius: 12,
      marginBottom: 12,
      overflow: 'hidden',
    },
    exerciseHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    exerciseInfo: {
      flex: 1,
    },
    exerciseThumb: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 10,
      backgroundColor: c.background,
    },
    exerciseThumbCompleted: {
      opacity: 0.4,
    },
    exerciseName: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
    },
    exerciseMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
      gap: 8,
    },
    muscleSubtext: {
      fontSize: 12,
      color: c.textSecondary,
    },
    exerciseTimer: {
      fontSize: 12,
      fontWeight: '600',
      color: c.workout,
      fontVariant: ['tabular-nums'],
    },
    detailButton: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: c.workoutLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
    },
    detailIcon: {
      fontSize: 14,
      fontWeight: '700',
      color: c.workout,
      fontStyle: 'italic',
    },
    infoButton: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    infoIcon: {
      fontSize: 14,
      color: c.workout,
    },
    settingsButton: {
      paddingHorizontal: 6,
      paddingVertical: 4,
    },
    settingsIcon: {
      fontSize: 16,
      color: c.textSecondary,
    },
    removeExercise: {
      fontSize: 18,
      color: c.error,
      paddingLeft: 10,
    },
    gifPanel: {
      width: '100%',
      height: 180,
      backgroundColor: c.background,
      justifyContent: 'center',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: c.border,
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
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    setsHeaderIndex: {
      width: 40,
      fontSize: 11,
      color: c.textSecondary,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    setsHeaderData: {
      flex: 1,
      fontSize: 11,
      color: c.textSecondary,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    setsHeaderVolume: {
      width: 60,
      textAlign: 'right',
      fontSize: 11,
      color: c.textSecondary,
      fontWeight: '600',
      textTransform: 'uppercase',
      marginRight: 8,
    },
    // Rest timer
    restBar: {
      backgroundColor: 'rgba(162, 155, 254, 0.08)',
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    restBarOvertime: {
      backgroundColor: 'rgba(255, 107, 107, 0.08)',
    },
    restBarContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 6,
      flexWrap: 'wrap',
    },
    restLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: c.textSecondary,
    },
    restCountdown: {
      fontSize: 20,
      fontWeight: '700',
      color: c.workout,
      fontVariant: ['tabular-nums'],
      flex: 1,
    },
    skipRestButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: c.workoutLight,
      borderRadius: 8,
    },
    skipRestText: {
      fontSize: 12,
      fontWeight: '600',
      color: c.workout,
    },
    addTimeButton: {
      paddingHorizontal: 8,
      paddingVertical: 5,
      backgroundColor: c.workoutLight,
      borderRadius: 6,
    },
    addTimeText: {
      fontSize: 11,
      fontWeight: '700',
      color: c.workout,
    },
    restProgressBg: {
      height: 3,
      backgroundColor: c.border,
    },
    restProgressFill: {
      height: 3,
      backgroundColor: c.workout,
    },
    exerciseBlockCompleted: {
      opacity: 0.7,
      borderColor: c.primary,
      borderWidth: 1,
    },
    exerciseFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    restDurationText: {
      fontSize: 11,
      color: c.textMuted,
    },
    completeExerciseButton: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: c.primary + '18',
      marginLeft: 'auto',
    },
    completeExerciseButtonDone: {
      backgroundColor: c.primary,
    },
    completeExerciseText: {
      fontSize: 12,
      fontWeight: '700',
      color: c.primary,
    },
    completeExerciseTextDone: {
      color: '#FFFFFF',
    },
    addSetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      gap: 6,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    input: {
      flex: 1,
      backgroundColor: c.background,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 15,
      color: c.text,
      textAlign: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    inputSeparator: {
      fontSize: 16,
      color: c.textSecondary,
    },
    addSetButton: {
      backgroundColor: c.workoutLight,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    addSetText: {
      fontSize: 13,
      fontWeight: '700',
      color: c.workout,
    },
    addExerciseButton: {
      borderWidth: 2,
      borderColor: c.workout,
      borderStyle: 'dashed',
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginTop: 4,
    },
    addExerciseText: {
      fontSize: 15,
      fontWeight: '700',
      color: c.workout,
    },
    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 20,
      width: 260,
      borderWidth: 1,
      borderColor: c.border,
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: c.text,
      textAlign: 'center',
      marginBottom: 14,
    },
    modalOption: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      marginBottom: 4,
      alignItems: 'center',
    },
    modalOptionSelected: {
      backgroundColor: c.workoutLight,
    },
    modalOptionText: {
      fontSize: 16,
      fontWeight: '600',
      color: c.text,
      fontVariant: ['tabular-nums'],
    },
    modalOptionTextSelected: {
      color: c.workout,
      fontWeight: '700',
    },
    modalCancel: {
      marginTop: 8,
      paddingVertical: 10,
      alignItems: 'center',
    },
    modalCancelText: {
      fontSize: 15,
      color: c.textSecondary,
      fontWeight: '600',
    },
  });
}
