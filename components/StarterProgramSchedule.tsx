import { Pressable, View } from 'react-native';
import { createThemedStyles, useAppColors } from './AppThemeProvider';
import {
  DirectionalIcon as Icon,
  LocalizedText as Text,
} from './LayoutDirection';
import { useLocalization } from './LocalizationProvider';
import { formatDate, formatNumber } from '@/lib/i18n/format';
import { weekdayOffset } from '@/lib/training-programs/schedule';
import { radius, spacing, typography } from '@/lib/theme';

const weekdays = Array.from({ length: 7 }, (_, i) => i);
const weekdayDate = (index: number) =>
  new Date(2026, 0, 5 + index, 12).getTime();

export function StarterProgramSchedule({
  today,
  selected,
  disabled,
  changesDisabled,
  saving,
  onToggle,
  onDone,
}: {
  today: Date;
  selected: readonly number[];
  disabled: boolean;
  changesDisabled: boolean;
  saving: boolean;
  onToggle: (day: number) => void;
  onDone: () => void;
}) {
  const s = useStyles();
  const colors = useAppColors();
  const { t, locale } = useLocalization();
  const weekday = (i: number, style: 'short' | 'narrow' | 'long') =>
    formatDate(locale, weekdayDate(i), { weekday: style });
  const valid = selected.length === 3;
  const months = [0, 1].map(
    (offset) => new Date(today.getFullYear(), today.getMonth() + offset, 1, 12),
  );
  return (
    <View style={s.container}>
      <Text style={s.title} accessibilityRole="header">
        {t('onboarding.configureSchedule')}
      </Text>
      <Text style={s.meta}>{t('onboarding.chooseWeekdays')}</Text>
      <View style={s.weekdays}>
        {weekdays.map((day) => {
          const checked = selected.includes(day);
          const unavailable =
            disabled || changesDisabled || (valid && !checked);
          return (
            <Pressable
              key={day}
              testID={`program-weekday-${day}`}
              accessibilityRole="checkbox"
              accessibilityLabel={weekday(day, 'long')}
              accessibilityState={{ checked, disabled: unavailable }}
              disabled={unavailable}
              onPress={() => onToggle(day)}
              style={s.weekdayButton}
            >
              <View style={[s.circle, checked && s.circleSelected]}>
                <Text style={[s.circleLabel, checked && s.circleLabelSelected]}>
                  {weekday(day, 'short')}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={s.months}>
        {months.map((month) => {
          const first = weekdayOffset(month);
          const count = new Date(
            month.getFullYear(),
            month.getMonth() + 1,
            0,
            12,
          ).getDate();
          return (
            <View key={month.getTime()} style={s.month}>
              <Text style={s.monthTitle} accessibilityRole="header">
                {formatDate(locale, month.getTime(), {
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
              <View style={s.grid}>
                {weekdays.map((day) => (
                  <View key={`heading-${day}`} style={s.day}>
                    <Text style={s.dayText}>{weekday(day, 'narrow')}</Text>
                  </View>
                ))}
                {Array.from({ length: 42 }, (_, i) => {
                  const day = i - first + 1;
                  const visible = day > 0 && day <= count;
                  const checked = visible && selected.includes(i % 7);
                  return (
                    <View
                      key={i}
                      testID={
                        visible
                          ? `program-date-${month.getFullYear()}-${month.getMonth() + 1}-${day}`
                          : undefined
                      }
                      accessible={visible}
                      accessibilityLabel={
                        visible
                          ? formatDate(
                              locale,
                              new Date(
                                month.getFullYear(),
                                month.getMonth(),
                                day,
                                12,
                              ).getTime(),
                              { dateStyle: 'full' },
                            )
                          : undefined
                      }
                      accessibilityState={
                        visible ? { selected: checked } : undefined
                      }
                      style={[s.day, checked && s.highlight]}
                    >
                      {visible ? (
                        <Text style={[s.dayText, checked && s.highlightText]}>
                          {formatNumber(locale, day)}
                        </Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={saving ? t('onboarding.saving') : t('common.done')}
        accessibilityState={{ disabled: !valid || disabled, busy: saving }}
        disabled={!valid || disabled}
        onPress={onDone}
        style={({ pressed }) => [
          s.done,
          (!valid || pressed || disabled) && s.dim,
        ]}
      >
        <Icon
          name="checkmark-circle"
          color={colors.success}
          size={42}
          accessible={false}
        />
        <Text style={s.doneText}>
          {saving ? t('onboarding.saving') : t('common.done')}
        </Text>
      </Pressable>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  container: { gap: spacing.md },
  title: { ...typography.title2, color: colors.textPrimary },
  meta: { ...typography.subheadline, color: colors.textSecondary },
  weekdays: { flexDirection: 'row', alignItems: 'center' },
  weekdayButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: '92%',
    maxWidth: 44,
    aspectRatio: 1,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  circleSelected: { backgroundColor: colors.primaryTint },
  circleLabel: {
    ...typography.caption,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  circleLabelSelected: { color: colors.textPrimary, fontWeight: '700' },
  months: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.xs,
    direction: 'ltr',
  },
  month: {
    flex: 1,
    minWidth: 0,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xxs,
    gap: spacing.xxs,
  },
  monthTitle: {
    ...typography.footnote,
    color: colors.textPrimary,
    textAlign: 'center',
    fontWeight: '600',
    minHeight: 32,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  day: {
    width: '14.28%',
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  dayText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  highlight: { backgroundColor: colors.primaryTint },
  highlightText: { color: colors.textPrimary, fontWeight: '700' },
  done: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
    minHeight: 56,
    minWidth: 80,
  },
  doneText: {
    ...typography.subheadline,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  dim: { opacity: 0.5 },
}));
