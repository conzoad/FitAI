import React from 'react';
import { View, StyleSheet } from 'react-native';
import MacroCircle from './MacroCircle';
import { Macros } from '../models/types';
import { colors } from '../theme/colors';

interface Props {
  macros: Macros;
  targets: { targetProteins: number; targetFats: number; targetCarbs: number };
}

export default function MacroSummaryBar({ macros, targets }: Props) {
  return (
    <View style={styles.container}>
      <MacroCircle
        value={macros.proteins}
        target={targets.targetProteins}
        label="Белки"
        color={colors.proteins}
      />
      <MacroCircle
        value={macros.fats}
        target={targets.targetFats}
        label="Жиры"
        color={colors.fats}
      />
      <MacroCircle
        value={macros.carbs}
        target={targets.targetCarbs}
        label="Углеводы"
        color={colors.carbs}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
});
