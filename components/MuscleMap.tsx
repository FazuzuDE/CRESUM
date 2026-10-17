import { useId } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path, G } from 'react-native-svg';
import type { MuscleId } from '@/lib/exercise-taxonomy';
import type { MuscleParticipation } from '@/lib/muscle-participation';
import {
  muscleMapBody,
  frontMuscleRegions,
  backMuscleRegions,
  frontBodyDetails,
  backBodyDetails,
} from '@/lib/muscle-map-geometry';
import { colors, spacing, typography } from '@/lib/theme';

export function MuscleMap({
  muscles,
  selected,
  onSelect,
}: {
  muscles: MuscleParticipation['muscles'];
  selected?: MuscleId;
  onSelect: (id: MuscleId) => void;
}) {
  const instance = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <View style={s.row}>
      {(
        [
          ['Front', frontMuscleRegions, frontBodyDetails],
          ['Back', backMuscleRegions, backBodyDetails],
        ] as const
      ).map(([label, regions, details]) => {
        const prefix = `muscle${instance}${label}`;
        return (
          <View key={label} style={s.body}>
            <Svg
              width="100%"
              height={340}
              viewBox="0 0 200 454"
              accessible={false}
            >
              <Defs>
                {(
                  [
                    [
                      'neutral',
                      colors.muscleNeutralHighlight,
                      colors.muscleNeutral,
                      colors.muscleNeutralShade,
                    ],
                    [
                      'primary',
                      colors.musclePrimaryHighlight,
                      colors.musclePrimary,
                      colors.musclePrimaryShade,
                    ],
                    [
                      'secondary',
                      colors.muscleSecondaryHighlight,
                      colors.muscleSecondary,
                      colors.muscleSecondaryShade,
                    ],
                  ] as const
                ).map(([role, light, base, shade]) => (
                  <LinearGradient
                    key={role}
                    id={`${prefix}${role}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="25%"
                  >
                    <Stop offset="0%" stopColor={shade} />
                    <Stop offset="35%" stopColor={light} />
                    <Stop offset="65%" stopColor={base} />
                    <Stop offset="100%" stopColor={shade} />
                  </LinearGradient>
                ))}
              </Defs>
              <Path d={muscleMapBody.outline} fill={`url(#${prefix}neutral)`} />
              <Path d={muscleMapBody.head} fill={`url(#${prefix}neutral)`} />
              {Object.entries(regions).map(([key, d]) => {
                const id = key as MuscleId;
                const muscle = muscles.find((item) => item.id === id);
                const role = muscle?.primary
                  ? 'primary'
                  : muscle?.secondary
                    ? 'secondary'
                    : 'neutral';
                return (
                  <G key={id} onPress={() => onSelect(id)}>
                    {[undefined, 'translate(200 0) scale(-1 1)'].map(
                      (transform, i) => (
                        <Path
                          key={i}
                          d={d}
                          transform={transform}
                          fill={`url(#${prefix}${role})`}
                          stroke={
                            selected === id
                              ? colors.textPrimary
                              : colors.surface
                          }
                          strokeWidth={selected === id ? 1.5 : 0.65}
                          strokeLinejoin="round"
                        />
                      ),
                    )}
                  </G>
                );
              })}
              <G pointerEvents="none" opacity={0.35}>
                {[undefined, 'translate(200 0) scale(-1 1)'].map(
                  (transform, i) => (
                    <Path
                      key={i}
                      d={details}
                      transform={transform}
                      fill="none"
                      stroke={colors.muscleNeutralShade}
                      strokeWidth={0.8}
                      strokeLinecap="round"
                    />
                  ),
                )}
              </G>
            </Svg>
            <Text style={s.label}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}
const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xs },
  body: { flex: 1 },
  label: {
    ...typography.footnote,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
