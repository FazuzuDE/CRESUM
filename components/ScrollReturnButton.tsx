import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, cardShadow } from '@/lib/theme';
import type { ScrollReturn } from './useScrollReturn';

export function ScrollReturnButton({
  control,
  disabled = false,
}: {
  control: ScrollReturn;
  disabled?: boolean;
}) {
  if (!control.visible || disabled) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        control.toTop ? 'Back to page top' : 'Back to section start'
      }
      accessibilityHint="First tap goes to the current section; the next goes to the page top"
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
