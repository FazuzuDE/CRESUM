import { useState } from 'react';
import { Modal, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppScrollView } from './AppScrollView';
import { AppButton } from './AppButton';
import { CalendarMonth } from './CalendarMonth';
import { GlassCard } from './GlassCard';
import { calendarTime } from '@/lib/picker-date';
import { volume } from '@/lib/workout-metrics';
import type { WorkoutSession } from '@/lib/workout-model';
import { colors, spacing, typography } from '@/lib/theme';

export function HomeCalendar({
  history,
  now,
  onClose,
}: {
  history: WorkoutSession[];
  now: number;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState(() => {
    const d = new Date(now);
    return calendarTime(d.getFullYear(), d.getMonth(), d.getDate());
  });
  const [month, setMonth] = useState(() => {
    const d = new Date(now);
    return calendarTime(d.getFullYear(), d.getMonth(), 1);
  });
  const saved = history.filter(
    (s) => Number.isFinite(s.finishedAt) && s.finishedAt! <= now,
  );
  const counts: Record<number, number> = {};
  const localDay = (time: number) => {
    const d = new Date(time);
    return calendarTime(d.getFullYear(), d.getMonth(), d.getDate());
  };
  saved.forEach((s) => {
    const day = localDay(s.finishedAt!);
    counts[day] = (counts[day] ?? 0) + 1;
  });
  const sessions = saved
    .filter((s) => localDay(s.finishedAt!) === selected)
    .sort((a, b) => a.finishedAt! - b.finishedAt!);
  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={s.root}>
        <AppScrollView contentContainerStyle={s.content}>
          <Text accessibilityRole="header" style={s.title}>
            Calendar
          </Text>
          <AppButton
            title="Close calendar"
            secondary
            presentation="text"
            onPress={onClose}
          />
          <GlassCard>
            <CalendarMonth
              month={month}
              selected={selected}
              now={now}
              counts={counts}
              onSelect={setSelected}
              onMonth={(time) => {
                setMonth(time);
                setSelected(time);
              }}
            />
          </GlassCard>
          <Text accessibilityRole="header" style={s.date}>
            {new Date(selected).toLocaleDateString(undefined, {
              dateStyle: 'full',
            })}
          </Text>
          {sessions.length ? (
            sessions.map((session) => (
              <GlassCard key={session.id}>
                <Text style={s.name}>{session.name}</Text>
                <Text style={s.context}>
                  {new Date(session.finishedAt!).toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  · {volume(session).toLocaleString()} kg volume
                </Text>
              </GlassCard>
            ))
          ) : (
            <Text style={s.context}>No completed workouts on this date.</Text>
          )}
        </AppScrollView>
      </SafeAreaView>
    </Modal>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.lg },
  title: { ...typography.largeTitle, color: colors.textPrimary },
  date: { ...typography.headline, color: colors.textPrimary },
  name: { ...typography.title3, color: colors.textPrimary },
  context: { ...typography.footnote, color: colors.textSecondary },
});
