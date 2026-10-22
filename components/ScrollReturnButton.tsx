import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, cardShadow } from '@/lib/theme';
import type { ScrollReturn } from './useScrollReturn';
import { useLocalization } from './LocalizationProvider';

export function ScrollReturnButton({
  control,
  disabled = false,
}: {
  control: ScrollReturn;
  disabled?: boolean;
}) {
  const { t } = useLocalization();
  if (!control.visible || disabled) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={control.toTop ? t('scroll.top') : t('scroll.section')}
      accessibilityHint={t('scroll.hint')}
      style={({ pressed }) => [s.up, pressed && s.pressed]}
      onPress={control.jump}
    >
      <Ionicons
        name="arrow-up"
        size={24}
        color={colors.textPrimary}
        accessible={false}
      />
    </Pressable>
  );
}
const s = StyleSheet.create({
  up: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.sm,
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },
  pressed: { opacity: 0.6 },
});
