import { BlurView } from 'expo-blur';
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import { Platform, StyleSheet, View } from 'react-native';
import { colors } from '@/lib/theme';

export const DEFAULT_GLASS_TRANSPARENCY = 66;

export function GlassMaterial({
  borderRadius,
  solid,
  transparency = DEFAULT_GLASS_TRANSPARENCY,
}: {
  borderRadius: number;
  solid: boolean;
  transparency?: number;
}) {
  const translucent = Platform.OS === 'ios' && !solid;
  const nativeGlass =
    translucent && isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
  const clarity = transparency / 100;
  const opacity = solid ? 1 : 1 - clarity * (translucent ? 1 : 0.92);
  const bounds = [s.bounds, { borderRadius }];

  return (
    <>
      {nativeGlass ? (
        <GlassView
          pointerEvents="none"
          glassEffectStyle="clear"
          colorScheme="light"
          style={bounds}
        />
      ) : translucent ? (
        <BlurView
          pointerEvents="none"
          intensity={Math.round(84 - clarity * 48)}
          tint="light"
          style={bounds}
        />
      ) : null}
      <View pointerEvents="none" style={[bounds, s.tint, { opacity }]} />
      <View pointerEvents="none" style={[bounds, s.edge]} />
    </>
  );
}

const s = StyleSheet.create({
  bounds: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  tint: { backgroundColor: colors.surface },
  edge: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
  },
});
