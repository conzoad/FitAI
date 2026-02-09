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
            value={item.amount}
            onChangeText={(v) => onUpdate?.('amount', v)}
            placeholder="Кол-во"
          />
        ) : (
          <Text style={styles.amount}>{item.amount}</Text>
        )}
      </View>
      <View style={styles.macros}>
        <Text style={[styles.macroItem, { color: colors.calories }]}>
          {Math.round(item.calories)} ккал
        </Text>
        <Text style={[styles.macroItem, { color: colors.proteins }]}>
          Б:{item.proteins}г
        </Text>
        <Text style={[styles.macroItem, { color: colors.fats }]}>
          Ж:{item.fats}г
        </Text>
        <Text style={[styles.macroItem, { color: colors.carbs }]}>
          У:{item.carbs}г
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
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
    gap: 12,
  },
  macroItem: {
    fontSize: 13,
    fontWeight: '500',
  },
});
