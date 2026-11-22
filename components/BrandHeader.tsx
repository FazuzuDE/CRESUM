import { LocalizedText as Text } from '@/components/LayoutDirection';
import { createContext, useContext } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { DEFAULT_GLASS_TRANSPARENCY, GlassMaterial } from './GlassMaterial';
import { useReducedTransparency } from './useReducedTransparency';
import { colors, spacing, typography } from '@/lib/theme';
import { BrandWordmark } from './BrandWordmark';
import { useLocalization } from './LocalizationProvider';

export const HeaderTransparency = createContext(DEFAULT_GLASS_TRANSPARENCY);

export function BrandHeader() {
  const { t } = useLocalization();
  const transparency = useContext(HeaderTransparency);
  const reduced = useReducedTransparency();
  return (
    <View testID="brand-header" style={s.root}>
      <GlassMaterial
        borderRadius={0}
        solid={Platform.OS === 'ios' && reduced}
        transparency={transparency}
      />
      <BrandWordmark />
      <Text style={s.tagline}>{t('brand.tagline')}</Text>
    </View>
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
