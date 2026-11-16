import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/lib/theme';

export function AppButton({
  title,
  accessibilityLabel,
  detail,
  highlighted = false,
  onPress,
  secondary = false,
  disabled = false,
  selected,
  destructive = false,
  presentation = 'button',
  wordmark = false,
}: {
  title: string;
  accessibilityLabel?: string;
  detail?: string;
  highlighted?: boolean;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  selected?: boolean;
  destructive?: boolean;
  presentation?: 'button' | 'row' | 'text' | 'choice';
  wordmark?: boolean;
}) {
  const schedule = presentation === 'row' && !!detail;
  const choice = presentation === 'choice';
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
        (presentation === 'row' || choice) && s.row,
        schedule && s.schedule,
        choice && s.choice,
        choice && (selected || highlighted) && s.highlighted,
        presentation === 'text' && s.textAction,
        (pressed || disabled) && s.dim,
      ]}
    >
      <View
        style={
          choice
            ? s.choiceContent
            : presentation === 'row'
              ? s.rowContent
              : undefined
        }
      >
        <Text
          style={[
            s.text,
            secondary && s.secondaryText,
            destructive && s.destructiveText,
            presentation === 'row' && s.rowText,
            schedule && s.detail,
            choice && s.choiceTitle,
            presentation === 'text' && s.actionText,
            presentation === 'text' && !destructive && s.linkText,
            wordmark && s.wordmark,
          ]}
        >
          {title}
        </Text>
        {detail ? (
          <Text style={schedule ? s.scheduleFocus : s.detail}>{detail}</Text>
        ) : null}
      </View>
      {choice && selected !== undefined ? (
        <Ionicons
          name={selected ? 'radio-button-on' : 'radio-button-off'}
          size={24}
          color={selected ? colors.primary : colors.textSecondary}
          accessible={false}
        />
      ) : null}
      {presentation === 'row' ||
      (choice && selected === undefined && detail) ? (
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
  text: {
    ...typography.headline,
    color: colors.surface,
    textAlign: 'center',
    maxWidth: '100%',
  },
  secondaryText: { color: colors.textPrimary },
  destructiveText: { color: colors.danger },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  schedule: { backgroundColor: colors.surface, borderRadius: 0 },
  rowContent: { flex: 1, minWidth: 0 },
  rowText: { ...typography.body, textAlign: 'left' },
  choice: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.separator,
    minHeight: 52,
  },
  highlighted: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  choiceContent: { flex: 1, minWidth: 0, gap: spacing.xxs },
  choiceTitle: { color: colors.textPrimary, textAlign: 'left' },
  detail: { ...typography.footnote, color: colors.textSecondary },
  scheduleFocus: { ...typography.headline, color: colors.textPrimary },
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
  wordmark: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 4,
    color: colors.textPrimary,
  },
});
