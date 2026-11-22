import {
  createThemedStyles,
  useAppColors,
} from '@/components/AppThemeProvider';
import { LocalizedText as Text } from '@/components/LayoutDirection';
import { useId, useState } from 'react';
import { useLocalization } from './LocalizationProvider';
import { Image as AtlasImage, View } from 'react-native';
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
import { spacing, typography, muscleMapPresentation } from '@/lib/theme';

const views = ['front', 'back'] as const;
const [sourceWidth, sourceHeight] = anatomicalAtlas.canvas;
const [left, top, frontWidth, atlasHeight] =
  anatomicalAtlas.views.front.viewBox;
const atlasWidth = frontWidth + anatomicalAtlas.views.back.viewBox[2];
const atlasAspect = atlasWidth / atlasHeight;
const regions = anatomicalRegions.filter((region) => region.groupId !== null);

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
  const colors = useAppColors();
  const s = useStyles();
  const { t } = useLocalization();
  const instance = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [ready, setReady] = useState(false);
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
  const prefix = `anatomy${instance}`;
  // The native Image reports readiness for both fresh and cached artwork.
  return (
    <View style={[s.atlas, { maxWidth: height * atlasAspect }]}>
      <View style={s.canvas} pointerEvents={ready ? 'auto' : 'none'}>
        <AtlasImage
          source={source}
          accessible={false}
          fadeDuration={0}
          resizeMode="stretch"
          onLoad={() => setReady(true)}
          style={[s.source, !ready && s.loading]}
        />
        <Svg
          width="100%"
          height="100%"
          viewBox={`${left} ${top} ${atlasWidth} ${atlasHeight}`}
          preserveAspectRatio="none"
          accessible={false}
          opacity={ready ? 1 : 0}
        >
          <Defs>
            {cutout ? (
              <Mask
                id={`${prefix}role-occlusion`}
                testID="anatomical-role-occlusion-back"
                maskUnits="userSpaceOnUse"
                maskContentUnits="userSpaceOnUse"
                maskType="luminance"
                x={0}
                y={0}
                width={sourceWidth}
                height={sourceHeight}
              >
                <Rect
                  x={0}
                  y={0}
                  width={sourceWidth}
                  height={sourceHeight}
                  fill="white"
                />
                {regions
                  .filter(
                    (r) => r.view === 'back' && r.groupId === cutout.occluder,
                  )
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
                width={sourceWidth}
                height={sourceHeight}
              >
                <Image
                  href={clip.image}
                  x={0}
                  y={0}
                  width={sourceWidth}
                  height={sourceHeight}
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
          {views.map((view) => (
            <G key={view}>
              {groups.map((group) => {
                const parts = regions.filter(
                  (r) => r.view === view && r.groupId === group.id,
                );
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
                          onPress={
                            onSelect ? () => onSelect(group.id) : undefined
                          }
                        />
                      </G>
                    ))}
                  </G>
                );
              })}
            </G>
          ))}
          {selected
            ? regions
                .filter((region) => region.groupId === selected)
                .map((region) => (
                  <G
                    key={region.id}
                    mask={
                      region.clipId
                        ? `url(#${prefix}${region.clipId})`
                        : undefined
                    }
                    pointerEvents="none"
                  >
                    <Path
                      testID={`anatomical-selection-${region.id}`}
                      d={region.path}
                      transform={region.transform || undefined}
                      clipPath={
                        region.partitionPath
                          ? `url(#${prefix}${region.id})`
                          : undefined
                      }
                      fill="none"
                      stroke={colors.musclePrimaryShade}
                      strokeWidth={muscleMapPresentation.selectedStrokeWidth}
                    />
                  </G>
                ))
            : null}
        </Svg>
      </View>
      <View style={s.row}>
        {views.map((view) => (
          <Text key={view} style={s.label}>
            {t(view === 'front' ? 'muscle.front' : 'muscle.back')}
          </Text>
        ))}
      </View>
    </View>
  );
}
const useStyles = createThemedStyles((colors) => ({
  atlas: { alignSelf: 'center', width: '100%' },
  canvas: {
    width: '100%',
    aspectRatio: atlasAspect,
    direction: 'ltr',
    overflow: 'hidden',
  },
  source: {
    position: 'absolute',
    left: `${(-left / atlasWidth) * 100}%`,
    top: `${(-top / atlasHeight) * 100}%`,
    width: `${(sourceWidth / atlasWidth) * 100}%`,
    height: `${(sourceHeight / atlasHeight) * 100}%`,
  },
  loading: { opacity: 0 },
  row: { flexDirection: 'row', paddingTop: spacing.xxs },
  label: {
    flex: 1,
    ...typography.footnote,
    color: colors.textSecondary,
    textAlign: 'center',
  },
}));
