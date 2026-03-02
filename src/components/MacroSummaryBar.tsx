import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import MacroCircle from './MacroCircle';
import { Macros } from '../models/types';
import { darkColors } from '../theme/colors';
import { useColors } from '../theme/useColors';
import { useLanguageStore } from '../stores/useLanguageStore';
import { t } from '../i18n/translations';

interface Props {
  macros: Macros;
  targets: { targetProteins: number; targetFats: number; targetCarbs: number };
}

export default function MacroSummaryBar({ macros, targets }: Props) {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const lang = useLanguageStore((s) => s.language);
  const T = t(lang);

  return (
    <View style={styles.card}>
      <View style={styles.container}>
        <MacroCircle
          value={macros.proteins}
          target={targets.targetProteins}
          label={T.components.P}
          color={colors.proteins}
        />
        <MacroCircle
          value={macros.fats}
          target={targets.targetFats}
          label={T.components.F}
          color={colors.fats}
        />
        <MacroCircle
          value={macros.carbs}
          target={targets.targetCarbs}
          label={T.components.C}
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
