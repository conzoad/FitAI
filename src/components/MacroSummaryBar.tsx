import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import MacroCircle from './MacroCircle';
import { Macros } from '../models/types';
import { darkColors } from '../theme/colors';
import { useColors } from '../theme/useColors';

interface Props {
  macros: Macros;
  targets: { targetProteins: number; targetFats: number; targetCarbs: number };
}

export default function MacroSummaryBar({ macros, targets }: Props) {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={styles.card}>
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
    </View>
  );
}

function getStyles(c: typeof darkColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: 16,
      paddingHorizontal: 8,
    },
    container: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
  });
}
