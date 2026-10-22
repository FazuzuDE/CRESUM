import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { calendarTime } from '@/lib/picker-date';
import { colors, radius, spacing, typography } from '@/lib/theme';
import { useLocalization } from './LocalizationProvider';
import { formatDate } from '@/lib/i18n/format';

export function CalendarMonth({
  month,
  selected,
  now,
  counts,
  onMonth,
  onSelect,
}: {
  month: number;
  selected: number;
  now: number;
  counts: Record<number, number>;
  onMonth: (time: number) => void;
  onSelect: (time: number) => void;
}) {
  const { t, locale } = useLocalization();
  const date = new Date(month),
    year = date.getFullYear(),
    m = date.getMonth();
  const days = new Date(calendarTime(year, m + 1, 0)).getDate();
  const offset = (new Date(calendarTime(year, m, 1)).getDay() + 6) % 7;
  return (
    <View style={s.calendar}>
      <View style={s.navigation}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('calendar.previous')}
          disabled={year === 1 && m === 0}
          accessibilityState={{ disabled: year === 1 && m === 0 }}
          onPress={() => onMonth(calendarTime(year, m - 1, 1))}
          style={s.arrow}
        >
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>
        <Text accessibilityRole="header" style={s.heading}>
          {formatDate(locale, month, {
            month: 'long',
            year: 'numeric',
          })}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('calendar.next')}
          disabled={year === 9999 && m === 11}
          accessibilityState={{ disabled: year === 9999 && m === 11 }}
          onPress={() => onMonth(calendarTime(year, m + 1, 1))}
          style={s.arrow}
        >
          <Ionicons name="chevron-forward" size={22} color={colors.primary} />
        </Pressable>
      </View>
      <View style={s.grid}>
        {Array.from({ length: 7 }, (_, index) => (
          <Text key={index} style={s.weekday}>
            {formatDate(locale, calendarTime(2026, 0, 5 + index), {
              weekday: 'short',
            })}
          </Text>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <View key={`blank-${i}`} style={s.cell} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const time = calendarTime(year, m, i + 1),
            count = counts[time] ?? 0;
          const today =
            new Date(time).toDateString() === new Date(now).toDateString();
          const chosen =
            new Date(time).toDateString() === new Date(selected).toDateString();
          return (
            <Pressable
              key={time}
              accessibilityRole="button"
              accessibilityState={{ selected: chosen }}
              accessibilityLabel={t(today ? 'home.dayToday' : 'home.day', {
                date: formatDate(locale, time, { dateStyle: 'full' }),
                completed: t('home.completed', { count }),
              })}
              onPress={() => onSelect(time)}
              style={[s.cell, chosen && s.selected]}
            >
              <View
                style={[s.marker, count > 0 && s.completed, today && s.today]}
              >
                <Text style={[s.day, count > 0 && s.completedText]}>
                  {i + 1}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <Text style={s.context}>{t('calendar.legend')}</Text>
    </View>
  );
}
const s = StyleSheet.create({
  calendar: { gap: spacing.sm },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  heading: {
    ...typography.title3,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  arrow: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    ...typography.caption,
    color: colors.textSecondary,
    paddingVertical: spacing.xs,
  },
  cell: {
    width: `${100 / 7}%`,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    paddingVertical: spacing.xxs,
  },
  marker: {
    width: 36,
    minHeight: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxs,
  },
  selected: { backgroundColor: colors.primaryTint },
  completed: { backgroundColor: colors.primary },
  today: { borderWidth: 2, borderColor: colors.primary },
  day: {
    ...typography.body,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  completedText: { color: colors.surface },
  context: { ...typography.footnote, color: colors.textSecondary },
});
