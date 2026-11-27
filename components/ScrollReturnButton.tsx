import {
  createThemedStyles,
  useAppColors,
} from '@/components/AppThemeProvider';
import { DirectionalIcon as Ionicons } from '@/components/LayoutDirection';
import { createContext, useContext } from 'react';
import { Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassMaterial, DEFAULT_GLASS_TRANSPARENCY } from './GlassMaterial';
import { useReducedTransparency } from './useReducedTransparency';
import { radius, spacing, cardShadow } from '@/lib/theme';
import type { ScrollReturn } from './useScrollReturn';
import { useLocalization } from './LocalizationProvider';

export const ScrollReturnTransparency = createContext(
  DEFAULT_GLASS_TRANSPARENCY,
);

export function ScrollReturnButton({
  control,
  disabled = false,
  bottomOverlay = 0,
  safeAreaBottom = false,
}: {
  control: ScrollReturn;
  disabled?: boolean;
  bottomOverlay?: number;
  safeAreaBottom?: boolean;
}) {
  const colors = useAppColors();
  const s = useStyles();
  const { t } = useLocalization();
  const transparency = useContext(ScrollReturnTransparency);
  const reduceTransparency = useReducedTransparency(
    control.visible && !disabled,
  );
  if (!control.visible || disabled) return null;
  return (
    <SafeAreaView
      pointerEvents="box-none"
      edges={safeAreaBottom ? ['bottom'] : []}
      style={[s.anchor, { bottom: spacing.sm + bottomOverlay }]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          control.toTop ? t('scroll.top') : t('scroll.section')
        }
        accessibilityHint={t('scroll.hint')}
        style={({ pressed }) => [s.up, pressed && s.pressed]}
        onPress={control.jump}
      >
        <GlassMaterial
          borderRadius={radius.pill}
          transparency={transparency}
          solid={Platform.OS === 'ios' && reduceTransparency}
        />
        <Ionicons
          name="arrow-up"
          size={24}
          color={colors.textPrimary}
          accessible={false}
        />
      </Pressable>
    </SafeAreaView>
  );
}
const useStyles = createThemedStyles(() => ({
  anchor: { position: 'absolute', right: spacing.md },
  up: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },
  pressed: { opacity: 0.6 },
}));
