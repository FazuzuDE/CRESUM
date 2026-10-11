import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/lib/theme';

export function AppButton({
  title,
  accessibilityLabel,
  onPress,
  secondary = false,
  disabled = false,
  selected,
  destructive = false,
  presentation = 'button',
}: {
  title: string;
  accessibilityLabel?: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  selected?: boolean;
  destructive?: boolean;
  presentation?: 'button' | 'row' | 'text';
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{
        disabled,
        ...(selected === undefined ? {} : { selected }),
      }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        destructive && s.destructive,
        presentation === 'row' && s.row,
        presentation === 'text' && s.textAction,
        (pressed || disabled) && s.dim,
      ]}
    >
      <Text
        style={[
          s.text,
          secondary && s.secondaryText,
          destructive && s.destructiveText,
          presentation === 'row' && s.rowText,
          presentation === 'text' && s.actionText,
          presentation === 'text' && !destructive && s.linkText,
        ]}
      >
        {title}
      </Text>
      {presentation === 'row' ? (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.primary}
          accessible={false}
        />
      ) : null}
    </Pressable>
  );
}
const s = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  secondary: { backgroundColor: colors.surfaceSubtle },
  destructive: { backgroundColor: colors.surfaceSubtle },
  text: { ...typography.headline, color: colors.surface, textAlign: 'center' },
  secondaryText: { color: colors.textPrimary },
  destructiveText: { color: colors.danger },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rowText: { ...typography.body, flex: 1, textAlign: 'left' },
  textAction: {
    minHeight: 44,
    paddingHorizontal: 0,
    paddingVertical: spacing.xs,
    backgroundColor: 'transparent',
    alignItems: 'flex-start',
  },
  actionText: { ...typography.body, textAlign: 'left' },
  linkText: { color: colors.primary },
  dim: { opacity: 0.6 },
});
