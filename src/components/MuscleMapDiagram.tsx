import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect, Ellipse } from 'react-native-svg';
import { MuscleId } from '../models/types';
import { colors } from '../theme/colors';

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Грудь',
  upperBack: 'Верх спины',
  lats: 'Широчайшие',
  shoulders: 'Плечи',
  frontDelts: 'Передние дельты',
  sideDelts: 'Средние дельты',
  rearDelts: 'Задние дельты',
  biceps: 'Бицепс',
  triceps: 'Трицепс',
  forearms: 'Предплечья',
  abs: 'Пресс',
  obliques: 'Косые мышцы',
  lowerBack: 'Поясница',
  quads: 'Квадрицепсы',
  hamstrings: 'Бицепс бедра',
  glutes: 'Ягодицы',
  calves: 'Икры',
  'hip-flexors': 'Сгибатели бедра',
  cardio: 'Сердце (кардио)',
};

interface Props {
  primary: MuscleId[];
  secondary: MuscleId[];
}

const PRIMARY_COLOR = '#A29BFE';
const SECONDARY_COLOR = 'rgba(162, 155, 254, 0.35)';
const INACTIVE_COLOR = 'rgba(255,255,255,0.08)';

function getMuscleColor(
  muscleId: MuscleId,
  primary: MuscleId[],
  secondary: MuscleId[],
): string {
  if (primary.includes(muscleId)) return PRIMARY_COLOR;
  if (secondary.includes(muscleId)) return SECONDARY_COLOR;
  return INACTIVE_COLOR;
}

function getDeltsColor(primary: MuscleId[], secondary: MuscleId[]): string {
  const ids: MuscleId[] = ['shoulders', 'frontDelts', 'sideDelts', 'rearDelts'];
  if (ids.some((id) => primary.includes(id))) return PRIMARY_COLOR;
  if (ids.some((id) => secondary.includes(id))) return SECONDARY_COLOR;
  return INACTIVE_COLOR;
}

export default function MuscleMapDiagram({ primary, secondary }: Props) {
  const allMuscles = [...new Set([...primary, ...secondary])];

  return (
    <View style={styles.container}>
      <View style={styles.diagramRow}>
        {/* Front View */}
        <View style={styles.bodyView}>
          <Text style={styles.viewLabel}>Спереди</Text>
          <Svg width={120} height={220} viewBox="0 0 120 220">
            {/* Head */}
            <Circle cx={60} cy={18} r={14} fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.25)" strokeWidth={1} />

            {/* Neck */}
            <Rect x={53} y={32} width={14} height={10} rx={3} fill="rgba(255,255,255,0.1)" />

            {/* Shoulders (front) */}
            <Ellipse cx={30} cy={48} rx={12} ry={8} fill={getDeltsColor(primary, secondary)} />
            <Ellipse cx={90} cy={48} rx={12} ry={8} fill={getDeltsColor(primary, secondary)} />

            {/* Chest */}
            <Ellipse cx={47} cy={62} rx={15} ry={12} fill={getMuscleColor('chest', primary, secondary)} />
            <Ellipse cx={73} cy={62} rx={15} ry={12} fill={getMuscleColor('chest', primary, secondary)} />

            {/* Abs */}
            <Rect x={44} y={76} width={32} height={30} rx={4} fill={getMuscleColor('abs', primary, secondary)} />

            {/* Obliques */}
            <Rect x={36} y={78} width={8} height={26} rx={3} fill={getMuscleColor('obliques', primary, secondary)} />
            <Rect x={76} y={78} width={8} height={26} rx={3} fill={getMuscleColor('obliques', primary, secondary)} />

            {/* Biceps front */}
            <Rect x={16} y={56} width={10} height={28} rx={5} fill={getMuscleColor('biceps', primary, secondary)} />
            <Rect x={94} y={56} width={10} height={28} rx={5} fill={getMuscleColor('biceps', primary, secondary)} />

            {/* Forearms */}
            <Rect x={14} y={86} width={9} height={26} rx={4} fill={getMuscleColor('forearms', primary, secondary)} />
            <Rect x={97} y={86} width={9} height={26} rx={4} fill={getMuscleColor('forearms', primary, secondary)} />

            {/* Hip flexors */}
            <Ellipse cx={48} cy={112} rx={8} ry={5} fill={getMuscleColor('hip-flexors', primary, secondary)} />
            <Ellipse cx={72} cy={112} rx={8} ry={5} fill={getMuscleColor('hip-flexors', primary, secondary)} />

            {/* Quads */}
            <Rect x={36} y={118} width={16} height={44} rx={6} fill={getMuscleColor('quads', primary, secondary)} />
            <Rect x={68} y={118} width={16} height={44} rx={6} fill={getMuscleColor('quads', primary, secondary)} />

            {/* Calves front */}
            <Rect x={38} y={168} width={12} height={34} rx={5} fill={getMuscleColor('calves', primary, secondary)} />
            <Rect x={70} y={168} width={12} height={34} rx={5} fill={getMuscleColor('calves', primary, secondary)} />
          </Svg>
        </View>

        {/* Back View */}
        <View style={styles.bodyView}>
          <Text style={styles.viewLabel}>Сзади</Text>
          <Svg width={120} height={220} viewBox="0 0 120 220">
            {/* Head */}
            <Circle cx={60} cy={18} r={14} fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.25)" strokeWidth={1} />

            {/* Neck */}
            <Rect x={53} y={32} width={14} height={10} rx={3} fill="rgba(255,255,255,0.1)" />

            {/* Shoulders (rear delts) */}
            <Ellipse cx={30} cy={48} rx={12} ry={8} fill={getDeltsColor(primary, secondary)} />
            <Ellipse cx={90} cy={48} rx={12} ry={8} fill={getDeltsColor(primary, secondary)} />

            {/* Upper Back / Traps */}
            <Path d="M42,42 L78,42 L74,58 L46,58 Z" fill={getMuscleColor('upperBack', primary, secondary)} />

            {/* Lats */}
            <Path d="M38,60 L46,56 L46,86 L38,80 Z" fill={getMuscleColor('lats', primary, secondary)} />
            <Path d="M82,60 L74,56 L74,86 L82,80 Z" fill={getMuscleColor('lats', primary, secondary)} />

            {/* Lower Back */}
            <Rect x={46} y={76} width={28} height={20} rx={4} fill={getMuscleColor('lowerBack', primary, secondary)} />

            {/* Triceps */}
            <Rect x={16} y={56} width={10} height={28} rx={5} fill={getMuscleColor('triceps', primary, secondary)} />
            <Rect x={94} y={56} width={10} height={28} rx={5} fill={getMuscleColor('triceps', primary, secondary)} />

            {/* Forearms back */}
            <Rect x={14} y={86} width={9} height={26} rx={4} fill={getMuscleColor('forearms', primary, secondary)} />
            <Rect x={97} y={86} width={9} height={26} rx={4} fill={getMuscleColor('forearms', primary, secondary)} />

            {/* Glutes */}
            <Ellipse cx={48} cy={108} rx={12} ry={10} fill={getMuscleColor('glutes', primary, secondary)} />
            <Ellipse cx={72} cy={108} rx={12} ry={10} fill={getMuscleColor('glutes', primary, secondary)} />

            {/* Hamstrings */}
            <Rect x={36} y={120} width={16} height={42} rx={6} fill={getMuscleColor('hamstrings', primary, secondary)} />
            <Rect x={68} y={120} width={16} height={42} rx={6} fill={getMuscleColor('hamstrings', primary, secondary)} />

            {/* Calves back */}
            <Rect x={38} y={168} width={12} height={34} rx={5} fill={getMuscleColor('calves', primary, secondary)} />
            <Rect x={70} y={168} width={12} height={34} rx={5} fill={getMuscleColor('calves', primary, secondary)} />
          </Svg>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {primary.length > 0 && (
          <View style={styles.legendSection}>
            <View style={[styles.legendDot, { backgroundColor: PRIMARY_COLOR }]} />
            <Text style={styles.legendLabel}>Основные: </Text>
            <Text style={styles.legendMuscles}>
              {primary.map((m) => MUSCLE_LABELS[m] || m).join(', ')}
            </Text>
          </View>
        )}
        {secondary.length > 0 && (
          <View style={styles.legendSection}>
            <View style={[styles.legendDot, { backgroundColor: SECONDARY_COLOR }]} />
            <Text style={styles.legendLabel}>Вспомогательные: </Text>
            <Text style={styles.legendMuscles}>
              {secondary.map((m) => MUSCLE_LABELS[m] || m).join(', ')}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  diagramRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bodyView: {
    alignItems: 'center',
  },
  viewLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  legend: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    gap: 6,
  },
  legendSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  legendMuscles: {
    fontSize: 12,
    color: colors.text,
    flex: 1,
  },
});
