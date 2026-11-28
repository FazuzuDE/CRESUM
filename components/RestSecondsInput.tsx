import { View } from 'react-native';
import { createThemedStyles } from './AppThemeProvider';
import {
  LocalizedText as Text,
  LocalizedTextInput as TextInput,
} from './LayoutDirection';
import { useLocalization } from './LocalizationProvider';
import { normalizeInputDigits } from '@/lib/i18n/format';
import { validRestSeconds } from '@/lib/planned-exercise';
import { radius, spacing, typography } from '@/lib/theme';

export function parseOptionalRest(raw: string): number | undefined | null {
  const value = normalizeInputDigits(raw).trim();
  if (!value) return undefined;
  const seconds = Number(value);
  return /^\d+$/.test(value) && validRestSeconds(seconds) ? seconds : null;
}

export function RestSecondsInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const s = useStyles();
  const { t } = useLocalization();
  const invalid = parseOptionalRest(value) === null;
  const hint = t('workout.restSecondsHint');
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        editable={!disabled}
        keyboardType="number-pad"
        style={s.input}
      />
      {invalid ? (
        <Text accessibilityRole="alert" style={s.error}>
          {hint}
        </Text>
      ) : (
        <Text style={s.hint}>{hint}</Text>
      )}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  field: { gap: spacing.xs },
  label: { ...typography.body, color: colors.textPrimary },
  input: {
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.separator,
    padding: spacing.sm,
    minHeight: 44,
    ...typography.body,
  },
  hint: { ...typography.caption, color: colors.textSecondary },
  error: { ...typography.caption, color: colors.danger },
}));
