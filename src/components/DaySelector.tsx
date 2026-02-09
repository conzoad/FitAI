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
const ITEM_WIDTH = 52;

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
            style={[styles.item, isSelected && styles.selected]}
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
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
  },
  item: {
    width: ITEM_WIDTH - 8,
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  selected: {
    backgroundColor: colors.primary,
  },
  weekday: {
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  selectedText: {
    color: '#FFFFFF',
  },
  day: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary,
    marginTop: 3,
  },
});
