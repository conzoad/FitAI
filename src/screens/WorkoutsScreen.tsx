import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SectionList, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { useExercisePrefsStore } from '../stores/useExercisePrefsStore';
import { WorkoutStackParamList } from '../models/types';
import { getAllExercises } from '../services/exerciseDatabase';
import WorkoutCard from '../components/WorkoutCard';
import WorkoutCalendar from '../components/WorkoutCalendar';
import EmptyState from '../components/EmptyState';
import { darkColors } from '../theme/colors';
import { useColors } from '../theme/useColors';
import { format, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';

type Nav = NativeStackNavigationProp<WorkoutStackParamList, 'Workouts'>;

export default function WorkoutsScreen() {
  const navigation = useNavigation<Nav>();
  const sessions = useWorkoutStore((s) => s.sessions);
  const activeWorkout = useWorkoutStore((s) => s.activeWorkout);
  const programs = useWorkoutStore((s) => s.programs);
  const schedule = useWorkoutStore((s) => s.schedule);
  const startWorkoutFromProgram = useWorkoutStore((s) => s.startWorkoutFromProgram);
  const deleteProgram = useWorkoutStore((s) => s.deleteProgram);
  const markMissedWorkouts = useWorkoutStore((s) => s.markMissedWorkouts);
  const removeScheduledWorkout = useWorkoutStore((s) => s.removeScheduledWorkout);
  const customExercises = useExercisePrefsStore((s) => s.customExercises);

  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const allExercises = useMemo(() => getAllExercises(customExercises), [customExercises]);

  useEffect(() => {
    markMissedWorkouts();
  }, [markMissedWorkouts]);

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
    startWorkoutFromProgram(program, allExercises);
    navigation.navigate('StartWorkout');
  };

  const handleDeleteProgram = (programId: string) => {
    Alert.alert('Удалить программу?', 'Это действие нельзя отменить.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => deleteProgram(programId) },
    ]);
  };

  const handleDayPress = useCallback((date: string) => {
    setSelectedDate((prev) => (prev === date ? null : date));
  }, []);

  const handleStartScheduled = useCallback((date: string) => {
    const scheduled = schedule[date];
    if (!scheduled) return;
    const program = programs.find((p) => p.id === scheduled.programId);
    if (!program) {
      Alert.alert('Ошибка', 'Программа не найдена.');
      return;
    }
    if (activeWorkout) {
      Alert.alert('Внимание', 'У вас уже есть активная тренировка. Завершите или отмените её.');
      return;
    }
    startWorkoutFromProgram(program, allExercises);
    navigation.navigate('StartWorkout');
  }, [schedule, programs, activeWorkout, startWorkoutFromProgram, allExercises, navigation]);

  const handleRemoveScheduled = useCallback((date: string) => {
    Alert.alert('Убрать из расписания?', '', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Убрать', style: 'destructive', onPress: () => removeScheduledWorkout(date) },
    ]);
  }, [removeScheduledWorkout]);

  const selectedDayInfo = useMemo(() => {
    if (!selectedDate) return null;
    const scheduled = schedule[selectedDate];
    const daySessions = sessions[selectedDate];
    return { scheduled, sessions: daySessions || [] };
  }, [selectedDate, schedule, sessions]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
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

        {/* Calendar */}
        <WorkoutCalendar
          schedule={schedule}
          sessions={sessions}
          activeWorkout={activeWorkout}
          onDayPress={handleDayPress}
          selectedDate={selectedDate}
        />

        {/* Selected day info */}
        {selectedDate && selectedDayInfo && (
          <View style={styles.dayInfoCard}>
            <Text style={styles.dayInfoDate}>
              {format(new Date(selectedDate), 'd MMMM, EEEE', { locale: ru })}
            </Text>
            {selectedDayInfo.scheduled && (
              <View style={styles.scheduledInfo}>
                <View style={[styles.statusDot, { backgroundColor: selectedDayInfo.scheduled.status === 'completed' ? colors.success : selectedDayInfo.scheduled.status === 'missed' ? colors.error : selectedDayInfo.scheduled.status === 'inProgress' ? colors.workout : '#74B9FF' }]} />
                <Text style={styles.scheduledName}>{selectedDayInfo.scheduled.programName}</Text>
                <Text style={styles.scheduledStatus}>
                  {selectedDayInfo.scheduled.status === 'planned' && 'Запланирована'}
                  {selectedDayInfo.scheduled.status === 'completed' && 'Выполнена'}
                  {selectedDayInfo.scheduled.status === 'missed' && 'Пропущена'}
                  {selectedDayInfo.scheduled.status === 'inProgress' && 'В процессе'}
                </Text>
              </View>
            )}
            {selectedDayInfo.scheduled && (selectedDayInfo.scheduled.status === 'planned' || selectedDayInfo.scheduled.status === 'missed') && (
              <View style={styles.dayActions}>
                <TouchableOpacity
                  style={styles.dayActionBtn}
                  onPress={() => handleStartScheduled(selectedDate)}
                >
                  <Text style={styles.dayActionBtnText}>
                    {selectedDayInfo.scheduled.status === 'missed' ? 'Начать сейчас' : 'Начать'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dayRemoveBtn}
                  onPress={() => handleRemoveScheduled(selectedDate)}
                >
                  <Text style={styles.dayRemoveBtnText}>Убрать</Text>
                </TouchableOpacity>
              </View>
            )}
            {selectedDayInfo.scheduled && selectedDayInfo.scheduled.status === 'completed' && selectedDayInfo.scheduled.sessionId && (
              <TouchableOpacity
                style={styles.dayActionBtn}
                onPress={() => navigation.navigate('WorkoutDetail', { sessionId: selectedDayInfo.scheduled!.sessionId!, date: selectedDate })}
              >
                <Text style={styles.dayActionBtnText}>Подробнее</Text>
              </TouchableOpacity>
            )}
            {!selectedDayInfo.scheduled && selectedDayInfo.sessions.length > 0 && (
              <View>
                {selectedDayInfo.sessions.map((s) => {
                  const exerciseNames = s.exercises.slice(0, 3).map((e) => e.exerciseName).join(', ');
                  const moreCount = s.exercises.length > 3 ? s.exercises.length - 3 : 0;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={styles.miniSessionCard}
                      onPress={() => navigation.navigate('WorkoutDetail', { sessionId: s.id, date: selectedDate })}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.miniSessionText}>
                          {s.exercises.length} упр. · {s.totalVolume >= 1000 ? `${(s.totalVolume / 1000).toFixed(1)}т` : `${s.totalVolume}кг`} · {s.duration} мин
                        </Text>
                        <Text style={styles.miniSessionExercises} numberOfLines={1}>
                          {exerciseNames}{moreCount > 0 ? ` +${moreCount}` : ''}
                        </Text>
                      </View>
                      <Text style={styles.miniSessionArrow}>→</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            {!selectedDayInfo.scheduled && selectedDayInfo.sessions.length === 0 && (
              <Text style={styles.dayInfoEmpty}>Нет тренировок</Text>
            )}
          </View>
        )}

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
                <TouchableOpacity
                  key={program.id}
                  style={styles.programCard}
                  onPress={() => navigation.navigate('ProgramDetail', { programId: program.id })}
                  activeOpacity={0.7}
                >
                  <View style={styles.programInfo}>
                    <Text style={styles.programName}>{program.name}</Text>
                    <Text style={styles.programMeta}>
                      {program.exercises.length} упр.
                    </Text>
                  </View>
                  <View style={styles.programActions}>
                    <TouchableOpacity
                      style={styles.programStartBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleStartFromProgram(program.id);
                      }}
                    >
                      <Text style={styles.programStartText}>Начать</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteProgram(program.id);
                      }}
                    >
                      <Text style={styles.programDeleteBtn}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Recent sessions */}
        {recentSessions.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.recentTitle}>Последние тренировки</Text>
            {recentSessions.map((section) => (
              <View key={section.title}>
                <Text style={styles.sectionHeader}>{section.title}</Text>
                {section.data.map((item) => (
                  <WorkoutCard
                    key={item.id}
                    session={item}
                    onPress={() =>
                      navigation.navigate('WorkoutDetail', {
                        sessionId: item.id,
                        date: item.date,
                      })
                    }
                  />
                ))}
              </View>
            ))}
          </View>
        )}

        {recentSessions.length === 0 && (
          <EmptyState icon="🏋️" title="Нет тренировок" subtitle="Начните первую тренировку!" />
        )}

        <View style={{ height: 30 }} />
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
      color: c.text,
      letterSpacing: -0.3,
    },
    startButton: {
      backgroundColor: c.workout,
      paddingHorizontal: 22,
      paddingVertical: 11,
      borderRadius: 20,
      shadowColor: c.workout,
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
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    statValue: {
      fontSize: 24,
      fontWeight: '800',
      color: c.workout,
      letterSpacing: -0.5,
    },
    statLabel: {
      fontSize: 12,
      color: c.textMuted,
      marginTop: 4,
      letterSpacing: 0.3,
    },
    buttonsRow: {
      paddingHorizontal: 20,
    },
    catalogButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    catalogIcon: {
      fontSize: 20,
      marginRight: 10,
    },
    catalogText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: c.text,
    },
    catalogArrow: {
      fontSize: 16,
      color: c.textMuted,
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
      color: c.text,
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
      color: c.workout,
    },
    noProgramsCard: {
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
    },
    noProgramsText: {
      fontSize: 13,
      color: c.textMuted,
      textAlign: 'center',
      lineHeight: 19,
    },
    programCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 14,
      marginBottom: 6,
      borderWidth: 1,
      borderColor: c.border,
    },
    programInfo: {
      flex: 1,
    },
    programName: {
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
    },
    programMeta: {
      fontSize: 12,
      color: c.textMuted,
      marginTop: 3,
    },
    programActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    programStartBtn: {
      backgroundColor: c.workout,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 14,
      shadowColor: c.workout,
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
      color: c.error,
      paddingHorizontal: 6,
    },
    sectionHeader: {
      fontSize: 14,
      fontWeight: '600',
      color: c.textSecondary,
      marginBottom: 8,
      marginTop: 4,
      textTransform: 'capitalize',
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 30,
    },
    // Calendar day info
    dayInfoCard: {
      marginHorizontal: 20,
      marginBottom: 14,
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: c.border,
    },
    dayInfoDate: {
      fontSize: 14,
      fontWeight: '600',
      color: c.text,
      textTransform: 'capitalize',
      marginBottom: 8,
    },
    scheduledInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 8,
    },
    scheduledName: {
      flex: 1,
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
    },
    scheduledStatus: {
      fontSize: 12,
      color: c.textSecondary,
      fontWeight: '500',
    },
    dayActions: {
      flexDirection: 'row',
      gap: 8,
    },
    dayActionBtn: {
      backgroundColor: c.workout,
      paddingHorizontal: 18,
      paddingVertical: 9,
      borderRadius: 12,
    },
    dayActionBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    dayRemoveBtn: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 12,
      backgroundColor: 'rgba(255, 107, 107, 0.12)',
    },
    dayRemoveBtnText: {
      fontSize: 14,
      fontWeight: '600',
      color: c.error,
    },
    dayInfoEmpty: {
      fontSize: 13,
      color: c.textMuted,
    },
    miniSessionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surfaceLight,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginTop: 4,
    },
    miniSessionText: {
      fontSize: 13,
      fontWeight: '500',
      color: c.text,
    },
    miniSessionExercises: {
      fontSize: 11,
      color: c.textMuted,
      marginTop: 2,
    },
    miniSessionArrow: {
      fontSize: 14,
      color: c.textMuted,
    },
    recentSection: {
      paddingHorizontal: 20,
    },
    recentTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: c.text,
      marginBottom: 10,
    },
  });
}
