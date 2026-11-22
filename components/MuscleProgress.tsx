import {
  createThemedStyles,
  useAppColors,
} from '@/components/AppThemeProvider';
import {
  LocalizedModal as Modal,
  LocalizedText as Text,
} from '@/components/LayoutDirection';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from './AppButton';
import { AppScrollView } from './AppScrollView';
import { GlassCard } from './GlassCard';
import { MuscleMap } from './MuscleMap';
import { MuscleExerciseDiscovery } from './MuscleExerciseDiscovery';
import { MuscleDisclosure, MuscleSegments } from './MusclePageControls';
import { anatomicalMissingGroups } from '@/lib/anatomical-muscle-map';
import {
  projectMuscleParticipation,
  type MusclePeriod,
} from '@/lib/muscle-participation';
import type { MuscleId } from '@/lib/exercise-taxonomy';
import type { WorkoutSession } from '@/lib/workout-model';
import { spacing, typography } from '@/lib/theme';
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
  const colors = useAppColors();
  const s = useStyles();
  const { t, locale } = useLocalization();
  const [period, setPeriod] = useState<MusclePeriod>('7d');
  const [selected, setSelected] = useState<MuscleId>();
  const [showSets, setShowSets] = useState(false);
  const [help, setHelp] = useState(false);
  const [summary, setSummary] = useState(false);
  const [discover, setDiscover] = useState(false);
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
  if (discover)
    return (
      <MuscleExerciseDiscovery
        onBack={() => setDiscover(false)}
        history={history}
        now={now}
      />
    );
  return (
    <>
      <AppScrollView branded dockAware contentContainerStyle={s.content}>
        <Text style={s.title} accessibilityRole="header">
          {t('progress.title')}
        </Text>
        <MuscleSegments
          options={{
            overview: t('progress.overview'),
            muscles: t('progress.muscles'),
          }}
          value="muscles"
          onChange={(tab) => {
            if (tab === 'overview') onOverview();
          }}
        />
        <GlassCard style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.heading} accessibilityRole="header">
              {t('muscle.map')}
            </Text>
            <Text style={s.count}>
              {t('muscle.completed', { count: data.totalSets })}
            </Text>
          </View>
          <MuscleSegments
            options={{
              workout: t('muscle.workout'),
              '7d': t('muscle.seven'),
              '4w': t('muscle.four'),
            }}
            value={period}
            onChange={(id) => {
              setPeriod(id);
              setSelected(undefined);
            }}
          />
          {data.workoutName ? (
            <Text style={s.body}>{data.workoutName}</Text>
          ) : null}
          <MuscleMap muscles={data.muscles} onSelect={select} />
          <View style={s.legend}>
            <Text style={s.note}>
              <Text style={{ color: colors.musclePrimary }}>● </Text>
              {t('muscle.primary')}
            </Text>
            <Text style={s.note}>
              <Text style={{ color: colors.muscleSecondary }}>● </Text>
              {t('muscle.secondary')}
            </Text>
          </View>
          <Text style={s.note}>
            {data.totalSets === 0
              ? t('muscle.empty')
              : t('muscle.shortMeaning')}
          </Text>
          {data.unmappedSets > 0 ? (
            <Text style={s.note}>
              {t('muscle.unmapped', { count: data.unmappedSets })}
            </Text>
          ) : null}
          <MuscleDisclosure
            label={t('muscle.readMap')}
            expanded={help}
            onPress={() => setHelp(!help)}
          />
          {help ? (
            <View style={s.help}>
              <Text style={s.note}>{t('muscle.meaning')}</Text>
              <Text style={s.note}>{t('muscle.basis')}</Text>
              <Text style={s.note}>{t('muscle.upperBackProjection')}</Text>
              <Text style={s.note}>{t('muscle.rearDeltRegion')}</Text>
              <Text style={s.note}>{t('muscle.adductorRegion')}</Text>
              <Text style={s.note}>{t('exerciseMuscles.lowerBack')}</Text>
              {anatomicalMissingGroups.length ? (
                <Text style={s.note}>
                  {t('muscle.coverage', {
                    groups: anatomicalMissingGroups
                      .map((m) => muscleLabel(m.id, m.label))
                      .join(', '),
                  })}
                </Text>
              ) : null}
            </View>
          ) : null}
          <MuscleDisclosure
            label={t('muscle.setsByMuscle')}
            expanded={summary}
            onPress={() => setSummary(!summary)}
          />
          {summary ? (
            <View style={s.help}>
              {data.muscles.map((item) => (
                <AppButton
                  key={item.id}
                  title={muscleLabel(item.id, item.label)}
                  detail={t('muscle.counts', {
                    primary: item.primary,
                    secondary: item.secondary,
                  })}
                  accessibilityLabel={t('muscle.rowA11y', {
                    name: muscleLabel(item.id, item.label),
                    primary: item.primary,
                    secondary: item.secondary,
                  })}
                  presentation="row"
                  secondary
                  onPress={() => select(item.id)}
                />
              ))}
            </View>
          ) : null}
        </GlassCard>
        <AppButton
          title={t('muscle.discover')}
          onPress={() => setDiscover(true)}
        />
      </AppScrollView>
      <Modal
        visible={!!muscle}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelected(undefined)}
      >
        <SafeAreaView style={s.modal}>
          <AppScrollView
            branded
            back={{ onPress: () => setSelected(undefined) }}
            safeAreaEdges={[]}
            contentContainerStyle={s.content}
          >
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
                {muscle.id === 'lower-back' ? (
                  <Text style={s.note}>{t('exerciseMuscles.lowerBack')}</Text>
                ) : null}
                {muscle.id === 'adductors' ? (
                  <Text style={s.note}>{t('muscle.adductorRegion')}</Text>
                ) : null}
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
const useStyles = createThemedStyles((colors) => ({
  content: { padding: spacing.lg, gap: spacing.md },
  modal: { flex: 1, backgroundColor: colors.background },
  title: { ...typography.largeTitle, color: colors.textPrimary },
  heading: { ...typography.headline, color: colors.textPrimary },
  body: { ...typography.subheadline, color: colors.textSecondary },
  note: { ...typography.footnote, color: colors.textSecondary },
  card: { gap: spacing.sm },
  cardHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  count: {
    ...typography.caption,
    color: colors.textSecondary,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: spacing.xs,
  },
  help: { gap: spacing.sm },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
}));
