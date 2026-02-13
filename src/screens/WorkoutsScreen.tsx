import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SectionList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { WorkoutStackParamList } from '../models/types';
import { EXERCISES } from '../services/exerciseDatabase';
import WorkoutCard from '../components/WorkoutCard';
import EmptyState from '../components/EmptyState';
import { colors } from '../theme/colors';
import { format, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';

type Nav = NativeStackNavigationProp<WorkoutStackParamList, 'Workouts'>;

export default function WorkoutsScreen() {
  const navigation = useNavigation<Nav>();
  const sessions = useWorkoutStore((s) => s.sessions);
  const activeWorkout = useWorkoutStore((s) => s.activeWorkout);
  const programs = useWorkoutStore((s) => s.programs);
  const startWorkoutFromProgram = useWorkoutStore((s) => s.startWorkoutFromProgram);
  const deleteProgram = useWorkoutStore((s) => s.deleteProgram);

  const recentSessions = useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) =>
      format(subDays(new Date(), i), 'yyyy-MM-dd')
    );

    const sections: { title: string; data: typeof sessions[string] }[] = [];
    for (const day of days) {
      const daySessions = sessions[day];
      if (daySessions && daySessions.length > 0) {
        const label = format(new Date(day), 'd MMMM, EEEE', { locale: ru });
        sections.push({ title: label, data: daySessions });
      }
    }
    return sections;
  }, [sessions]);

  const totalWorkouts = useMemo(() => {
    return Object.values(sessions).reduce((sum, arr) => sum + arr.length, 0);
  }, [sessions]);

  const weekVolume = useMemo(() => {
    let vol = 0;
    for (let i = 0; i < 7; i++) {
      const key = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const daySessions = sessions[key] || [];
      vol += daySessions.reduce((sum, s) => sum + s.totalVolume, 0);
    }
    return vol;
  }, [sessions]);

  const handleStartFromProgram = (programId: string) => {
    const program = programs.find((p) => p.id === programId);
    if (!program) return;
    if (activeWorkout) {
      Alert.alert('Внимание', 'У вас уже есть активная тренировка. Завершите или отмените её.');
      return;
    }
    startWorkoutFromProgram(program, EXERCISES);
    navigation.navigate('StartWorkout');
  };

  const handleDeleteProgram = (programId: string) => {
    Alert.alert('Удалить программу?', 'Это действие нельзя отменить.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => deleteProgram(programId) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Тренировки</Text>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => navigation.navigate('StartWorkout')}
        >
          <Text style={styles.startButtonText}>
            {activeWorkout ? 'Продолжить' : 'Начать'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalWorkouts}</Text>
          <Text style={styles.statLabel}>Всего тренировок</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.volume }]}>
            {weekVolume >= 1000
              ? `${(weekVolume / 1000).toFixed(1)}т`
              : `${weekVolume}кг`}
          </Text>
          <Text style={styles.statLabel}>Объём за неделю</Text>
        </View>
      </View>

      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={styles.catalogButton}
          onPress={() => navigation.navigate('ExerciseList', { onSelect: false })}
        >
          <Text style={styles.catalogIcon}>📖</Text>
          <Text style={styles.catalogText}>Каталог упражнений</Text>
          <Text style={styles.catalogArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Programs Section */}
      {(programs.length > 0 || true) && (
        <View style={styles.programsSection}>
          <View style={styles.programsHeader}>
            <Text style={styles.programsTitle}>Мои программы</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CreateProgram')}>
              <View style={styles.addProgramBadge}>
                <Text style={styles.addProgramText}>+ Создать</Text>
              </View>
            </TouchableOpacity>
          </View>

          {programs.length === 0 ? (
            <View style={styles.noProgramsCard}>
              <Text style={styles.noProgramsText}>
                Создайте программу, чтобы быстро начинать тренировки
              </Text>
            </View>
          ) : (
            programs.map((program) => (
              <View key={program.id} style={styles.programCard}>
                <View style={styles.programInfo}>
                  <Text style={styles.programName}>{program.name}</Text>
                  <Text style={styles.programMeta}>
                    {program.exercises.length} упр.
                  </Text>
                </View>
                <View style={styles.programActions}>
                  <TouchableOpacity
                    style={styles.programStartBtn}
                    onPress={() => handleStartFromProgram(program.id)}
                  >
                    <Text style={styles.programStartText}>Начать</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteProgram(program.id)}
                  >
                    <Text style={styles.programDeleteBtn}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {recentSessions.length === 0 ? (
        <EmptyState icon="🏋️" title="Нет тренировок" subtitle="Начните первую тренировку!" />
      ) : (
        <SectionList
          sections={recentSessions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WorkoutCard
              session={item}
              onPress={() =>
                navigation.navigate('WorkoutDetail', {
                  sessionId: item.id,
                  date: item.date,
                })
              }
            />
          )}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  startButton: {
    backgroundColor: colors.workout,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 20,
    shadowColor: colors.workout,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.workout,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  buttonsRow: {
    paddingHorizontal: 20,
  },
  catalogButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catalogIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  catalogText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  catalogArrow: {
    fontSize: 16,
    color: colors.textMuted,
  },
  // Programs
  programsSection: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  programsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  programsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  addProgramBadge: {
    backgroundColor: 'rgba(162, 155, 254, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addProgramText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.workout,
  },
  noProgramsCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noProgramsText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
  programCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  programInfo: {
    flex: 1,
  },
  programName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  programMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3,
  },
  programActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  programStartBtn: {
    backgroundColor: colors.workout,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    shadowColor: colors.workout,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  programStartText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  programDeleteBtn: {
    fontSize: 16,
    color: colors.error,
    paddingHorizontal: 6,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
});
