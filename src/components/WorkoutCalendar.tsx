import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isSameDay,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { ScheduledWorkout, WorkoutSession } from '../models/types';
import { colors } from '../theme/colors';

const STATUS_COLORS = {
  completed: colors.success,
  planned: '#74B9FF',
  inProgress: colors.workout,
  missed: colors.error,
};

const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

interface WorkoutCalendarProps {
  schedule: Record<string, ScheduledWorkout>;
  sessions: Record<string, WorkoutSession[]>;
  activeWorkout: { date: string } | null;
  onDayPress: (date: string) => void;
  selectedDate: string | null;
}

export default function WorkoutCalendar({
  schedule,
  sessions,
  activeWorkout,
  onDayPress,
  selectedDate,
}: WorkoutCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const today = new Date();

  const getDayStatus = (date: Date): 'completed' | 'planned' | 'inProgress' | 'missed' | 'hasSession' | null => {
    const key = format(date, 'yyyy-MM-dd');

    // Schedule status takes priority
    const scheduled = schedule[key];
    if (scheduled) {
      return scheduled.status;
    }

    // Check if active workout is on this day
    if (activeWorkout && activeWorkout.date === key) {
      return 'inProgress';
    }

    // Check if there are completed sessions (unscheduled)
    const daySessions = sessions[key];
    if (daySessions && daySessions.length > 0) {
      return 'hasSession';
    }

    return null;
  };

  return (
    <View style={styles.container}>
      {/* Month navigation */}
      <View style={styles.monthHeader}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <Text style={styles.navText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {format(currentMonth, 'LLLL yyyy', { locale: ru })}
        </Text>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <Text style={styles.navText}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Weekday headers */}
      <View style={styles.weekRow}>
        {WEEK_DAYS.map((d) => (
          <View key={d} style={styles.weekDayCell}>
            <Text style={styles.weekDayText}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.grid}>
        {calendarDays.map((date, i) => {
          const inMonth = isSameMonth(date, currentMonth);
          const isToday = isSameDay(date, today);
          const dateKey = format(date, 'yyyy-MM-dd');
          const isSelected = selectedDate === dateKey;
          const status = getDayStatus(date);

          let dotColor: string | null = null;
          if (status === 'completed' || status === 'hasSession') {
            dotColor = STATUS_COLORS.completed;
          } else if (status === 'planned') {
            dotColor = STATUS_COLORS.planned;
          } else if (status === 'inProgress') {
            dotColor = STATUS_COLORS.inProgress;
          } else if (status === 'missed') {
            dotColor = STATUS_COLORS.missed;
          }

          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.dayCell,
                isToday && styles.todayCell,
                isSelected && styles.selectedCell,
              ]}
              onPress={() => onDayPress(dateKey)}
              activeOpacity={0.6}
            >
              <Text
                style={[
                  styles.dayText,
                  !inMonth && styles.dayTextMuted,
                  isToday && styles.dayTextToday,
                  isSelected && styles.dayTextSelected,
                ]}
              >
                {format(date, 'd')}
              </Text>
              {dotColor && (
                <View style={[styles.dot, { backgroundColor: dotColor }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navButton: {
    padding: 6,
  },
  navText: {
    fontSize: 18,
    color: colors.workout,
    fontWeight: '600',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'capitalize',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
  },
  todayCell: {
    borderWidth: 1,
    borderColor: colors.workout,
  },
  selectedCell: {
    backgroundColor: 'rgba(162, 155, 254, 0.15)',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  dayTextMuted: {
    color: colors.textMuted,
    opacity: 0.4,
  },
  dayTextToday: {
    color: colors.workout,
    fontWeight: '700',
  },
  dayTextSelected: {
    color: colors.workout,
    fontWeight: '700',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 3,
  },
});
