import { createThemedStyles } from '@/components/AppThemeProvider';
import { LocalizedText as Text } from '@/components/LayoutDirection';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
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
import { spacing, typography } from '@/lib/theme';
import { useLocalization } from './LocalizationProvider';
import { formatDate } from '@/lib/i18n/format';
import { programDayLabel, programTitle } from '@/lib/i18n/program';
type Props = {
  assignment: ProgramAssignment;
  history: readonly WorkoutSession[];
  templates: WorkoutTemplate[];
  active: boolean;
  now: number;
  onStart: (slot: ProjectedProgramSlot, template: WorkoutTemplate) => void;
  onManage?: () => void;
  onStartUnscheduled?: (template: WorkoutTemplate) => void;
};
export function TrainingProgramWeek({
  assignment,
  history,
  templates,
  active,
  now,
  onStart,
  onManage,
  onStartUnscheduled,
}: Props) {
  const s = useStyles();
  const { t, locale } = useLocalization();
  const dateLabel = (value: string) =>
    formatDate(locale, new Date(`${value}T00:00:00`).getTime());
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
  if (assignment.scheduleSkipped) {
    const first = templates.find(
      (item) => item.id === assignment.templates[0]?.id,
    );
    return (
      <GlassCard style={s.card}>
        <Text style={s.title} accessibilityRole="header">
          {t('plan.title')}
        </Text>
        <Text style={s.name}>
          {programTitle(t, locale, assignment.program)}
        </Text>
        {first && !active && onStartUnscheduled ? (
          <AppButton
            title={t('plan.start', {
              key: programDayLabel(
                t,
                assignment.program.days[0].key,
                assignment.program.days[0].name,
              ),
            })}
            onPress={() => onStartUnscheduled(first)}
          />
        ) : null}
        {onManage ? (
          <AppButton title={t('plan.manage')} secondary onPress={onManage} />
        ) : null}
      </GlassCard>
    );
  }
  return (
    <GlassCard style={s.card}>
      <Text style={s.title} accessibilityRole="header">
        {t('plan.title')}
      </Text>
      <Text style={s.name}>{programTitle(t, locale, assignment.program)}</Text>
      <Text style={s.meta}>
        {t('plan.week', {
          week: week.weekIndex + 1,
          workouts: t('plan.workouts', { count: week.slots.length }),
        })}
      </Text>
      {week.slots.map((slot) => {
        const day = assignment.program.days.find((d) => d.key === slot.dayKey)!;
        return (
          <Pressable
            key={slot.date}
            accessibilityRole="radio"
            accessibilityLabel={t('plan.select', {
              name: programDayLabel(t, day.key, day.name),
              date: dateLabel(slot.date),
            })}
            accessibilityState={{ selected: selected?.date === slot.date }}
            onPress={() => setSelectedDate(slot.date)}
            style={s.row}
          >
            <Text style={[s.day, selected?.date === slot.date && s.selected]}>
              {slot.completedWorkoutIds.length ? '✓ ' : ''}
              {programDayLabel(t, day.key, day.name)}
            </Text>
            <Text style={s.meta}>
              {t('plan.status', {
                date: dateLabel(slot.date),
                status: slot.completedWorkoutIds.length
                  ? t('plan.completed')
                  : slot.missed
                    ? t('plan.missed')
                    : t('plan.planned'),
              })}
            </Text>
          </Pressable>
        );
      })}
      <Text style={s.meta}>{t('plan.recovery')}</Text>
      {assignment.reducedFirstSession && week.weekIndex === 0 ? (
        <Text style={s.meta}>{t('plan.reduced')}</Text>
      ) : null}
      {assignment.program.cardio.length ? (
        <View style={s.guidance}>
          <Text style={s.name}>{t('plan.cardio')}</Text>
          <Text style={s.meta}>
            {t('plan.cardioHelp', {
              minutes: assignment.program.cardio.reduce(
                (n, c) => n + c.minutes,
                0,
              ),
            })}
          </Text>
          {week.days
            .filter((d) => d.cardio.length)
            .map((d) => (
              <Text key={d.date} style={s.meta}>
                {t('plan.cardioDay', {
                  date: dateLabel(d.date),
                  minutes: d.cardio.reduce((n, c) => n + c.minutes, 0),
                })}
              </Text>
            ))}
        </View>
      ) : null}
      {unavailable ? (
        <Text accessibilityRole="alert" style={s.meta}>
          {t('plan.unavailable')}
        </Text>
      ) : null}
      {!active &&
      template &&
      selected &&
      !selected.completedWorkoutIds.length ? (
        <AppButton
          title={t('plan.start', { key: selected.dayKey })}
          onPress={() => onStart(selected, template!)}
        />
      ) : null}
      {active ? <Text style={s.meta}>{t('plan.resume')}</Text> : null}
      {!week.nextSlot ? <Text style={s.name}>{t('plan.complete')}</Text> : null}
      {unavailable && onManage ? (
        <AppButton title={t('plan.manage')} secondary onPress={onManage} />
      ) : null}
    </GlassCard>
  );
}
const useStyles = createThemedStyles((colors) => ({
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
}));
