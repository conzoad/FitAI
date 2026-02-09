import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { WorkoutStackParamList } from '../models/types';
import SetRow from '../components/SetRow';
import { colors } from '../theme/colors';

type Route = RouteProp<WorkoutStackParamList, 'WorkoutDetail'>;

export default function WorkoutDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation();
  const { sessionId, date } = route.params;
  const sessions = useWorkoutStore((s) => s.sessions);
  const deleteSession = useWorkoutStore((s) => s.deleteSession);

  const session = useMemo(() => {
    const daySessions = sessions[date] || [];
    return daySessions.find((s) => s.id === sessionId);
  }, [sessions, date, sessionId]);

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.errorText}>Тренировка не найдена</Text>
      </SafeAreaView>
    );
  }

  const handleDelete = () => {
    Alert.alert('Удалить тренировку?', 'Это действие нельзя отменить.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
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
          <Text style={styles.backText}>← Назад</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Тренировка</Text>
        <Text style={styles.time}>
          {new Date(session.startTime).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
          })}
          {session.endTime &&
            ` — ${new Date(session.endTime).toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
            })}`}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{session.duration}</Text>
            <Text style={styles.statLabel}>мин</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{session.exercises.length}</Text>
            <Text style={styles.statLabel}>упражн.</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalSets}</Text>
            <Text style={styles.statLabel}>подходов</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.volume }]}>
              {session.totalVolume >= 1000
                ? `${(session.totalVolume / 1000).toFixed(1)}т`
                : `${session.totalVolume}`}
            </Text>
            <Text style={styles.statLabel}>объём (кг)</Text>
          </View>
        </View>

        {session.exercises.map((ex) => (
          <View key={ex.id} style={styles.exerciseBlock}>
            <Text style={styles.exerciseName}>{ex.exerciseName}</Text>
            {ex.sets.map((s, idx) => (
              <SetRow key={s.id} set={s} index={idx + 1} />
            ))}
            {ex.notes && <Text style={styles.notes}>{ex.notes}</Text>}
          </View>
        ))}

        {session.notes && (
          <View style={styles.notesBlock}>
            <Text style={styles.notesTitle}>Заметки</Text>
            <Text style={styles.notesText}>{session.notes}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteText}>Удалить тренировку</Text>
        </TouchableOpacity>
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  time: {
    fontSize: 14,
    color: colors.textSecondary,
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
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.workout,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  exerciseBlock: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  notes: {
    fontSize: 13,
    color: colors.textSecondary,
    padding: 12,
    fontStyle: 'italic',
  },
  notesBlock: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  notesText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  deleteButton: {
    marginTop: 24,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: 'center',
  },
  deleteText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
});
