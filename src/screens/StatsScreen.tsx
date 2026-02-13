import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useDiaryStore } from '../stores/useDiaryStore';
import { useProfileStore } from '../stores/useProfileStore';
import { formatDayShort, getDaysArray, dateKey } from '../utils/dateHelpers';
import { darkColors } from '../theme/colors';
import { useColors } from '../theme/useColors';
import { EMPTY_MACROS } from '../utils/constants';

const screenWidth = Dimensions.get('window').width - 40;

type MacroTab = 'proteins' | 'fats' | 'carbs';

export default function StatsScreen() {
  const navigation = useNavigation();
  const diaryEntries = useDiaryStore((s) => s.entries);
  const profile = useProfileStore((s) => s.profile);
  const addWeightEntry = useProfileStore((s) => s.addWeightEntry);
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [macroTab, setMacroTab] = useState<MacroTab>('proteins');
  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [weightInput, setWeightInput] = useState('');

  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const days = useMemo(() => getDaysArray(period === 'week' ? 7 : 30), [period]);

  const entries = useMemo(
    () => days.map((d) => diaryEntries[dateKey(d)] || { date: dateKey(d), meals: [], totalMacros: EMPTY_MACROS }),
    [days, diaryEntries]
  );

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

  // Weight history data
  const weightHistory = profile.weightHistory || [];
  const weightChartData = useMemo(() => {
    const dayKeys = days.map((d) => dateKey(d));
    const historyMap = new Map(weightHistory.map((e) => [e.date, e.weight]));
    const weights: number[] = [];
    const weightLabels: string[] = [];
    dayKeys.forEach((dk, i) => {
      const w = historyMap.get(dk);
      if (w !== undefined) {
        weights.push(w);
        weightLabels.push(labels[i]);
      }
    });
    return { weights, labels: weightLabels };
  }, [days, weightHistory, labels]);

  const macroTabData: Record<MacroTab, { data: number[]; color: string; label: string; target: number }> = {
    proteins: {
      data: proteinData,
      color: colors.proteins,
      label: 'Белки',
      target: profile.targetProteins,
    },
    fats: {
      data: fatData,
      color: colors.fats,
      label: 'Жиры',
      target: profile.targetFats,
    },
    carbs: {
      data: carbData,
      color: colors.carbs,
      label: 'Углеводы',
      target: profile.targetCarbs,
    },
  };

  const currentMacro = macroTabData[macroTab];

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

  const handleSaveWeight = () => {
    const w = parseFloat(weightInput.replace(',', '.'));
    if (isNaN(w) || w < 20 || w > 300) {
      Alert.alert('Ошибка', 'Введите корректный вес (20-300 кг)');
      return;
    }
    addWeightEntry(Math.round(w * 10) / 10);
    setWeightModalVisible(false);
    setWeightInput('');
  };

  // Extract rgba components from hex color
  const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
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

        {/* Calories Chart */}
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

        {/* BJU Charts with tabs */}
        <Text style={styles.chartTitle}>БЖУ</Text>
        <View style={styles.macroTabRow}>
          {(Object.keys(macroTabData) as MacroTab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.macroTab,
                macroTab === tab && { backgroundColor: macroTabData[tab].color },
              ]}
              onPress={() => setMacroTab(tab)}
            >
              <Text style={[
                styles.macroTabText,
                macroTab === tab && styles.macroTabTextActive,
              ]}>
                {macroTabData[tab].label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {calorieData.some((c) => c > 0) ? (
          <View>
            <BarChart
              data={{
                labels: period === 'week' ? labels : displayLabels,
                datasets: [
                  {
                    data: currentMacro.data.map((v) => v || 0),
                  },
                ],
              }}
              width={screenWidth}
              height={200}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => hexToRgba(currentMacro.color, opacity),
              }}
              style={styles.chart}
              fromZero
              yAxisSuffix="г"
              yAxisLabel=""
            />
            <View style={styles.macroSummaryRow}>
              <Text style={[styles.macroAvg, { color: currentMacro.color }]}>
                Среднее: {Math.round(currentMacro.data.reduce((a, b) => a + b, 0) / currentMacro.data.length)}г
              </Text>
              <Text style={styles.macroTarget}>
                Цель: {currentMacro.target}г
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.noData}>Нет данных за этот период</Text>
        )}

        {/* Weight History */}
        <View style={styles.weightHeader}>
          <Text style={styles.chartTitle}>Вес</Text>
          <TouchableOpacity
            style={styles.addWeightButton}
            onPress={() => {
              setWeightInput(String(profile.weightKg));
              setWeightModalVisible(true);
            }}
          >
            <Text style={styles.addWeightText}>+ Записать</Text>
          </TouchableOpacity>
        </View>

        {weightChartData.weights.length >= 2 ? (
          <LineChart
            data={{
              labels: weightChartData.labels.length <= 7
                ? weightChartData.labels
                : weightChartData.labels.filter((_, i) => i % Math.ceil(weightChartData.labels.length / 7) === 0),
              datasets: [
                { data: weightChartData.weights },
              ],
            }}
            width={screenWidth}
            height={200}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(124, 77, 255, ${opacity})`,
              propsForDots: {
                r: '5',
                strokeWidth: '2',
                stroke: colors.workout,
              },
            }}
            bezier
            style={styles.chart}
            yAxisSuffix=" кг"
            yAxisLabel=""
          />
        ) : (
          <View style={styles.noWeightData}>
            <Text style={styles.noData}>
              {weightChartData.weights.length === 1
                ? 'Нужно минимум 2 записи для графика'
                : 'Нет записей веса. Нажмите "+ Записать"'}
            </Text>
            {weightHistory.length > 0 && (
              <Text style={styles.currentWeight}>
                Текущий вес: {profile.weightKg} кг
              </Text>
            )}
          </View>
        )}

        {weightHistory.length > 0 && (
          <View style={styles.weightStatsRow}>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: colors.workout }]}>
                {profile.weightKg}
              </Text>
              <Text style={styles.summaryLabel}>Текущий (кг)</Text>
            </View>
            {weightHistory.length >= 2 && (
              <View style={styles.summaryCard}>
                <Text style={[
                  styles.summaryValue,
                  { color: (weightHistory[weightHistory.length - 1].weight - weightHistory[0].weight) <= 0
                    ? colors.primary
                    : colors.error
                  },
                ]}>
                  {((weightHistory[weightHistory.length - 1].weight - weightHistory[0].weight) > 0 ? '+' : '')}
                  {(weightHistory[weightHistory.length - 1].weight - weightHistory[0].weight).toFixed(1)}
                </Text>
                <Text style={styles.summaryLabel}>Изменение (кг)</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Weight Input Modal */}
      <Modal
        visible={weightModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setWeightModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Записать вес</Text>
            <TextInput
              style={styles.modalInput}
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="decimal-pad"
              placeholder="Ваш вес (кг)"
              placeholderTextColor={colors.textSecondary}
              autoFocus
              selectTextOnFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setWeightModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSave}
                onPress={handleSaveWeight}
              >
                <Text style={styles.modalSaveText}>Сохранить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function getStyles(c: typeof darkColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.background,
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
      color: c.primary,
      fontWeight: '600',
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: c.text,
      marginBottom: 16,
    },
    periodRow: {
      flexDirection: 'row',
      backgroundColor: c.surface,
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
      backgroundColor: c.primary,
    },
    periodText: {
      fontSize: 15,
      fontWeight: '600',
      color: c.textSecondary,
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
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    summaryValue: {
      fontSize: 24,
      fontWeight: '700',
      color: c.primary,
    },
    summaryLabel: {
      fontSize: 12,
      color: c.textSecondary,
      marginTop: 4,
      textAlign: 'center',
    },
    chartTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: c.text,
      marginBottom: 10,
      marginTop: 8,
    },
    chart: {
      borderRadius: 12,
      marginBottom: 16,
    },
    noData: {
      fontSize: 14,
      color: c.textSecondary,
      textAlign: 'center',
      padding: 40,
    },
    // Macro tabs
    macroTabRow: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: 10,
      padding: 3,
      marginBottom: 12,
    },
    macroTab: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
    },
    macroTabText: {
      fontSize: 14,
      fontWeight: '600',
      color: c.textSecondary,
    },
    macroTabTextActive: {
      color: '#FFFFFF',
    },
    macroSummaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
      marginBottom: 8,
    },
    macroAvg: {
      fontSize: 14,
      fontWeight: '600',
    },
    macroTarget: {
      fontSize: 14,
      color: c.textSecondary,
    },
    // Weight
    weightHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    addWeightButton: {
      backgroundColor: c.workout,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    addWeightText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    noWeightData: {
      alignItems: 'center',
    },
    currentWeight: {
      fontSize: 16,
      fontWeight: '600',
      color: c.workout,
      marginTop: 4,
    },
    weightStatsRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
      marginBottom: 16,
    },
    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 24,
      width: '85%',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: c.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    modalInput: {
      backgroundColor: c.background,
      borderRadius: 10,
      padding: 14,
      fontSize: 18,
      color: c.text,
      textAlign: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 20,
    },
    modalCancel: {
      flex: 1,
      padding: 14,
      borderRadius: 10,
      alignItems: 'center',
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
    },
    modalCancelText: {
      fontSize: 16,
      color: c.textSecondary,
      fontWeight: '600',
    },
    modalSave: {
      flex: 1,
      padding: 14,
      borderRadius: 10,
      alignItems: 'center',
      backgroundColor: c.workout,
    },
    modalSaveText: {
      fontSize: 16,
      color: '#FFFFFF',
      fontWeight: '700',
    },
  });
}
