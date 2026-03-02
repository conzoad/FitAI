import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect, Ellipse, G } from 'react-native-svg';
import { MuscleId } from '../models/types';
import { darkColors } from '../theme/colors';
import { useColors } from '../theme/useColors';
import { useLanguageStore } from '../stores/useLanguageStore';
import { t } from '../i18n/translations';

interface Props {
  primary: MuscleId[];
  secondary: MuscleId[];
  primaryColor?: string;
  secondaryColor?: string;
  inactiveColor?: string;
  onPress?: (muscleId: MuscleId) => void;
}

const DEFAULT_PRIMARY = '#A29BFE';
const DEFAULT_SECONDARY = 'rgba(162, 155, 254, 0.35)';
const DEFAULT_INACTIVE = 'rgba(255,255,255,0.08)';

function getMuscleColor(
  muscleId: MuscleId,
  primary: MuscleId[],
  secondary: MuscleId[],
  pColor: string,
  sColor: string,
  iColor: string,
): string {
  if (primary.includes(muscleId)) return pColor;
  if (secondary.includes(muscleId)) return sColor;
  return iColor;
}

function getDeltsColor(
  primary: MuscleId[],
  secondary: MuscleId[],
  pColor: string,
  sColor: string,
  iColor: string,
): string {
  const ids: MuscleId[] = ['shoulders', 'frontDelts', 'sideDelts', 'rearDelts'];
  if (ids.some((id) => primary.includes(id))) return pColor;
  if (ids.some((id) => secondary.includes(id))) return sColor;
  return iColor;
}

export default function MuscleMapDiagram({
  primary,
  secondary,
  primaryColor = DEFAULT_PRIMARY,
  secondaryColor = DEFAULT_SECONDARY,
  inactiveColor = DEFAULT_INACTIVE,
  onPress,
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const lang = useLanguageStore((s) => s.language);
  const T = t(lang);

  const mc = (id: MuscleId) => getMuscleColor(id, primary, secondary, primaryColor, secondaryColor, inactiveColor);
  const dc = () => getDeltsColor(primary, secondary, primaryColor, secondaryColor, inactiveColor);

  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      style={styles.container}
      activeOpacity={onPress ? 0.8 : 1}
      onPress={onPress ? () => {} : undefined}
    >
      <View style={styles.diagramRow}>
        {/* Front View */}
        <View style={styles.bodyView}>
          <Text style={styles.viewLabel}>{T.muscleMap.front}</Text>
          <Svg width={120} height={220} viewBox="0 0 120 220">
            {/* Head */}
            <Circle cx={60} cy={18} r={14} fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.25)" strokeWidth={1} />
            {/* Neck */}
            <Rect x={53} y={32} width={14} height={10} rx={3} fill="rgba(255,255,255,0.1)" />
            {/* Shoulders (front) */}
            <Ellipse cx={30} cy={48} rx={12} ry={8} fill={dc()} />
            <Ellipse cx={90} cy={48} rx={12} ry={8} fill={dc()} />
            {/* Chest */}
            <Ellipse cx={47} cy={62} rx={15} ry={12} fill={mc('chest')} />
            <Ellipse cx={73} cy={62} rx={15} ry={12} fill={mc('chest')} />
            {/* Abs */}
            <Rect x={44} y={76} width={32} height={30} rx={4} fill={mc('abs')} />
            {/* Obliques */}
            <Rect x={36} y={78} width={8} height={26} rx={3} fill={mc('obliques')} />
            <Rect x={76} y={78} width={8} height={26} rx={3} fill={mc('obliques')} />
            {/* Biceps front */}
            <Rect x={16} y={56} width={10} height={28} rx={5} fill={mc('biceps')} />
            <Rect x={94} y={56} width={10} height={28} rx={5} fill={mc('biceps')} />
            {/* Forearms */}
            <Rect x={14} y={86} width={9} height={26} rx={4} fill={mc('forearms')} />
            <Rect x={97} y={86} width={9} height={26} rx={4} fill={mc('forearms')} />
            {/* Hip flexors */}
            <Ellipse cx={48} cy={112} rx={8} ry={5} fill={mc('hip-flexors')} />
            <Ellipse cx={72} cy={112} rx={8} ry={5} fill={mc('hip-flexors')} />
            {/* Quads */}
            <Rect x={36} y={118} width={16} height={44} rx={6} fill={mc('quads')} />
            <Rect x={68} y={118} width={16} height={44} rx={6} fill={mc('quads')} />
            {/* Calves front */}
            <Rect x={38} y={168} width={12} height={34} rx={5} fill={mc('calves')} />
            <Rect x={70} y={168} width={12} height={34} rx={5} fill={mc('calves')} />
          </Svg>
        </View>

        {/* Back View */}
        <View style={styles.bodyView}>
          <Text style={styles.viewLabel}>{T.muscleMap.back}</Text>
          <Svg width={120} height={220} viewBox="0 0 120 220">
            {/* Head */}
            <Circle cx={60} cy={18} r={14} fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.25)" strokeWidth={1} />
            {/* Neck */}
            <Rect x={53} y={32} width={14} height={10} rx={3} fill="rgba(255,255,255,0.1)" />
            {/* Shoulders (rear delts) */}
            <Ellipse cx={30} cy={48} rx={12} ry={8} fill={dc()} />
            <Ellipse cx={90} cy={48} rx={12} ry={8} fill={dc()} />
            {/* Upper Back / Traps */}
            <Path d="M42,42 L78,42 L74,58 L46,58 Z" fill={mc('upperBack')} />
            {/* Lats */}
            <Path d="M38,60 L46,56 L46,86 L38,80 Z" fill={mc('lats')} />
            <Path d="M82,60 L74,56 L74,86 L82,80 Z" fill={mc('lats')} />
            {/* Lower Back */}
            <Rect x={46} y={76} width={28} height={20} rx={4} fill={mc('lowerBack')} />
            {/* Triceps */}
            <Rect x={16} y={56} width={10} height={28} rx={5} fill={mc('triceps')} />
            <Rect x={94} y={56} width={10} height={28} rx={5} fill={mc('triceps')} />
            {/* Forearms back */}
            <Rect x={14} y={86} width={9} height={26} rx={4} fill={mc('forearms')} />
            <Rect x={97} y={86} width={9} height={26} rx={4} fill={mc('forearms')} />
            {/* Glutes */}
            <Ellipse cx={48} cy={108} rx={12} ry={10} fill={mc('glutes')} />
            <Ellipse cx={72} cy={108} rx={12} ry={10} fill={mc('glutes')} />
            {/* Hamstrings */}
            <Rect x={36} y={120} width={16} height={42} rx={6} fill={mc('hamstrings')} />
            <Rect x={68} y={120} width={16} height={42} rx={6} fill={mc('hamstrings')} />
            {/* Calves back */}
            <Rect x={38} y={168} width={12} height={34} rx={5} fill={mc('calves')} />
            <Rect x={70} y={168} width={12} height={34} rx={5} fill={mc('calves')} />
          </Svg>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {primary.length > 0 && (
          <View style={styles.legendSection}>
            <View style={[styles.legendDot, { backgroundColor: primaryColor }]} />
            <Text style={styles.legendLabel}>{T.muscleMap.primaryLegend} </Text>
            <Text style={styles.legendMuscles}>
              {primary.map((m) => T.labels.muscles[m] || m).join(', ')}
            </Text>
          </View>
        )}
        {secondary.length > 0 && (
          <View style={styles.legendSection}>
            <View style={[styles.legendDot, { backgroundColor: secondaryColor }]} />
            <Text style={styles.legendLabel}>{T.muscleMap.secondaryLegend} </Text>
            <Text style={styles.legendMuscles}>
              {secondary.map((m) => T.labels.muscles[m] || m).join(', ')}
            </Text>
          </View>
        )}
      </View>
    </Wrapper>
  );
}

function getStyles(c: typeof darkColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: c.border,
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
      color: c.textSecondary,
      fontWeight: '600',
      marginBottom: 6,
      textTransform: 'uppercase',
    },
    legend: {
      borderTopWidth: 1,
      borderTopColor: c.border,
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
      color: c.textSecondary,
      fontWeight: '600',
    },
    legendMuscles: {
      fontSize: 12,
      color: c.text,
      flex: 1,
    },
  });
}
