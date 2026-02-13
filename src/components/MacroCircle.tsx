import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { darkColors } from '../theme/colors';
import { useColors } from '../theme/useColors';

interface Props {
  value: number;
  target: number;
  label: string;
  color: string;
  size?: number;
}

export default function MacroCircle({ value, target, label, color, size = 76 }: Props) {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = target > 0 ? Math.min(value / target, 1) : 0;
  const strokeDashoffset = circumference * (1 - percentage);

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color + '20'}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <Text style={[styles.value, { color }]}>{Math.round(value)}г</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.target}>из {Math.round(target)}г</Text>
    </View>
  );
}

function getStyles(c: typeof darkColors) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
    },
    value: {
      position: 'absolute',
      fontSize: 14,
      fontWeight: '700',
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: c.textSecondary,
      marginTop: 6,
    },
    target: {
      fontSize: 10,
      color: c.textMuted,
      marginTop: 1,
    },
  });
}
