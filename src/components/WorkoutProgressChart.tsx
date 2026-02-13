import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { WorkoutSet } from '../models/types';
import { darkColors } from '../theme/colors';
import { useColors } from '../theme/useColors';

interface WorkoutProgressChartProps {
  history: { date: string; sets: WorkoutSet[] }[];
  title?: string;
}

const screenWidth = Dimensions.get('window').width - 40;

export default function WorkoutProgressChart({ history, title = 'Прогресс' }: WorkoutProgressChartProps) {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  if (history.length < 2) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.noData}>Нужно минимум 2 тренировки для графика</Text>
      </View>
    );
  }

  const last10 = history.slice(-10);

  const maxWeights = last10.map((h) => {
    const workingSets = h.sets.filter((s) => !s.isWarmup);
    if (workingSets.length === 0) return 0;
    return Math.max(...workingSets.map((s) => s.weight));
  });

  const volumes = last10.map((h) => {
    return h.sets
      .filter((s) => !s.isWarmup)
      .reduce((sum, s) => sum + s.weight * s.reps, 0);
  });

  const labels = last10.map((h) => {
    const d = new Date(h.date);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Макс. вес (кг)</Text>
      <LineChart
        data={{
          labels,
          datasets: [{ data: maxWeights.map((w) => w || 0) }],
        }}
        width={screenWidth}
        height={180}
        chartConfig={{
          backgroundColor: colors.surface,
          backgroundGradientFrom: colors.surface,
          backgroundGradientTo: colors.surface,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(124, 77, 255, ${opacity})`,
          labelColor: () => colors.textSecondary,
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: colors.workout,
          },
          propsForBackgroundLines: {
            stroke: colors.border,
          },
        }}
        bezier
        style={styles.chart}
        fromZero
      />

      <Text style={styles.title}>Объём (кг)</Text>
      <LineChart
        data={{
          labels,
          datasets: [{ data: volumes.map((v) => v || 0) }],
        }}
        width={screenWidth}
        height={180}
        chartConfig={{
          backgroundColor: colors.surface,
          backgroundGradientFrom: colors.surface,
          backgroundGradientTo: colors.surface,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(38, 166, 154, ${opacity})`,
          labelColor: () => colors.textSecondary,
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: colors.volume,
          },
          propsForBackgroundLines: {
            stroke: colors.border,
          },
        }}
        bezier
        style={styles.chart}
        fromZero
      />
    </View>
  );
}

function getStyles(c: typeof darkColors) {
  return StyleSheet.create({
    container: {
      marginTop: 8,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: c.text,
      marginBottom: 8,
      marginTop: 8,
    },
    chart: {
      borderRadius: 12,
      marginBottom: 12,
    },
    noData: {
      fontSize: 14,
      color: c.textSecondary,
      textAlign: 'center',
      padding: 30,
    },
  });
}
