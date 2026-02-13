import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  visible: boolean;
  text?: string;
}

export default function LoadingOverlay({ visible, text = 'Анализируем...' }: Props) {
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 36,
    alignItems: 'center',
    minWidth: 200,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
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
    color: colors.text,
  },
  subtext: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textMuted,
  },
});
