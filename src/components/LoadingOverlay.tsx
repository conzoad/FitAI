import React, { useMemo } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { darkColors } from '../theme/colors';
import { useColors } from '../theme/useColors';

interface Props {
  visible: boolean;
  text?: string;
}

export default function LoadingOverlay({ visible, text = 'Анализируем...' }: Props) {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.indicatorRing}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
          <Text style={styles.text}>{text}</Text>
          <Text style={styles.subtext}>Это может занять несколько секунд</Text>
        </View>
      </View>
    </Modal>
  );
}

function getStyles(c: typeof darkColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: c.overlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 24,
      padding: 36,
      alignItems: 'center',
      minWidth: 200,
      borderWidth: 1,
      borderColor: c.border,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
      elevation: 10,
    },
    indicatorRing: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: 'rgba(108, 92, 231, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    text: {
      marginTop: 20,
      fontSize: 17,
      fontWeight: '600',
      color: c.text,
    },
    subtext: {
      marginTop: 6,
      fontSize: 13,
      color: c.textMuted,
    },
  });
}
