import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { useExercisePrefsStore } from '../stores/useExercisePrefsStore';
import { WorkoutStackParamList } from '../models/types';
import { getExerciseById } from '../services/exerciseDatabase';
import SetRow from '../components/SetRow';
import { darkColors } from '../theme/colors';
import { useColors } from '../theme/useColors';
import { useLanguageStore } from '../stores/useLanguageStore';
import { t } from '../i18n/translations';

type Route = RouteProp<WorkoutStackParamList, 'WorkoutDetail'>;
type Nav = NativeStackNavigationProp<WorkoutStackParamList, 'WorkoutDetail'>;

export default function WorkoutDetailScreen() {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const lang = useLanguageStore((s) => s.language);
  const T = t(lang);

  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { sessionId, date } = route.params;
  const sessions = useWorkoutStore((s) => s.sessions);
  const deleteSession = useWorkoutStore((s) => s.deleteSession);
  const customExercises = useExercisePrefsStore((s) => s.customExercises);

  const session = useMemo(() => {
    const daySessions = sessions[date] || [];
    return daySessions.find((s) => s.id === sessionId);
  }, [sessions, date, sessionId]);

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.errorText}>{T.workoutDetail.notFound}</Text>
      </SafeAreaView>
    );
  }

  const handleDelete = () => {
    Alert.alert(T.workoutDetail.deleteTitle, T.workoutDetail.deleteMessage, [
      { text: T.common.cancel, style: 'cancel' },
      {
        text: T.workoutDetail.deleteConfirm,
        style: 'destructive',
        onPress: () => {
          deleteSession(date, sessionId);
          navigation.goBack();
        },
      },
    ]);
  };

  const totalSets = session.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => !s.isWarmup).length,
    0
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>{T.common.back}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{T.workoutDetail.title}</Text>
        <Text style={styles.time}>
          {new Date(session.startTime).toLocaleTimeString(lang === 'ru' ? 'ru-RU' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
          {session.endTime &&
            ` — ${new Date(session.endTime).toLocaleTimeString(lang === 'ru' ? 'ru-RU' : 'en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}`}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{session.duration}</Text>
            <Text style={styles.statLabel}>{T.workoutDetail.min}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{session.exercises.length}</Text>
            <Text style={styles.statLabel}>{T.workoutDetail.exercises}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalSets}</Text>
            <Text style={styles.statLabel}>{T.workoutDetail.sets}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.volume }]}>
              {session.totalVolume >= 1000
                ? `${(session.totalVolume / 1000).toFixed(1)}${T.workoutDetail.tons}`
                : `${session.totalVolume}`}
            </Text>
            <Text style={styles.statLabel}>{T.workoutDetail.volume}</Text>
          </View>
        </View>

        {session.exercises.map((ex) => {
          const exerciseData = getExerciseById(ex.exerciseId, customExercises);
          const gifUrl = exerciseData?.gifUrl;
          const muscles = exerciseData?.targetMuscles;

          return (
            <View key={ex.id} style={styles.exerciseBlock}>
              <TouchableOpacity
                style={styles.exerciseHeader}
                onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: ex.exerciseId })}
                activeOpacity={0.7}
              >
                {gifUrl ? (
                  <Image source={{ uri: gifUrl }} style={styles.exerciseGif} resizeMode="contain" />
                ) : (
                  <View style={[styles.exerciseGif, styles.gifPlaceholder]}>
                    <Text style={styles.gifPlaceholderText}>🏋️</Text>
                  </View>
                )}
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{ex.exerciseName}</Text>
                  {muscles && (
                    <Text style={styles.muscleText}>
                      {muscles.primary.map((m) => T.labels.muscles[m] || m).join(', ')}
                    </Text>
                  )}
                </View>
                <Text style={styles.exerciseArrow}>→</Text>
              </TouchableOpacity>
              {ex.sets.map((s, idx) => (
                <SetRow key={s.id} set={s} index={idx + 1} />
              ))}
              {ex.notes && <Text style={styles.notes}>{ex.notes}</Text>}
            </View>
          );
        })}

        {session.notes && (
          <View style={styles.notesBlock}>
            <Text style={styles.notesTitle}>{T.workoutDetail.notes}</Text>
            <Text style={styles.notesText}>{session.notes}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteText}>{T.workoutDetail.deleteButton}</Text>
        </TouchableOpacity>
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
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: c.text,
    },
    time: {
      fontSize: 14,
      color: c.textSecondary,
      marginTop: 4,
      marginBottom: 16,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 20,
    },
    statCard: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: 10,
      padding: 12,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 18,
      fontWeight: '700',
      color: c.workout,
    },
    statLabel: {
      fontSize: 11,
      color: c.textSecondary,
      marginTop: 2,
    },
    exerciseBlock: {
      backgroundColor: c.surface,
      borderRadius: 12,
      marginBottom: 10,
      overflow: 'hidden',
    },
    exerciseHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    exerciseGif: {
      width: 50,
      height: 50,
      borderRadius: 8,
      backgroundColor: c.background,
    },
    gifPlaceholder: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    gifPlaceholderText: {
      fontSize: 20,
    },
    exerciseInfo: {
      flex: 1,
      marginLeft: 12,
    },
    exerciseName: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
    },
    muscleText: {
      fontSize: 12,
      color: c.textSecondary,
      marginTop: 2,
    },
    exerciseArrow: {
      fontSize: 14,
      color: c.textMuted,
      marginLeft: 8,
    },
    notes: {
      fontSize: 13,
      color: c.textSecondary,
      padding: 12,
      fontStyle: 'italic',
    },
    notesBlock: {
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 14,
      marginTop: 8,
    },
    notesTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: c.text,
      marginBottom: 6,
    },
    notesText: {
      fontSize: 14,
      color: c.textSecondary,
    },
    deleteButton: {
      marginTop: 24,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.error,
      alignItems: 'center',
    },
    deleteText: {
      color: c.error,
      fontSize: 16,
      fontWeight: '600',
    },
    errorText: {
      fontSize: 16,
      color: c.textSecondary,
      textAlign: 'center',
      marginTop: 40,
    },
  });
}
