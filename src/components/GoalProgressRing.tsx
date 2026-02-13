import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../theme/colors';

interface Props {
  consumed: number;
  target: number;
  size?: number;
}

export default function GoalProgressRing({ consumed, target, size = 180 }: Props) {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = target > 0 ? Math.min(consumed / target, 1.5) : 0;
  const strokeDashoffset = circumference * (1 - Math.min(percentage, 1));
  const isOver = consumed > target;
  const percentText = target > 0 ? Math.round((consumed / target) * 100) : 0;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isOver ? 'rgba(255, 107, 107, 0.15)' : 'rgba(108, 92, 231, 0.12)'}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isOver ? colors.error : colors.calories}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.textContainer}>
        <Text style={[styles.value, isOver && { color: colors.error }]}>
          {Math.round(consumed)}
        </Text>
        <Text style={styles.unit}>ккал</Text>
        <Text style={styles.label}>из {Math.round(target)}</Text>
        <View style={[styles.percentBadge, isOver && { backgroundColor: 'rgba(255, 107, 107, 0.15)' }]}>
          <Text style={[styles.percentText, isOver && { color: colors.error }]}>
            {percentText}%
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  value: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1,
  },
  unit: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: -2,
  },
  label: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  percentBadge: {
    marginTop: 6,
    backgroundColor: 'rgba(108, 92, 231, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  percentText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
});
