import {
  createThemedStyles,
  useAppColors,
} from '@/components/AppThemeProvider';
import {
  DirectionalIcon,
  LocalizedText as Text,
} from '@/components/LayoutDirection';
import { createContext, useContext } from 'react';
import { Platform, Pressable, View, useWindowDimensions } from 'react-native';
import { DEFAULT_GLASS_TRANSPARENCY, GlassMaterial } from './GlassMaterial';
import { useReducedTransparency } from './useReducedTransparency';
import { spacing, typography } from '@/lib/theme';
import { useBackSwipeAction, type BackSwipeAction } from './BackSwipe';
import { BrandWordmark } from './BrandWordmark';
import { useLocalization } from './LocalizationProvider';

export const HeaderTransparency = createContext(DEFAULT_GLASS_TRANSPARENCY);

export const HeaderBackdropProvided = createContext(false);

export type BrandBackAction = BackSwipeAction & {
  accessibilityLabel?: string;
  testID?: string;
};

export function BrandHeader({ back }: { back?: BrandBackAction } = {}) {
  useBackSwipeAction(back);
  const colors = useAppColors();
  const s = useStyles();
  const { t } = useLocalization();
  const { width, fontScale } = useWindowDimensions();
  const compact = width < 360 || fontScale >= 1.3;
  const backdropProvided = useContext(HeaderBackdropProvided);
  return (
    <View testID="brand-header" pointerEvents="box-none" style={s.root}>
      {backdropProvided ? null : <BrandHeaderBackdrop />}
      <BrandWordmark />
      <View
        pointerEvents="box-none"
        style={[s.taglineRow, back && (compact ? s.compactGutters : s.gutters)]}
      >
        <Text style={[s.tagline, back && s.taglineWithBack]}>
          {t('brand.tagline')}
        </Text>
        {back ? (
          <Pressable
            disabled={back.disabled}
            onPress={back.onPress}
            testID={back.testID}
            accessibilityRole="button"
            accessibilityLabel={back.accessibilityLabel ?? t('library.back')}
            accessibilityState={{ disabled: back.disabled ?? false }}
            style={({ pressed }) => [
              s.back,
              (pressed || back.disabled) && s.dim,
            ]}
          >
            <DirectionalIcon
              name="chevron-back"
              size={20}
              color={colors.primary}
              accessible={false}
            />
            {compact ? null : (
              <Text numberOfLines={1} style={s.backLabel}>
                {t('library.back')}
              </Text>
            )}
          </Pressable>
        ) : null}
      </View>
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

const useStyles = createThemedStyles((colors) => ({
  root: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.xxs,
  },
  taglineRow: { alignSelf: 'stretch', justifyContent: 'center' },
  gutters: { paddingHorizontal: 70 },
  compactGutters: { paddingHorizontal: 44 },
  back: {
    position: 'absolute',
    start: 0,
    top: '50%',
    transform: [{ translateY: -22 }],
    minHeight: 44,
    minWidth: 44,
    maxWidth: 70,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  backLabel: { ...typography.footnote, color: colors.primary, flexShrink: 1 },
  dim: { opacity: 0.5 },
  taglineWithBack: { fontSize: 11, letterSpacing: 0.3 },
  tagline: {
    ...typography.caption,
    letterSpacing: 1,
    textAlign: 'center',
    color: colors.textSecondary,
  },
}));
