import React, { useMemo } from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { WorkoutSession } from '../models/types';
import { format, subDays } from 'date-fns';
import { darkColors } from '../theme/colors';
import { useColors } from '../theme/useColors';
import { useLanguageStore } from '../stores/useLanguageStore';
import { t } from '../i18n/translations';

interface Props {
  sessions: Record<string, WorkoutSession[]>;
}

interface DayMetrics {
  label: string;
  tonnage: number;
  duration: number;
  intensity: number;
  effort: number;
  calories: number;
}

const screenWidth = Dimensions.get('window').width;

function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export default function WorkoutStatsCharts({ sessions }: Props) {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const lang = useLanguageStore((s) => s.language);
  const T = t(lang);

  const metrics = useMemo(() => {
    const today = new Date();
    const result: DayMetrics[] = [];

    for (let i = 29; i >= 0; i--) {
      const day = subDays(today, i);
      const dateKey = format(day, 'yyyy-MM-dd');
      const daySessions = sessions[dateKey];

      if (!daySessions || daySessions.length === 0) continue;

      let tonnage = 0;
      let duration = 0;
      let totalReps = 0;
      let weightSum = 0;
      let setCount = 0;

      for (const session of daySessions) {
        tonnage += session.totalVolume;
        duration += session.duration;

        for (const exercise of session.exercises) {
          for (const set of exercise.sets) {
            totalReps += set.reps;
            weightSum += set.weight;
            setCount += 1;
          }
        }
      }

      const intensity = duration > 0
        ? Math.round((tonnage / duration) * 10) / 10
        : 0;

      const avgWeight = setCount > 0 ? weightSum / setCount : 0;
      const effort = Math.round(totalReps * avgWeight * 10) / 10;

      const calories = Math.round(duration * 5 + tonnage * 0.01);

      result.push({
        label: format(day, 'dd.MM'),
        tonnage: Math.round(tonnage * 10) / 10,
        duration: Math.round(duration * 10) / 10,
        intensity,
        effort,
        calories,
      });
    }

    return result;
  }, [sessions]);

  if (metrics.length < 2) {
    return (
      <View style={styles.container}>
        <Text style={styles.noData}>{T.charts.noData}</Text>
      </View>
    );
  }

  const labels = metrics.map((m) => m.label);
  const chartWidth = screenWidth - 40;

  const charts: { title: string; data: number[]; color: string }[] = [
    { title: T.charts.tonnage, data: metrics.map((m) => m.tonnage), color: '#B4B4B4' },
    { title: T.charts.duration, data: metrics.map((m) => m.duration), color: '#FECA57' },
    { title: T.charts.intensity, data: metrics.map((m) => m.intensity), color: '#55EFC4' },
    { title: T.charts.effort, data: metrics.map((m) => m.effort), color: '#A29BFE' },
    { title: T.charts.caloriesChart, data: metrics.map((m) => m.calories), color: '#74B9FF' },
  ];

  return (
    <View style={styles.container}>
      {charts.map((chart, index) => {
        const isLast = index === charts.length - 1;
        const chartData = chart.data.map((v) => (v === 0 ? 0 : v));

        return (
          <View key={chart.title} style={styles.chartBlock}>
            <Text style={styles.chartTitle}>{chart.title}</Text>
            <LineChart
              data={{
                labels: isLast ? labels : [],
                datasets: [{ data: chartData }],
              }}
              width={chartWidth}
              height={160}
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: 'transparent',
                backgroundGradientTo: 'transparent',
                decimalPlaces: 1,
                color: (opacity = 1) => hexToRgba(chart.color, opacity),
                labelColor: () => '#FFFFFF',
                propsForDots: {
                  r: '3',
                  strokeWidth: '1',
                  stroke: chart.color,
                },
                propsForBackgroundLines: {
                  stroke: colors.border,
                },
              }}
              bezier
              style={styles.chart}
            />
          </View>
        );
      })}
    </View>
  );
}

function getStyles(c: typeof darkColors) {
  return StyleSheet.create({
    container: {
      marginTop: 8,
    },
    chartBlock: {
      marginBottom: 12,
    },
    chartTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: c.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    chart: {
      borderRadius: 12,
    },
    noData: {
      fontSize: 14,
      color: c.textSecondary,
      textAlign: 'center',
      padding: 30,
    },
  });
}
