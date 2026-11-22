import { LocalizedText as Text } from '@/components/LayoutDirection';
import { createContext, useContext } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { DEFAULT_GLASS_TRANSPARENCY } from './GlassMaterial';
import { useReducedTransparency } from './useReducedTransparency';
import { colors, spacing, typography } from '@/lib/theme';
import { BrandWordmark } from './BrandWordmark';
import { useLocalization } from './LocalizationProvider';

export const HeaderTransparency = createContext(DEFAULT_GLASS_TRANSPARENCY);

export const HeaderBackdropProvided = createContext(false);

export function BrandHeader() {
  const { t } = useLocalization();
  const backdropProvided = useContext(HeaderBackdropProvided);
  return (
    <View testID="brand-header" style={s.root}>
      {backdropProvided ? null : <BrandHeaderBackdrop />}
      <BrandWordmark />
      <Text style={s.tagline}>{t('brand.tagline')}</Text>
    </View>
  );
}
export function BrandHeaderBackdrop() {
  const transparency = useContext(HeaderTransparency);
  const reduced = useReducedTransparency();
  const ios = Platform.OS === 'ios';
  const opacity =
    ios && reduced ? 1 : 1 - (transparency / 100) * (ios ? 1 : 0.92);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {ios && !reduced && opacity > 0 ? (
        <BlurView
          testID="brand-header-blur"
          tint="light"
          intensity={Math.round(36 * opacity)}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <HeaderGradient color={colors.surface} opacity={opacity} />
    </View>
  );
}

function HeaderGradient({
  color,
  opacity,
}: {
  color: string;
  opacity: number;
}) {
  return (
    <Svg width="100%" height="100%">
      <Defs>
        <LinearGradient id="headerFade" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
          <Stop offset="72%" stopColor={color} stopOpacity={opacity} />
          <Stop offset="90%" stopColor={color} stopOpacity={opacity * 0.35} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#headerFade)" />
    </Svg>
  );
}

const s = StyleSheet.create({
  root: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xxs,
  },
  tagline: {
    ...typography.caption,
    letterSpacing: 1,
    textAlign: 'center',
    color: colors.textSecondary,
  },
});
