import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SectionList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { WorkoutStackParamList } from '../models/types';
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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Тренировки</Text>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => {
            if (activeWorkout) {
              navigation.navigate('StartWorkout');
            } else {
              navigation.navigate('StartWorkout');
            }
          }}
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

      <TouchableOpacity
        style={styles.catalogButton}
        onPress={() => navigation.navigate('ExerciseList', { onSelect: false })}
      >
        <Text style={styles.catalogIcon}>📖</Text>
        <Text style={styles.catalogText}>Каталог упражнений</Text>
        <Text style={styles.catalogArrow}>→</Text>
      </TouchableOpacity>

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
  catalogButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
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
