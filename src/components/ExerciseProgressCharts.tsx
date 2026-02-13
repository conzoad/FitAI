import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SessionMetrics } from '../utils/calculations';
import { darkColors } from '../theme/colors';
import { useColors } from '../theme/useColors';

interface Props {
  metrics: SessionMetrics[];
}

type ChartTab = 'maxWeight' | 'best1RM' | 'totalTonnage' | 'totalReps';

const TABS: { key: ChartTab; label: string; unit: string; color: string }[] = [
  { key: 'maxWeight', label: 'Макс. вес', unit: 'кг', color: 'rgba(162, 155, 254, 1)' },
  { key: 'best1RM', label: '1RM', unit: 'кг', color: 'rgba(254, 202, 87, 1)' },
  { key: 'totalTonnage', label: 'Тоннаж', unit: 'кг', color: 'rgba(85, 239, 196, 1)' },
  { key: 'totalReps', label: 'Повторения', unit: '', color: 'rgba(116, 185, 255, 1)' },
];

const screenWidth = Dimensions.get('window').width - 72;

export default function ExerciseProgressCharts({ metrics }: Props) {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [activeTab, setActiveTab] = useState<ChartTab>('maxWeight');

  if (metrics.length < 2) {
    return (
      <View style={styles.container}>
        <Text style={styles.noData}>Нужно минимум 2 тренировки для графиков</Text>
      </View>
    );
  }

  const last10 = metrics.slice(-10);
  const tab = TABS.find((t) => t.key === activeTab)!;

  const data = last10.map((m) => m[activeTab] || 0);
  const labels = last10.map((m) => {
    const d = new Date(m.date);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });

  const current = data[data.length - 1];
  const previous = data.length >= 2 ? data[data.length - 2] : current;
  const diff = current - previous;
  const diffSign = diff > 0 ? '+' : '';

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.currentValue}>
          {activeTab === 'best1RM' ? current.toFixed(1) : Math.round(current)}
          {tab.unit ? ` ${tab.unit}` : ''}
        </Text>
        {diff !== 0 && (
          <Text style={[styles.diffText, { color: diff > 0 ? colors.success : colors.error }]}>
            {diffSign}{activeTab === 'best1RM' ? diff.toFixed(1) : Math.round(diff)}
          </Text>
        )}
      </View>

      <LineChart
        data={{
          labels,
          datasets: [{ data }],
        }}
        width={screenWidth}
        height={180}
        chartConfig={{
          backgroundColor: colors.surface,
          backgroundGradientFrom: colors.surface,
          backgroundGradientTo: colors.surface,
          decimalPlaces: activeTab === 'best1RM' ? 1 : 0,
          color: (opacity = 1) => tab.color.replace('1)', `${opacity})`),
          labelColor: () => colors.textSecondary,
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: tab.color,
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
      paddingTop: 8,
    },
    tabBar: {
      flexDirection: 'row',
      gap: 6,
      marginBottom: 16,
      flexWrap: 'wrap',
    },
    tab: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 16,
      backgroundColor: c.surfaceLight,
    },
    tabActive: {
      backgroundColor: c.workout,
    },
    tabText: {
      fontSize: 12,
      fontWeight: '600',
      color: c.textSecondary,
    },
    tabTextActive: {
      color: '#FFFFFF',
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 8,
      marginBottom: 12,
    },
    currentValue: {
      fontSize: 28,
      fontWeight: '800',
      color: c.text,
    },
    diffText: {
      fontSize: 14,
      fontWeight: '700',
    },
    chart: {
      borderRadius: 12,
      marginLeft: -8,
    },
    noData: {
      fontSize: 14,
      color: c.textSecondary,
      textAlign: 'center',
      padding: 30,
    },
  });
}
