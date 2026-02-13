import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ExerciseRecords } from '../utils/calculations';
import { darkColors } from '../theme/colors';
import { useColors } from '../theme/useColors';

interface Props {
  records: ExerciseRecords;
}

interface RecordItem {
  label: string;
  value: string;
  detail: string;
  date: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
}

function buildRecordItems(records: ExerciseRecords): RecordItem[] {
  const items: RecordItem[] = [];

  if (records.maxWeight) {
    items.push({
      label: 'Макс. вес',
      value: `${records.maxWeight.value} кг`,
      detail: `${records.maxWeight.value} × ${records.maxWeight.reps}`,
      date: formatDate(records.maxWeight.date),
    });
  }

  if (records.best1RM) {
    items.push({
      label: 'Лучший 1RM',
      value: `${records.best1RM.value} кг`,
      detail: `${records.best1RM.weight} × ${records.best1RM.reps}`,
      date: formatDate(records.best1RM.date),
    });
  }

  if (records.maxTonnageAllSets) {
    items.push({
      label: 'Тоннаж (все)',
      value: `${records.maxTonnageAllSets.value} кг`,
      detail: 'за все подходы',
      date: formatDate(records.maxTonnageAllSets.date),
    });
  }

  if (records.maxTonnage1Set) {
    items.push({
      label: 'Тоннаж (1 подход)',
      value: `${records.maxTonnage1Set.value} кг`,
      detail: `${records.maxTonnage1Set.weight} × ${records.maxTonnage1Set.reps}`,
      date: formatDate(records.maxTonnage1Set.date),
    });
  }

  if (records.maxReps1Set) {
    items.push({
      label: 'Повт. (1 подход)',
      value: `${records.maxReps1Set.value}`,
      detail: `при ${records.maxReps1Set.weight} кг`,
      date: formatDate(records.maxReps1Set.date),
    });
  }

  if (records.maxRepsAllSets) {
    items.push({
      label: 'Повт. (все)',
      value: `${records.maxRepsAllSets.value}`,
      detail: 'за все подходы',
      date: formatDate(records.maxRepsAllSets.date),
    });
  }

  return items;
}

export default function RecordsCard({ records }: Props) {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const items = buildRecordItems(records);

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noData}>Нет данных для рекордов</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {items.map((item, idx) => (
          <View key={idx} style={styles.card}>
            <Text style={styles.cardLabel}>{item.label}</Text>
            <Text style={styles.cardValue}>{item.value}</Text>
            <Text style={styles.cardDetail}>{item.detail}</Text>
            <Text style={styles.cardDate}>{item.date}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function getStyles(c: typeof darkColors) {
  return StyleSheet.create({
    container: {
      paddingTop: 8,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    card: {
      width: '48%',
      backgroundColor: c.surfaceLight,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    cardLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: c.textSecondary,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    cardValue: {
      fontSize: 20,
      fontWeight: '800',
      color: c.personalRecord,
      marginBottom: 2,
    },
    cardDetail: {
      fontSize: 12,
      color: c.textSecondary,
    },
    cardDate: {
      fontSize: 11,
      color: c.textMuted,
      marginTop: 4,
    },
    noData: {
      fontSize: 14,
      color: c.textSecondary,
      textAlign: 'center',
      padding: 30,
    },
  });
}
