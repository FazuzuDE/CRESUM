import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from './AppButton';
import { colors, radius, spacing, typography } from '@/lib/theme';

export function HistoryDatePicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (time: number) => void;
}) {
  const [month, setMonth] = useState(() => new Date(value).setDate(1));
  const date = new Date(month);
  const year = date.getFullYear();
  const m = date.getMonth();
  const days = new Date(year, m + 1, 0).getDate();
  const offset = (date.getDay() + 6) % 7;
  const shift = (amount: number) =>
    setMonth(new Date(year, m + amount, 1).getTime());
  return (
    <View style={s.calendar}>
      <Text style={s.heading}>
        {date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
      </Text>
      <View style={s.navigation}>
        <AppButton
          title="Previous month"
          secondary
          disabled={year <= 1 && m === 0}
          onPress={() => shift(-1)}
        />
        <AppButton
          title="Next month"
          secondary
          disabled={year >= 9999 && m === 11}
          onPress={() => shift(1)}
        />
      </View>
      <View style={s.grid}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <Text key={day} style={s.weekday}>
            {day}
          </Text>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <View key={`blank-${i}`} style={s.cell} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const time = new Date(year, m, i + 1).getTime();
          const selected =
            new Date(value).toDateString() === new Date(time).toDateString();
          return (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={new Date(time).toLocaleDateString(undefined, {
                dateStyle: 'full',
              })}
              accessibilityState={{ selected }}
              onPress={() => onChange(time)}
              style={[s.cell, selected && s.selected]}
            >
              <Text style={[s.day, selected && s.selectedText]}>{i + 1}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  calendar: { gap: spacing.md },
  heading: { ...typography.title3, color: colors.textPrimary },
  navigation: { gap: spacing.xs },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.sm,
  },
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
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  selected: { backgroundColor: colors.primary },
  day: { ...typography.body, color: colors.textPrimary },
  selectedText: { color: colors.surface },
});
