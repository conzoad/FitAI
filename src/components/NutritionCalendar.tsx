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
  isBefore,
  startOfDay,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { DailyEntry } from '../models/types';
import { darkColors } from '../theme/colors';
import { useColors } from '../theme/useColors';

const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

interface NutritionCalendarProps {
  entries: Record<string, DailyEntry>;
  targetCalories: number;
  onDayPress: (date: string) => void;
  selectedDate: string;
}

export default function NutritionCalendar({
  entries,
  targetCalories,
  onDayPress,
  selectedDate,
}: NutritionCalendarProps) {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
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
  const todayStart = startOfDay(today);

  const getDayStatus = (date: Date): 'good' | 'exceeded' | 'noData' | null => {
    // Future dates get no dot
    if (!isBefore(startOfDay(date), todayStart) && !isSameDay(date, today)) {
      return null;
    }

    const key = format(date, 'yyyy-MM-dd');
    const entry = entries[key];

    if (!entry || entry.meals.length === 0) {
      // Only show noData for past dates, not today
      if (isBefore(startOfDay(date), todayStart)) {
        return 'noData';
      }
      return null;
    }

    if (targetCalories > 0 && entry.totalMacros.calories > targetCalories) {
      return 'exceeded';
    }

    return 'good';
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
          if (status === 'good') {
            dotColor = colors.success;
          } else if (status === 'exceeded') {
            dotColor = colors.calories;
          } else if (status === 'noData') {
            dotColor = colors.textMuted;
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

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={styles.legendText}>В норме</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.calories }]} />
          <Text style={styles.legendText}>Превышено</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.textMuted }]} />
          <Text style={styles.legendText}>Нет данных</Text>
        </View>
      </View>
    </View>
  );
}

function getStyles(c: typeof darkColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 14,
      marginHorizontal: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: c.border,
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
      color: c.primary,
      fontWeight: '600',
    },
    monthTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
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
      color: c.textMuted,
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
      borderColor: c.primary,
    },
    selectedCell: {
      backgroundColor: 'rgba(108, 92, 231, 0.15)',
    },
    dayText: {
      fontSize: 14,
      fontWeight: '500',
      color: c.text,
    },
    dayTextMuted: {
      color: c.textMuted,
      opacity: 0.4,
    },
    dayTextToday: {
      color: c.primary,
      fontWeight: '700',
    },
    dayTextSelected: {
      color: c.primary,
      fontWeight: '700',
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginTop: 3,
    },
    legend: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 16,
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    legendDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    legendText: {
      fontSize: 11,
      color: c.textMuted,
    },
  });
}
