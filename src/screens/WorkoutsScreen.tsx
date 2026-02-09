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
              <Text style={styles.addProgramText}>+ Создать</Text>
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
    paddingTop: 10,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  startButton: {
    backgroundColor: colors.workout,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
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
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.workout,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  buttonsRow: {
    paddingHorizontal: 20,
  },
  catalogButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
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
    color: colors.textSecondary,
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
    marginBottom: 8,
  },
  programsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  addProgramText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.workout,
  },
  noProgramsCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
  },
  noProgramsText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  programCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
  },
  programInfo: {
    flex: 1,
  },
  programName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  programMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  programActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  programStartBtn: {
    backgroundColor: colors.workout,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  programStartText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  programDeleteBtn: {
    fontSize: 16,
    color: colors.error,
    paddingHorizontal: 4,
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
