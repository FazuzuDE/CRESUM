import { useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from './AppButton';
import { AppScrollView } from './AppScrollView';
import { BrandHeader } from './BrandHeader';
import { GlassCard } from './GlassCard';
import { MuscleMap } from './MuscleMap';
import { anatomicalMissingGroups } from '@/lib/anatomical-muscle-map';
import {
  projectMuscleParticipation,
  type MusclePeriod,
} from '@/lib/muscle-participation';
import type { MuscleId } from '@/lib/exercise-taxonomy';
import type { WorkoutSession } from '@/lib/workout-model';
import { colors, spacing, typography } from '@/lib/theme';
import { useLocalization } from './LocalizationProvider';
import { catalogLabel } from '@/lib/i18n/catalog';
import { formatDate, formatEntryNumber } from '@/lib/i18n/format';

export function MuscleProgress({
  history,
  activeWorkout,
  now,
  onOverview,
}: {
  history: WorkoutSession[];
  activeWorkout?: WorkoutSession;
  now: number;
  onOverview: () => void;
}) {
  const { t, locale } = useLocalization();
  const [period, setPeriod] = useState<MusclePeriod>('7d');
  const [selected, setSelected] = useState<MuscleId>();
  const [showSets, setShowSets] = useState(false);
  const data = useMemo(
    () => projectMuscleParticipation(history, activeWorkout, period, now),
    [history, activeWorkout, period, now],
  );
  const muscle = data.muscles.find((item) => item.id === selected);
  const muscleLabel = (id: string, fallback: string) =>
    catalogLabel(locale, 'muscle', id, fallback);
  const context =
    period === 'workout'
      ? t(
          activeWorkout &&
            activeWorkout.finishedAt === undefined &&
            Number.isFinite(activeWorkout.startedAt) &&
            activeWorkout.startedAt >= 0 &&
            activeWorkout.startedAt <= now
            ? 'muscle.current'
            : 'muscle.latest',
        )
      : t(period === '7d' ? 'muscle.lastSeven' : 'muscle.lastFour');
  function select(id: MuscleId) {
    setSelected(id);
    setShowSets(false);
  }
  return (
    <>
      <AppScrollView contentContainerStyle={s.content}>
        <BrandHeader />
        <Text style={s.title} accessibilityRole="header">
          {t('progress.title')}
        </Text>
        <View style={s.tabs}>
          <AppButton
            title={t('progress.overview')}
            secondary
            onPress={onOverview}
          />
          <AppButton
            title={t('progress.muscles')}
            selected
            onPress={() => {}}
          />
        </View>
        <Text style={s.heading} accessibilityRole="header">
          {t('muscle.map')}
        </Text>
        <View style={s.periods}>
          {(
            [
              ['workout', t('muscle.workout')],
              ['7d', t('muscle.seven')],
              ['4w', t('muscle.four')],
            ] as const
          ).map(([id, label]) => (
            <AppButton
              key={id}
              title={label}
              secondary={period !== id}
              selected={period === id}
              onPress={() => {
                setPeriod(id);
                setSelected(undefined);
              }}
            />
          ))}
        </View>
        <GlassCard>
          <View style={s.card}>
            <Text style={s.heading}>{context}</Text>
            {data.workoutName ? (
              <Text style={s.body}>{data.workoutName}</Text>
            ) : null}
            <Text style={s.body}>
              {t('muscle.completed', { count: data.totalSets })}
            </Text>
            <MuscleMap muscles={data.muscles} onSelect={select} />
            <View style={s.legend}>
              <Text style={s.body}>
                <Text style={{ color: colors.musclePrimary }}>● </Text>
                {t('muscle.primary')}
              </Text>
              <Text style={s.body}>
                <Text style={{ color: colors.muscleSecondary }}>● </Text>
                {t('muscle.secondary')}
              </Text>
              <Text style={s.body}>
                <Text style={{ color: colors.muscleNeutral }}>● </Text>
                {t('muscle.neutral')}
              </Text>
            </View>
            <Text style={s.note}>{t('muscle.meaning')}</Text>
            <Text style={s.note}>{t('muscle.upperBackProjection')}</Text>
            <Text style={s.note}>{t('muscle.rearDeltRegion')}</Text>
            <Text style={s.note}>
              {t('muscle.coverage', {
                groups: anatomicalMissingGroups
                  .map((m) => muscleLabel(m.id, m.label))
                  .join(', '),
              })}
            </Text>
          </View>
        </GlassCard>
        {data.totalSets === 0 ? (
          <Text style={s.body}>{t('muscle.empty')}</Text>
        ) : null}
        {data.unmappedSets > 0 ? (
          <Text style={s.body}>
            {t('muscle.unmapped', { count: data.unmappedSets })}
          </Text>
        ) : null}
        <Text style={s.note}>{t('muscle.basis')}</Text>
        <GlassCard>
          <View style={s.card}>
            {data.muscles.map((item) => (
              <AppButton
                key={item.id}
                title={t('muscle.row', {
                  name: muscleLabel(item.id, item.label),
                  primary: item.primary,
                  secondary: item.secondary,
                })}
                accessibilityLabel={t('muscle.rowA11y', {
                  name: muscleLabel(item.id, item.label),
                  primary: item.primary,
                  secondary: item.secondary,
                })}
                presentation="row"
                onPress={() => select(item.id)}
              />
            ))}
          </View>
        </GlassCard>
      </AppScrollView>
      <Modal
        visible={!!muscle}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelected(undefined)}
      >
        <SafeAreaView style={s.modal}>
          <AppScrollView contentContainerStyle={s.content}>
            <AppButton
              title={t('common.done')}
              secondary
              onPress={() => setSelected(undefined)}
            />
            {muscle ? (
              <>
                <Text style={s.title} accessibilityRole="header">
                  {muscleLabel(muscle.id, muscle.label)}
                </Text>
                <Text style={s.body}>{context}</Text>
                <Text style={s.heading}>
                  {t('muscle.counts', {
                    primary: muscle.primary,
                    secondary: muscle.secondary,
                  })}
                </Text>
                <MuscleMap
                  muscles={data.muscles.map((item) =>
                    item.id === muscle.id
                      ? item
                      : { ...item, primary: 0, secondary: 0 },
                  )}
                  selected={muscle.id}
                  onSelect={select}
                />
                {muscle.id === 'rear-delts' ? (
                  <Text style={s.note}>{t('muscle.rearDeltRegion')}</Text>
                ) : null}
                {muscle.id === 'upper-back' ? (
                  <Text style={s.note}>{t('muscle.upperBackProjection')}</Text>
                ) : null}
                <Text style={s.heading}>{t('muscle.contributing')}</Text>
                {Array.from(
                  new Set(muscle.sets.map((set) => set.libraryId)),
                ).map((id) => {
                  const sets = muscle.sets.filter(
                    (set) => set.libraryId === id,
                  );
                  return (
                    <GlassCard key={id}>
                      <View style={s.card}>
                        <Text style={s.heading}>{sets[0].exerciseName}</Text>
                        <Text style={s.body}>
                          {t('muscle.counts', {
                            primary: sets.filter(
                              (set) => set.role === 'primary',
                            ).length,
                            secondary: sets.filter(
                              (set) => set.role === 'secondary',
                            ).length,
                          })}
                        </Text>
                      </View>
                    </GlassCard>
                  );
                })}
                {!muscle.sets.length ? (
                  <Text style={s.body}>{t('muscle.noSets')}</Text>
                ) : (
                  <AppButton
                    title={t(showSets ? 'muscle.hideSets' : 'muscle.showSets')}
                    secondary
                    onPress={() => setShowSets(!showSets)}
                  />
                )}
                {showSets
                  ? muscle.sets.map((set, index) => (
                      <GlassCard
                        key={`${set.workoutId}:${set.exerciseId}:${set.setId}:${index}`}
                      >
                        <View style={s.card}>
                          <Text style={s.heading}>{set.exerciseName}</Text>
                          <Text style={s.body}>
                            {set.workoutName} · {formatDate(locale, set.date)}
                          </Text>
                          <Text style={s.body}>
                            {t('muscle.setRole', {
                              index: set.setNumber,
                              role: t(
                                set.role === 'primary'
                                  ? 'muscle.primary'
                                  : 'muscle.secondary',
                              ),
                            })}
                          </Text>
                          <Text style={s.body}>
                            {t('muscle.logged', {
                              weight: formatEntryNumber(
                                locale,
                                set.weight || '—',
                              ),
                              reps:
                                set.otherSideReps !== undefined
                                  ? t('progress.bilateral', {
                                      reps: formatEntryNumber(
                                        locale,
                                        set.reps || '—',
                                      ),
                                      other: formatEntryNumber(
                                        locale,
                                        set.otherSideReps,
                                      ),
                                    })
                                  : formatEntryNumber(locale, set.reps || '—'),
                            })}
                          </Text>
                        </View>
                      </GlassCard>
                    ))
                  : null}
              </>
            ) : null}
          </AppScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}
const s = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  modal: { flex: 1, backgroundColor: colors.background },
  title: { ...typography.largeTitle, color: colors.textPrimary },
  heading: { ...typography.headline, color: colors.textPrimary },
  body: { ...typography.subheadline, color: colors.textSecondary },
  note: { ...typography.footnote, color: colors.textSecondary },
  card: { gap: spacing.sm },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  periods: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
