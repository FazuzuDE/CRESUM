import {
  DirectionalIcon,
  LocalizedText as Text,
} from '@/components/LayoutDirection';
import { createContext, useContext } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { DEFAULT_GLASS_TRANSPARENCY, GlassMaterial } from './GlassMaterial';
import { useReducedTransparency } from './useReducedTransparency';
import { brand, colors, spacing, typography } from '@/lib/theme';
import { BrandWordmark } from './BrandWordmark';
import { useLocalization } from './LocalizationProvider';

export const HeaderTransparency = createContext(DEFAULT_GLASS_TRANSPARENCY);

export const HeaderBackdropProvided = createContext(false);

export type BrandBackAction = {
  onPress: () => void;
  accessibilityLabel?: string;
  disabled?: boolean;
  testID?: string;
};

export function BrandHeader({ back }: { back?: BrandBackAction } = {}) {
  const { t } = useLocalization();
  const backdropProvided = useContext(HeaderBackdropProvided);
  return (
    <View testID="brand-header" pointerEvents="box-none" style={s.root}>
      {backdropProvided ? null : <BrandHeaderBackdrop />}
      {back ? (
        <Pressable
          {...back}
          accessibilityRole="button"
          accessibilityLabel={back.accessibilityLabel ?? t('library.back')}
          accessibilityState={{ disabled: back.disabled ?? false }}
          style={({ pressed }) => [s.back, (pressed || back.disabled) && s.dim]}
        >
          <DirectionalIcon
            name="chevron-back"
            size={20}
            color={colors.primary}
            accessible={false}
          />
          <Text numberOfLines={1} style={s.backLabel}>
            {t('library.back')}
          </Text>
        </Pressable>
      ) : null}
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
  back: {
    position: 'absolute',
    start: spacing.xs,
    top: spacing.sm + (brand.wordmarkHeight - 44) / 2,
    minHeight: 44,
    minWidth: 44,
    maxWidth: '27%',
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  backLabel: { ...typography.footnote, color: colors.primary, flexShrink: 1 },
  dim: { opacity: 0.5 },
  tagline: {
    ...typography.caption,
    letterSpacing: 1,
    textAlign: 'center',
    color: colors.textSecondary,
  },
});
