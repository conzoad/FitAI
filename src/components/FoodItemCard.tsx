import React, { useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { darkColors } from '../theme/colors';
import { useColors } from '../theme/useColors';

interface FoodItemData {
  name: string;
  amount: string;
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
  glycemicIndex?: number;
  insulinIndex?: number;
  sugar?: number;
  salt?: number;
}

interface Props {
  item: FoodItemData;
  editable?: boolean;
  onUpdate?: (field: string, value: string) => void;
  onDelete?: () => void;
}

function extractNumericAmount(amount: string): string {
  const match = amount.match(/~?(\d+(?:[.,]\d+)?)/);
  return match ? match[1] : amount.replace(/[^0-9.,]/g, '');
}

function isEstimate(amount: string): boolean {
  return amount.includes('~') || amount.toLowerCase().includes('оценка');
}

export default function FoodItemCard({ item, editable = false, onUpdate, onDelete }: Props) {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        <View style={styles.amountRow}>
          {editable ? (
            <TextInput
              style={styles.amountInput}
              defaultValue={extractNumericAmount(item.amount)}
              onEndEditing={(e) => {
                const val = e.nativeEvent.text.trim();
                if (val) {
                  onUpdate?.('amount', val + 'г');
                }
              }}
              keyboardType="numeric"
              placeholder="Кол-во"
              placeholderTextColor={colors.textMuted}
            />
          ) : (
            <View>
              <Text style={styles.amount}>{item.amount}</Text>
              {isEstimate(item.amount) && (
                <Text style={styles.estimateLabel}>оценка по фото</Text>
              )}
            </View>
          )}
          {editable && onDelete && (
            <TouchableOpacity onPress={onDelete} style={styles.deleteItemButton}>
              <Text style={styles.deleteItemText}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={styles.macros}>
        <View style={[styles.macroPill, { backgroundColor: colors.calories + '18' }]}>
          <Text style={[styles.macroItem, { color: colors.calories }]}>
            {Math.round(item.calories)} ккал
          </Text>
        </View>
        <View style={[styles.macroPill, { backgroundColor: colors.proteins + '18' }]}>
          <Text style={[styles.macroItem, { color: colors.proteins }]}>
            Б:{item.proteins}г
          </Text>
        </View>
        <View style={[styles.macroPill, { backgroundColor: colors.fats + '18' }]}>
          <Text style={[styles.macroItem, { color: colors.fats }]}>
            Ж:{item.fats}г
          </Text>
        </View>
        <View style={[styles.macroPill, { backgroundColor: colors.carbs + '18' }]}>
          <Text style={[styles.macroItem, { color: colors.carbs }]}>
            У:{item.carbs}г
          </Text>
        </View>
        {item.sugar != null && (
          <View style={[styles.macroPill, { backgroundColor: colors.carbs + '18' }]}>
            <Text style={[styles.macroItem, { color: colors.carbs }]}>
              Сахар:{item.sugar}г
            </Text>
          </View>
        )}
        {item.salt != null && (
          <View style={[styles.macroPill, { backgroundColor: colors.textSecondary + '18' }]}>
            <Text style={[styles.macroItem, { color: colors.textSecondary }]}>
              Соль:{item.salt}г
            </Text>
          </View>
        )}
        {item.glycemicIndex != null && (
          <View style={[styles.macroPill, { backgroundColor: colors.calories + '18' }]}>
            <Text style={[styles.macroItem, { color: colors.calories }]}>
              ГИ:{item.glycemicIndex}
            </Text>
          </View>
        )}
        {item.insulinIndex != null && (
          <View style={[styles.macroPill, { backgroundColor: colors.calories + '18' }]}>
            <Text style={[styles.macroItem, { color: colors.calories }]}>
              ИИ:{item.insulinIndex}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function getStyles(c: typeof darkColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.surfaceLight,
      borderRadius: 14,
      padding: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    name: {
      fontSize: 15,
      fontWeight: '600',
      color: c.text,
      flex: 1,
      marginRight: 8,
    },
    amountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    amount: {
      fontSize: 14,
      color: c.textSecondary,
      fontWeight: '500',
      textAlign: 'right',
    },
    estimateLabel: {
      fontSize: 10,
      color: c.textMuted,
      textAlign: 'right',
      fontStyle: 'italic',
    },
    amountInput: {
      fontSize: 14,
      color: c.text,
      borderBottomWidth: 1,
      borderBottomColor: c.primary,
      paddingVertical: 2,
      paddingHorizontal: 8,
      minWidth: 80,
      textAlign: 'right',
    },
    deleteItemButton: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: c.error + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    deleteItemText: {
      fontSize: 16,
      fontWeight: '700',
      color: c.error,
      lineHeight: 18,
    },
    macros: {
      flexDirection: 'row',
      gap: 6,
      flexWrap: 'wrap',
    },
    macroPill: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    macroItem: {
      fontSize: 12,
      fontWeight: '600',
    },
  });
}
