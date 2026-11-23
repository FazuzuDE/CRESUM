import { View, type DimensionValue } from 'react-native';
import { BrandWordmark } from './BrandWordmark';

const artworkPlacements: Readonly<
  Record<string, { centerX: number; centerY: number; width: number }>
> = {
  'treadmill-walking': { centerX: 43.8, centerY: 91.15, width: 15 },
  'upright-stationary-bike': { centerX: 60, centerY: 82.7, width: 15 },
};

const aspect = 182 / 24;
const percent = (value: number): DimensionValue => `${value}%`;

export function ExerciseArtworkWordmark({ imageKey }: { imageKey: string }) {
  const placement = artworkPlacements[imageKey];
  if (!placement) return null;
  const { centerX, centerY, width } = placement;
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        position: 'absolute',
        left: percent(centerX - width / 2),
        top: percent(centerY - width / aspect / 2),
        width: percent(width),
        aspectRatio: aspect,
      }}
    >
      <BrandWordmark width="100%" height="100%" color="#D5D9DC" />
    </View>
  );
}
