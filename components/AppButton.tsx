import {
  LocalizedText as Text,
  DirectionalIcon as Ionicons,
} from '@/components/LayoutDirection';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, spacing, typography } from '@/lib/theme';

export function AppButton({
  title,
  accessibilityLabel,
  detail,
  icon,
  value,
  highlighted = false,
  onPress,
  secondary = false,
  disabled = false,
  dimWhenDisabled = true,
  selected,
  destructive = false,
  presentation = 'button',
  wordmark = false,
}: {
  title: string;
  accessibilityLabel?: string;
  detail?: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
  value?: string;
  highlighted?: boolean;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  dimWhenDisabled?: boolean;
  selected?: boolean;
  destructive?: boolean;
  presentation?: 'button' | 'row' | 'text' | 'choice' | 'settings';
  wordmark?: boolean;
}) {
  const schedule = presentation === 'row' && !!detail;
  const settings = presentation === 'settings';
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
        (presentation === 'row' || choice || settings) && s.row,
        settings && s.settings,
        schedule && s.schedule,
        choice && s.choice,
        choice && (selected || highlighted) && s.highlighted,
        presentation === 'text' && s.textAction,
        (pressed || (disabled && dimWhenDisabled)) && s.dim,
      ]}
    >
      {settings && icon ? (
        <Ionicons
          name={icon}
          size={22}
          color={colors.textPrimary}
          accessible={false}
        />
      ) : null}
      <View
        style={
          choice
            ? s.choiceContent
            : presentation === 'row' || settings
              ? s.rowContent
              : undefined
        }
      >
        <Text
          style={[
            s.text,
            secondary && s.secondaryText,
            destructive && s.destructiveText,
            (presentation === 'row' || settings) && s.rowText,
            settings && s.settingsTitle,
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
      {settings && value ? <Text style={s.settingsValue}>{value}</Text> : null}
      {settings ||
      presentation === 'row' ||
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
  settings: {
    minHeight: 52,
    borderRadius: 0,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  settingsTitle: { color: colors.textPrimary, fontWeight: '500' },
  settingsValue: {
    ...typography.footnote,
    color: colors.textSecondary,
    flexShrink: 1,
    maxWidth: '38%',
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
