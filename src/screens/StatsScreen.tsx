import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useDiaryStore } from '../stores/useDiaryStore';
import { useProfileStore } from '../stores/useProfileStore';
import { formatDayShort, getDaysArray, dateKey } from '../utils/dateHelpers';
import { colors } from '../theme/colors';

const screenWidth = Dimensions.get('window').width - 40;

export default function StatsScreen() {
  const navigation = useNavigation();
  const getEntry = useDiaryStore((s) => s.getEntry);
  const profile = useProfileStore((s) => s.profile);
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  const days = getDaysArray(period === 'week' ? 7 : 30);

  const entries = days.map((d) => getEntry(dateKey(d)));

  const calorieData = entries.map((e) => e.totalMacros.calories);
  const proteinData = entries.map((e) => e.totalMacros.proteins);
  const fatData = entries.map((e) => e.totalMacros.fats);
  const carbData = entries.map((e) => e.totalMacros.carbs);

  const labels = days.map((d) => formatDayShort(d));
  const displayLabels = period === 'week'
    ? labels
    : labels.filter((_, i) => i % 5 === 0);

  const avgCalories = calorieData.length > 0
    ? Math.round(calorieData.reduce((a, b) => a + b, 0) / calorieData.length)
    : 0;

  const daysInTarget = calorieData.filter(
    (c) => c > 0 && Math.abs(c - profile.targetCalories) <= profile.targetCalories * 0.1
  ).length;

  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
    labelColor: () => colors.textSecondary,
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: colors.primary,
    },
    propsForBackgroundLines: {
      stroke: colors.border,
    },
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Назад</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Статистика</Text>

        <View style={styles.periodRow}>
          <TouchableOpacity
            style={[styles.periodTab, period === 'week' && styles.periodActive]}
            onPress={() => setPeriod('week')}
          >
            <Text style={[styles.periodText, period === 'week' && styles.periodTextActive]}>
              Неделя
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodTab, period === 'month' && styles.periodActive]}
            onPress={() => setPeriod('month')}
          >
            <Text style={[styles.periodText, period === 'month' && styles.periodTextActive]}>
              Месяц
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{avgCalories}</Text>
            <Text style={styles.summaryLabel}>Среднее ккал/день</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{daysInTarget}</Text>
            <Text style={styles.summaryLabel}>Дней в норме</Text>
          </View>
        </View>

        <Text style={styles.chartTitle}>Калории</Text>
        {calorieData.some((c) => c > 0) ? (
          <LineChart
            data={{
              labels: period === 'week' ? labels : displayLabels,
              datasets: [
                { data: calorieData.map((c) => c || 0) },
                {
                  data: [profile.targetCalories],
                  withDots: false,
                  color: () => colors.error,
                  strokeDashArray: [5, 5],
                },
              ],
            }}
            width={screenWidth}
            height={200}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            fromZero
          />
        ) : (
          <Text style={styles.noData}>Нет данных за этот период</Text>
        )}

        <Text style={styles.chartTitle}>БЖУ</Text>
        {calorieData.some((c) => c > 0) ? (
          <BarChart
            data={{
              labels: period === 'week' ? labels : displayLabels,
              datasets: [
                {
                  data: proteinData.map((p) => p || 0),
                },
              ],
            }}
            width={screenWidth}
            height={200}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(66, 165, 245, ${opacity})`,
            }}
            style={styles.chart}
            fromZero
            yAxisSuffix="г"
            yAxisLabel=""
          />
        ) : (
          <Text style={styles.noData}>Нет данных за этот период</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 8,
  },
  backText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  periodRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodActive: {
    backgroundColor: colors.primary,
  },
  periodText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  periodTextActive: {
    color: '#FFFFFF',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
    marginTop: 8,
  },
  chart: {
    borderRadius: 12,
    marginBottom: 16,
  },
  noData: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: 40,
  },
});
