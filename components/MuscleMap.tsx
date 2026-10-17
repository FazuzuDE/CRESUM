import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';
import type { MuscleId } from '@/lib/exercise-taxonomy';
import type { MuscleParticipation } from '@/lib/muscle-participation';
import { colors, typography } from '@/lib/theme';

// Original schematic regions, not an anatomical activation model. Coordinates are
// mirrored for bilateral groups; the journal does not record side-specific load.
const front: Partial<Record<MuscleId, string>> = {
  chest: 'M49 58 Q61 51 77 59 L77 82 Q60 85 48 74 Z',
  'front-delts': 'M47 55 Q34 54 31 73 L43 81 L49 66 Z',
  'side-delts': 'M31 65 L26 77 L29 91 L34 79 Z',
  biceps: 'M34 82 L44 88 L39 112 L27 108 Z',
  forearms: 'M26 113 L38 117 L28 146 L18 143 Z',
  abs: 'M61 88 L77 88 L77 135 L64 130 L58 109 Z',
  quadriceps: 'M52 151 L66 152 L70 186 L64 215 L48 211 L44 183 Z',
  adductors: 'M69 144 L77 145 L74 187 L70 180 Z',
  calves: 'M49 225 L62 229 L60 257 L53 276 L45 272 Z',
};
const back: Partial<Record<MuscleId, string>> = {
  traps: 'M66 45 L77 47 L77 73 L57 58 Z',
  'upper-back': 'M49 64 L61 65 L76 80 L66 96 L50 84 Z',
  lats: 'M47 87 L63 99 L76 87 L74 126 L59 130 L51 111 Z',
  'rear-delts': 'M46 55 Q32 54 30 76 L43 81 L49 65 Z',
  'side-delts': 'M30 65 L26 78 L29 90 L34 79 Z',
  triceps: 'M32 83 L44 87 L39 112 L27 109 Z',
  forearms: 'M26 114 L38 118 L28 146 L18 143 Z',
  'lower-back': 'M64 130 L77 122 L77 144 L61 144 Z',
  glutes: 'M53 146 Q66 141 77 147 L77 168 Q62 179 49 165 Z',
  hamstrings: 'M49 174 L66 177 L70 192 L63 215 L48 212 L45 193 Z',
  calves: 'M49 225 L64 227 L62 252 L54 273 L45 270 Z',
};
export function MuscleMap({
  muscles,
  selected,
  onSelect,
}: {
  muscles: MuscleParticipation['muscles'];
  selected?: MuscleId;
  onSelect: (id: MuscleId) => void;
}) {
  return (
    <View style={s.row}>
      {(
        [
          ['Front', front],
          ['Back', back],
        ] as const
      ).map(([label, regions]) => (
        <View key={label} style={s.body}>
          <Svg
            width="100%"
            height={300}
            viewBox="0 0 156 310"
            accessible={false}
          >
            <Circle cx={78} cy={23} r={17} fill={colors.muscleNeutral} />
            <Path
              d="M67 40 L89 40 L96 49 Q118 49 127 70 L135 110 L146 151 L136 155 L120 119 L113 96 L108 133 L116 174 L111 218 L113 269 L116 295 L99 297 L92 276 L88 228 L78 183 L68 228 L64 276 L57 297 L40 295 L43 269 L45 218 L40 174 L48 133 L43 96 L36 119 L20 155 L10 151 L21 110 L29 70 Q38 49 60 49 Z"
              fill={colors.muscleNeutral}
            />
            {Object.entries(regions).map(([key, d]) => {
              const id = key as MuscleId;
              const muscle = muscles.find((item) => item.id === id)!;
              const fill = muscle.primary
                ? colors.musclePrimary
                : muscle.secondary
                  ? colors.muscleSecondary
                  : colors.muscleNeutral;
              return (
                <G key={id} onPress={() => onSelect(id)}>
                  {[undefined, 'translate(156 0) scale(-1 1)'].map(
                    (transform, i) => (
                      <Path
                        key={i}
                        d={d}
                        transform={transform}
                        fill={fill}
                        stroke={
                          selected === id ? colors.textPrimary : colors.surface
                        }
                        strokeWidth={selected === id ? 2 : 1}
                      />
                    ),
                  )}
                </G>
              );
            })}
          </Svg>
          <Text style={s.label}>{label}</Text>
        </View>
      ))}
    </View>
  );
}
const s = StyleSheet.create({
  row: { flexDirection: 'row' },
  body: { flex: 1 },
  label: {
    ...typography.footnote,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
