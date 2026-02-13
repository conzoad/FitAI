import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface FoodItemData {
  name: string;
  amount: string;
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
}

interface Props {
  item: FoodItemData;
  editable?: boolean;
  onUpdate?: (field: string, value: string) => void;
}

export default function FoodItemCard({ item, editable = false, onUpdate }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{item.name}</Text>
        {editable ? (
          <TextInput
            style={styles.amountInput}
            defaultValue={item.amount}
            onEndEditing={(e) => onUpdate?.('amount', e.nativeEvent.text)}
            keyboardType="numeric"
            placeholder="Кол-во"
            placeholderTextColor={colors.textMuted}
          />
        ) : (
          <Text style={styles.amount}>{item.amount}</Text>
        )}
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.text,
    flex: 1,
  },
  amount: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  amountInput: {
    fontSize: 14,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    paddingVertical: 2,
    paddingHorizontal: 8,
    minWidth: 80,
    textAlign: 'right',
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
