import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { colors } from '../theme/colors';
import { dateKey, getDaysArray } from '../utils/dateHelpers';

interface Props {
  selectedDate: string;
  onSelect: (date: string) => void;
}

const DAYS = getDaysArray(30);
const ITEM_WIDTH = 56;

export default function DaySelector({ selectedDate, onSelect }: Props) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const index = DAYS.findIndex((d) => dateKey(d) === selectedDate);
    if (index >= 0 && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ x: index * ITEM_WIDTH - 120, animated: false });
      }, 100);
    }
  }, []);

  const todayStr = dateKey(new Date());

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {DAYS.map((day) => {
        const key = dateKey(day);
        const isSelected = key === selectedDate;
        const isToday = key === todayStr;
        const weekday = format(day, 'EEEEEE', { locale: ru });
        const dayNum = format(day, 'd');

        return (
          <TouchableOpacity
            key={key}
            style={[
              styles.item,
              isSelected && styles.selected,
              isToday && !isSelected && styles.today,
            ]}
            onPress={() => onSelect(key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.weekday, isSelected && styles.selectedText]}>
              {weekday}
            </Text>
            <Text style={[styles.day, isSelected && styles.selectedText]}>
              {dayNum}
            </Text>
            {isToday && !isSelected && <View style={styles.todayDot} />}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  item: {
    width: ITEM_WIDTH - 8,
    height: 68,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  today: {
    borderColor: colors.primaryLight,
    borderWidth: 1.5,
  },
  weekday: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedText: {
    color: '#FFFFFF',
  },
  day: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primaryLight,
    marginTop: 4,
  },
});
