import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GlassCard } from './GlassCard';
import { AppButton } from './AppButton';
import type { ProgramAssignment } from '@/lib/training-programs/assignment';
import {
  localDate,
  projectProgramWeek,
  templateForProgramSlot,
  type ProjectedProgramSlot,
} from '@/lib/training-programs/schedule';
import type { WorkoutSession, WorkoutTemplate } from '@/lib/workout-model';
import { colors, spacing, typography } from '@/lib/theme';
type Props = {
  assignment: ProgramAssignment;
  history: readonly WorkoutSession[];
  templates: WorkoutTemplate[];
  active: boolean;
  now: number;
  onStart: (slot: ProjectedProgramSlot, template: WorkoutTemplate) => void;
  onManage?: () => void;
};
export function TrainingProgramWeek({
  assignment,
  history,
  templates,
  active,
  now,
  onStart,
  onManage,
}: Props) {
  const [selectedDate, setSelectedDate] = useState<string>();
  const week = projectProgramWeek(
    assignment,
    history,
    localDate(new Date(now)),
  );
  const selected =
    week.slots.find((s) => s.date === selectedDate) ?? week.nextSlot;
  let template: WorkoutTemplate | undefined;
  let unavailable = '';
  if (selected) {
    try {
      template = templateForProgramSlot(assignment, templates, selected);
    } catch (error) {
      unavailable = (error as Error).message;
    }
  }
  return (
    <GlassCard style={s.card}>
      <Text style={s.title} accessibilityRole="header">
        Your training plan
      </Text>
      <Text style={s.name}>{assignment.program.name}</Text>
      <Text style={s.meta}>
        Week {week.weekIndex + 1} · {week.slots.length} planned workouts · Gym
      </Text>
      {week.slots.map((slot) => {
        const day = assignment.program.days.find((d) => d.key === slot.dayKey)!;
        return (
          <Pressable
            key={slot.date}
            accessibilityRole="radio"
            accessibilityLabel={`Select ${day.name} on ${slot.date}`}
            accessibilityState={{ selected: selected?.date === slot.date }}
            onPress={() => setSelectedDate(slot.date)}
            style={s.row}
          >
            <Text style={[s.day, selected?.date === slot.date && s.selected]}>
              {slot.completedWorkoutIds.length ? '✓ ' : ''}
              {day.name}
            </Text>
            <Text style={s.meta}>
              {slot.date} ·{' '}
              {slot.completedWorkoutIds.length
                ? 'Completed'
                : slot.missed
                  ? 'Missed · choose when ready'
                  : 'Planned'}
            </Text>
          </Pressable>
        );
      })}
      <Text style={s.meta}>
        Other days: recovery. Missed sessions never add sets to another workout.
      </Text>
      {assignment.reducedFirstSession && week.weekIndex === 0 ? (
        <Text style={s.meta}>
          First planned session: 1 working set per exercise, as selected.
        </Text>
      ) : null}
      {assignment.program.cardio.length ? (
        <View style={s.guidance}>
          <Text style={s.name}>Cardio guidance</Text>
          <Text style={s.meta}>
            Walking or cycling · gradual target:{' '}
            {assignment.program.cardio.reduce((n, c) => n + c.minutes, 0)}{' '}
            moderate minutes per week. Begin with manageable 10–15 minute
            sessions.
          </Text>
          {week.days
            .filter((d) => d.cardio.length)
            .map((d) => (
              <Text key={d.date} style={s.meta}>
                {d.date} · {d.cardio.reduce((n, c) => n + c.minutes, 0)} min
                target
              </Text>
            ))}
        </View>
      ) : null}
      {unavailable ? (
        <Text accessibilityRole="alert" style={s.meta}>
          {unavailable}
        </Text>
      ) : null}
      {!active &&
      template &&
      selected &&
      !selected.completedWorkoutIds.length ? (
        <AppButton
          title={`Start planned workout · ${selected.dayKey}`}
          onPress={() => onStart(selected, template!)}
        />
      ) : null}
      {active ? (
        <Text style={s.meta}>
          Resume your active workout above before starting another.
        </Text>
      ) : null}
      {!week.nextSlot ? (
        <Text style={s.name}>This week’s planned workouts are complete.</Text>
      ) : null}
      {unavailable && onManage ? (
        <AppButton
          title="Review workouts in Profile"
          secondary
          onPress={onManage}
        />
      ) : null}
    </GlassCard>
  );
}
const s = StyleSheet.create({
  card: { gap: spacing.sm },
  title: { ...typography.title2, color: colors.textPrimary },
  name: { ...typography.headline, color: colors.textPrimary },
  meta: { ...typography.subheadline, color: colors.textSecondary },
  day: { ...typography.headline, color: colors.textPrimary },
  selected: { color: colors.primary },
  row: {
    paddingVertical: spacing.sm,
    minHeight: 48,
    gap: spacing.xxs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  guidance: { gap: spacing.xs },
});
