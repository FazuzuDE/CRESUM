import { useId } from 'react';
import { useLocalization } from './LocalizationProvider';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  Image,
  Mask,
  ClipPath,
  Path,
  G,
  Rect,
} from 'react-native-svg';
import type { MuscleId } from '@/lib/exercise-taxonomy';
import {
  anatomicalAtlas,
  anatomicalGroups,
  anatomicalRegions,
} from '@/lib/anatomical-muscle-map';
import {
  colors,
  spacing,
  typography,
  muscleMapPresentation,
} from '@/lib/theme';

const source = require('../assets/muscle-map/male-anatomy-v1/source.png');

export function MuscleMap({
  muscles,
  selected,
  onSelect,
  height = muscleMapPresentation.height,
}: {
  muscles: readonly { id: MuscleId; primary: number; secondary: number }[];
  selected?: MuscleId;
  onSelect?: (id: MuscleId) => void;
  height?: number;
}) {
  const { t } = useLocalization();
  const instance = useId().replace(/[^a-zA-Z0-9]/g, '');
  const role = (id: MuscleId) => {
    const value = muscles.find((m) => m.id === id);
    return value?.primary ? 2 : value?.secondary ? 1 : 0;
  };
  const upperRole = role('upper-back'),
    trapsRole = role('traps');
  const projectionWins = upperRole > 0 && upperRole >= trapsRole;
  const cutout =
    upperRole && trapsRole
      ? {
          occluded: projectionWins ? 'traps' : 'upper-back',
          occluder: projectionWins ? 'upper-back' : 'traps',
        }
      : undefined;
  // Keep the visible winning projection above even neutral selectable traps.
  const groups = projectionWins
    ? [
        ...anatomicalGroups.filter((g) => g.id !== 'upper-back'),
        ...anatomicalGroups.filter((g) => g.id === 'upper-back'),
      ]
    : anatomicalGroups;
  return (
    <View style={s.row}>
      {(['front', 'back'] as const).map((view) => {
        const prefix = `anatomy${instance}${view}`;
        const regions = anatomicalRegions.filter(
          (r) => r.view === view && r.groupId !== null,
        );
        return (
          <View key={view} style={s.body}>
            <Svg
              width="100%"
              height={height}
              viewBox={anatomicalAtlas.views[view].viewBox.join(' ')}
              accessible={false}
            >
              <Defs>
                {view === 'back' && cutout ? (
                  <Mask
                    id={`${prefix}role-occlusion`}
                    testID="anatomical-role-occlusion-back"
                    maskUnits="userSpaceOnUse"
                    maskContentUnits="userSpaceOnUse"
                    maskType="luminance"
                    x={0}
                    y={0}
                    width={1312}
                    height={1199}
                  >
                    <Rect x={0} y={0} width={1312} height={1199} fill="white" />
                    {regions
                      .filter((r) => r.groupId === cutout.occluder)
                      .map((r) => (
                        <Path
                          key={r.id}
                          d={r.path}
                          transform={r.transform || undefined}
                          fill="black"
                        />
                      ))}
                  </Mask>
                ) : null}
                {anatomicalAtlas.clips.map((clip) => (
                  <Mask
                    key={clip.id}
                    id={`${prefix}${clip.id}`}
                    maskUnits="userSpaceOnUse"
                    maskContentUnits="userSpaceOnUse"
                    maskType="luminance"
                    x={0}
                    y={0}
                    width={1312}
                    height={1199}
                  >
                    <Image
                      href={clip.image}
                      x={0}
                      y={0}
                      width={1312}
                      height={1199}
                    />
                  </Mask>
                ))}
                {regions
                  .filter((r) => r.partitionPath)
                  .map((r) => (
                    <ClipPath key={r.id} id={`${prefix}${r.id}`}>
                      <Path d={r.partitionPath!} />
                    </ClipPath>
                  ))}
              </Defs>
              <Image
                href={source}
                x={0}
                y={0}
                width={1312}
                height={1199}
                pointerEvents="none"
              />
              {groups.map((group) => {
                const parts = regions.filter((r) => r.groupId === group.id);
                if (!parts.length) return null;
                const participation = muscles.find((m) => m.id === group.id);
                const primary = !!participation?.primary;
                const secondary = !primary && !!participation?.secondary;
                const fill = primary
                  ? colors.musclePrimary
                  : secondary
                    ? colors.muscleSecondary
                    : 'transparent';
                const opacity = primary
                  ? muscleMapPresentation.primaryOpacity
                  : secondary
                    ? muscleMapPresentation.secondaryOpacity
                    : 1;
                return (
                  <G
                    key={group.id}
                    testID={`anatomical-group-${view}-${group.id}`}
                    opacity={opacity}
                    mask={
                      view === 'back' && cutout?.occluded === group.id
                        ? `url(#${prefix}role-occlusion)`
                        : undefined
                    }
                  >
                    {parts.map((r) => (
                      <G
                        key={r.id}
                        mask={
                          r.clipId ? `url(#${prefix}${r.clipId})` : undefined
                        }
                      >
                        <Path
                          testID={`anatomical-region-${r.id}`}
                          d={r.path}
                          transform={r.transform || undefined}
                          clipPath={
                            r.partitionPath
                              ? `url(#${prefix}${r.id})`
                              : undefined
                          }
                          fill={fill}
                          stroke={
                            selected === group.id ? colors.textPrimary : 'none'
                          }
                          strokeWidth={
                            muscleMapPresentation.selectedStrokeWidth
                          }
                          onPress={
                            onSelect ? () => onSelect(group.id) : undefined
                          }
                        />
                      </G>
                    ))}
                  </G>
                );
              })}
            </Svg>
            <Text style={s.label}>
              {t(view === 'front' ? 'muscle.front' : 'muscle.back')}
            </Text>
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
