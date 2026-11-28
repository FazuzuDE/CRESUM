import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  cardioElapsed,
  loadCardioTimers,
  type CardioTimer,
} from '@/lib/cardio-timer';
import { findExercise } from '@/lib/exercise-library';
import { catalogLabel, workoutExerciseLabel } from '@/lib/i18n/catalog';
import { createThemedStyles } from '@/components/AppThemeProvider';
import { LocalizedText as Text } from '@/components/LayoutDirection';
import { ExerciseEquipmentCatalog } from './ExerciseEquipmentCatalog';
import { ExerciseEquipmentRow } from './ExerciseEquipmentRow';
import { setNumberInGroup } from '@/lib/exercise-groups';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { HistoryFilterModal } from './HistoryFilterModal';
import {
  defaultHistoryFilter,
  filterHistory,
  type HistoryFilter,
} from '@/lib/history-filter';
import { AppButton } from './AppButton';
import { GlassCard } from './GlassCard';
import { duration } from './Workout';
import { newestFirstHistory } from '@/lib/workout-history';
import { completedSetCount } from '@/lib/workout-engine';
import { volume } from '@/lib/workout-metrics';
import { isSetComplete, type WorkoutSession } from '@/lib/workout-model';
import { spacing, typography } from '@/lib/theme';
import { useLocalization } from './LocalizationProvider';
import { formatDate, formatEntryNumber, formatNumber } from '@/lib/i18n/format';
import { localizedHistoryFilterLabel } from '@/lib/i18n/history';
import type { Translate } from '@/lib/i18n/messages';
import type { AppLocale } from '@/lib/i18n/registry';

const completedAt = (workout: WorkoutSession): number =>
  workout.finishedAt ?? workout.startedAt;

const workoutMetadata = (
  workout: WorkoutSession,
  t: Translate,
  locale: AppLocale,
): string => {
  if (
    workout.exercises.length &&
    workout.exercises.every(({ cardio }) => cardio)
  ) {
    return duration(
      workout.exercises.reduce(
        (sum, { cardio }) => sum + (cardio?.elapsedMs ?? 0),
        0,
      ),
    );
  }
  const completed = completedSetCount(workout);
  return t('history.metadata', {
    time: duration(completedAt(workout) - workout.startedAt),
    sets: t('history.completedSets', { count: completed }),
    volume: formatNumber(locale, volume(workout)),
  });
};

export function WorkoutHistory({
  history,
  initialWorkoutId,
  onCloseDetails,
}: {
  history: readonly WorkoutSession[];
  initialWorkoutId?: string;
  onCloseDetails?: () => void;
}) {
  const s = useStyles();
  const { t, locale } = useLocalization();
  const [selectedId, setSelectedId] = useState(initialWorkoutId);
  const [cardioHistory, setCardioHistory] =
    useState<ReadonlyMap<string, CardioTimer>>();
  const [filter, setFilter] = useState<HistoryFilter>(() =>
    defaultHistoryFilter(Date.now()),
  );
  const [filterOpen, setFilterOpen] = useState(false);
  const visible = useMemo(
    () => filterHistory(history, filter),
    [history, filter],
  );
  const ordered = useMemo(() => newestFirstHistory(history), [history]);
  const selected = ordered.find((workout) => workout.id === selectedId);

  useEffect(() => {
    let active = true;
    if (selectedId)
      void loadCardioTimers(AsyncStorage)
        .then((timers) => {
          if (active) setCardioHistory(timers);
        })
        .catch(() => {
          if (active) setCardioHistory(undefined);
        });
    return () => {
      active = false;
    };
  }, [selectedId]);

  if (selected) {
    const timer = cardioHistory?.get(selected.id);
    const cardio = timer && findExercise(timer.exerciseId);
    const elapsed = timer && cardioElapsed(timer, completedAt(selected));
    return (
      <View style={s.section}>
        <View style={s.detailHeader}>
          <Text style={s.sectionTitle}>{t('history.details')}</Text>
          <AppButton
            title={onCloseDetails ? t('common.done') : t('history.back')}
            swipeBack
            secondary
            onPress={onCloseDetails ?? (() => setSelectedId(undefined))}
          />
        </View>
        <GlassCard style={s.detailCard}>
          <Text style={s.detailTitle}>{selected.name}</Text>
          <Text style={s.metadata}>
            {formatDate(locale, completedAt(selected), {
              year: 'numeric',
              month: 'numeric',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
              second: 'numeric',
            })}
          </Text>
          <Text style={s.metadata}>{workoutMetadata(selected, t, locale)}</Text>
          {cardio && elapsed ? (
            <Text style={s.metadata}>
              {catalogLabel(locale, 'exercise', cardio.id, cardio.name)} ·{' '}
              {duration(elapsed)}
            </Text>
          ) : null}
          {selected.exercises.map((exercise, exerciseIndex) => {
            if (exercise.cardio) {
              return exercise.cardio.elapsedMs > 0 ? (
                <View key={exercise.id} style={s.exercise}>
                  <Text style={s.exerciseName}>
                    {workoutExerciseLabel(locale, exercise)}
                  </Text>
                  <Text style={s.setValue}>
                    {duration(exercise.cardio.elapsedMs)}
                  </Text>
                </View>
              ) : null;
            }
            const completedSets = exercise.sets.filter(isSetComplete);
            return (
              <View key={exercise.id} style={s.exercise}>
                {exercise.exerciseGroup &&
                selected.exercises[exerciseIndex - 1]?.exerciseGroup?.id !==
                  exercise.exerciseGroup.id ? (
                  <Text accessibilityRole="header" style={s.detailTitle}>
                    {exercise.exerciseGroup.name}
                  </Text>
                ) : null}
                <Text style={s.exerciseName}>
                  {workoutExerciseLabel(locale, exercise)}
                </Text>
                {exercise.exerciseGroup ? (
                  <ExerciseEquipmentRow exerciseId={exercise.libraryId} />
                ) : (
                  <ExerciseEquipmentCatalog exerciseId={exercise.libraryId} />
                )}
                {completedSets.length ? (
                  completedSets.map((set, index) => (
                    <Text key={set.id} style={s.setValue}>
                      {set.otherSideReps === undefined
                        ? t('history.set', {
                            index: setNumberInGroup(
                              selected,
                              exerciseIndex,
                              exercise.sets.findIndex(
                                (row) => row.id === set.id,
                              ),
                            ),
                            weight: formatEntryNumber(locale, set.weight),
                            reps: formatEntryNumber(locale, set.reps),
                          })
                        : t('history.bilateralSet', {
                            index: setNumberInGroup(
                              selected,
                              exerciseIndex,
                              exercise.sets.findIndex(
                                (row) => row.id === set.id,
                              ),
                            ),
                            weight: formatEntryNumber(locale, set.weight),
                            reps: formatEntryNumber(locale, set.reps),
                            other: formatEntryNumber(locale, set.otherSideReps),
                          })}
                    </Text>
                  ))
                ) : (
                  <Text style={s.metadata}>{t('history.noSets')}</Text>
                )}
              </View>
            );
          })}
        </GlassCard>
      </View>
    );
  }

  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{t('history.title')}</Text>
      <AppButton
        title={t('history.filterButton', {
          filter: localizedHistoryFilterLabel(t, locale, filter),
        })}
        accessibilityLabel={t('history.filter')}
        secondary
        onPress={() => setFilterOpen(true)}
      />

      {visible.length ? (
        visible.map((workout) => (
          <Pressable
            key={workout.id}
            accessibilityRole="button"
            accessibilityLabel={t('history.open', { name: workout.name })}
            accessibilityHint={t('history.hint')}
            onPress={() => setSelectedId(workout.id)}
            style={({ pressed }) => [s.summaryButton, pressed && s.pressed]}
          >
            <GlassCard style={s.summaryCard}>
              <Text style={s.summaryTitle} numberOfLines={2}>
                {workout.name}
              </Text>
              <Text style={s.metadata}>
                {formatDate(locale, completedAt(workout), {
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                  second: 'numeric',
                })}
              </Text>
              <Text style={s.metadata}>
                {workoutMetadata(workout, t, locale)}
              </Text>
            </GlassCard>
          </Pressable>
        ))
      ) : (
        <GlassCard>
          <Text style={s.metadata}>
            {history.length ? t('history.noRange') : t('history.empty')}
          </Text>
        </GlassCard>
      )}
      {filterOpen && (
        <HistoryFilterModal
          initial={filter}
          maximum={history.length}
          onClose={() => setFilterOpen(false)}
          onApply={(next) => {
            setFilter(next);
            setFilterOpen(false);
          }}
        />
      )}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  section: { gap: spacing.sm },
  sectionTitle: { ...typography.title3, color: colors.textPrimary },
  detailHeader: { gap: spacing.sm },
  summaryButton: { minHeight: 44 },
  pressed: { opacity: 0.65 },
  summaryCard: { width: '100%', gap: spacing.xxs },
  summaryTitle: { ...typography.headline, color: colors.textPrimary },
  metadata: { ...typography.footnote, color: colors.textSecondary },
  detailCard: { gap: spacing.md },
  detailTitle: { ...typography.title2, color: colors.textPrimary },
  exercise: {
    gap: spacing.xxs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.separator,
  },
  exerciseName: { ...typography.headline, color: colors.textPrimary },
  setValue: {
    ...typography.body,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
}));
