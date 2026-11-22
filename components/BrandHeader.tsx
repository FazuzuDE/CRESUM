import { LocalizedText as Text } from '@/components/LayoutDirection';
import { createContext, useContext } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { DEFAULT_GLASS_TRANSPARENCY, GlassMaterial } from './GlassMaterial';
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
  return (
    <GlassMaterial
      borderRadius={0}
      solid={transparency === 0 || (Platform.OS === 'ios' && reduced)}
      transparency={transparency}
    />
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
