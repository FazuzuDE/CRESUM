import { View } from 'react-native';
import { createThemedStyles, useAppColors } from './AppThemeProvider';
import {
  DirectionalIcon as Icon,
  LocalizedText as Text,
} from './LayoutDirection';
import { ExerciseArtwork } from './ExerciseArtwork';
import { useLocalization } from './LocalizationProvider';
import { catalogLabel } from '@/lib/i18n/catalog';
import { formatEntryNumber, formatNumber } from '@/lib/i18n/format';
import { programDayLabel } from '@/lib/i18n/program';
import { findExercise } from '@/lib/exercise-library';
import type {
  CardioGuidance,
  ProgramDefinition,
  ProgramHold,
} from '@/lib/training-programs/model';
import { isSetComplete, type WorkoutSession } from '@/lib/workout-model';
import { radius, spacing, typography } from '@/lib/theme';
import { newestFirstHistory } from '@/lib/workout-history';

export function StarterProgramReview({
  program,
  history,
}: {
  program: ProgramDefinition;
  history: readonly WorkoutSession[];
}) {
  const s = useStyles();
  const { t, locale } = useLocalization();
  const weights = new Map<string, string>();
  for (const session of newestFirstHistory(history)) {
    for (const exercise of session.exercises) {
      const last = exercise.sets.findLast(isSetComplete);
      if (last && !weights.has(exercise.libraryId))
        weights.set(exercise.libraryId, last.weight);
    }
  }
  const longerSession =
    program.goal === 'get_stronger' || program.goal === 'lose_weight';
  return (
    <View style={s.list}>
      <Text style={s.meta}>
        {t('onboarding.workouts', { count: program.days.length })}
        {' · '}
        {formatNumber(locale, longerSession ? 75 : 70)}–
        {formatNumber(locale, longerSession ? 95 : 90, {
          style: 'unit',
          unit: 'minute',
          unitDisplay: 'short',
        })}
      </Text>
      {program.days.map((day, index) => (
        <View key={day.key} style={s.section}>
          <Text style={s.heading} accessibilityRole="header">
            {t('onboarding.workoutIndex', { index: index + 1 })}
          </Text>
          {program.goal === 'universal' ? (
            <Text style={s.meta}>{programDayLabel(t, day.key, day.name)}</Text>
          ) : null}
          {day.movements.map((movement) => {
            const exercise = findExercise(movement.exerciseId)!;
            const weight = weights.get(exercise.id);
            return (
              <View key={exercise.id} style={s.card}>
                <ExerciseArtwork imageKey={exercise.imageKey} size={52} />
                <View style={s.info}>
                  <Text style={s.name}>
                    {catalogLabel(
                      locale,
                      'exercise',
                      exercise.id,
                      exercise.name,
                    )}
                  </Text>
                  <Text style={s.meta}>
                    {formatNumber(locale, movement.sets)} ×{' '}
                    {formatNumber(locale, movement.repMin)}–
                    {formatNumber(locale, movement.repMax)}
                    {' · '}
                    {t('onboarding.kg')}{' '}
                    {weight ? formatEntryNumber(locale, weight) : '—'}
                  </Text>
                </View>
              </View>
            );
          })}
          <ProgramTimedActivities
            hold={day.hold}
            cardio={program.cardio.find(
              (block) => block.offset === program.schedule[0][index].offset,
            )}
          />
        </View>
      ))}
    </View>
  );
}

export function ProgramTimedActivities({
  hold,
  cardio,
}: {
  hold?: ProgramHold;
  cardio?: CardioGuidance;
}) {
  const s = useStyles();
  const colors = useAppColors();
  const { t, locale } = useLocalization();
  const minutes =
    cardio &&
    formatNumber(locale, cardio.minutes, {
      style: 'unit',
      unit: 'minute',
      unitDisplay: 'short',
    });
  const seconds =
    hold &&
    formatNumber(locale, hold.maxSeconds, {
      style: 'unit',
      unit: 'second',
      unitDisplay: 'short',
    });
  if (!hold && !cardio?.activity) return null;
  return (
    <View style={s.section}>
      {hold ? (
        <View style={s.card}>
          <ExerciseArtwork imageKey={hold.exerciseId} size={52} />
          <View style={s.info}>
            <Text style={s.name}>
              {catalogLabel(locale, 'exercise', hold.exerciseId, 'Plank')}
            </Text>
            <Text style={s.meta}>
              {formatNumber(locale, hold.sets)} ×{' '}
              {formatNumber(locale, hold.minSeconds)}–{seconds}
            </Text>
          </View>
        </View>
      ) : null}
      {cardio?.activity ? (
        <View style={s.card}>
          <View style={s.icon}>
            <Icon name="time-outline" size={25} color={colors.primary} />
          </View>
          <View style={s.info}>
            <Text style={s.name}>
              {t(
                cardio.activity === 'treadmill_walking'
                  ? 'program.treadmill'
                  : 'program.bike',
              )}
            </Text>
            <Text style={s.meta}>
              {minutes} · {t('program.moderate')}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  list: { gap: spacing.lg },
  section: { gap: spacing.xs },
  heading: { ...typography.title3, color: colors.textPrimary },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: spacing.xs,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, minWidth: 0, gap: spacing.xxs },
  name: {
    ...typography.subheadline,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  meta: { ...typography.footnote, color: colors.textSecondary },
}));
