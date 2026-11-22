import { createThemedStyles } from '@/components/AppThemeProvider';
import {
  LocalizedModal as Modal,
  LocalizedText as Text,
} from '@/components/LayoutDirection';
import { useEffect, useMemo, useState } from 'react';
import { BackHandler, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from './AppButton';
import { AppScrollView } from './AppScrollView';
import { GlassCard } from './GlassCard';
import { MuscleMap } from './MuscleMap';
import { MuscleExerciseDiscovery } from './MuscleExerciseDiscovery';
import { MuscleGuide, MuscleRole } from './MuscleGuide';
import { MuscleSetCatalog } from './MuscleSetCatalog';
import { MuscleFunction } from './MuscleFunction';
import { ExerciseTechnique } from './ExerciseTechnique';
import { MuscleDisclosure, MuscleSegments } from './MusclePageControls';
import {
  projectMuscleParticipation,
  type MusclePeriod,
} from '@/lib/muscle-participation';
import type { MuscleId } from '@/lib/exercise-taxonomy';
import type { LibraryExercise, WorkoutSession } from '@/lib/workout-model';
import { spacing, typography } from '@/lib/theme';
import { useLocalization } from './LocalizationProvider';
import { catalogLabel } from '@/lib/i18n/catalog';
import { formatDate, formatEntryNumber, formatNumber } from '@/lib/i18n/format';

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
  const s = useStyles();
  const { t, locale } = useLocalization();
  const [period, setPeriod] = useState<MusclePeriod>('7d');
  const [selected, setSelected] = useState<MuscleId>();
  const [showSets, setShowSets] = useState(false);
  const [section, setSection] = useState<'map' | 'guide' | 'sets'>('map');
  const [discover, setDiscover] = useState<{ initialMuscle?: MuscleId }>();
  const [example, setExample] = useState<LibraryExercise>();
  const [expandedHistory, setExpandedHistory] = useState<string>();
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
    setExpandedHistory(undefined);
  }
  function backToMap() {
    setSection('map');
  }
  useEffect(() => {
    if (section === 'map' || discover || selected) return;
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        setSection('map');
        return true;
      },
    );
    return () => subscription.remove();
  }, [section, discover, selected]);
  if (discover)
    return (
      <MuscleExerciseDiscovery
        initialMuscle={discover.initialMuscle}
        onBack={() => setDiscover(undefined)}
        history={history}
        now={now}
      />
    );
  if (section === 'guide') return <MuscleGuide onBack={backToMap} />;
  return (
    <>
      {section === 'sets' ? (
        <MuscleSetCatalog
          muscles={data.muscles}
          period={context}
          onBack={backToMap}
          onSelect={select}
        />
      ) : (
        <AppScrollView
          key="map"
          branded
          dockAware
          contentContainerStyle={s.content}
        >
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
              <MuscleRole role="primary" />
              <MuscleRole role="secondary" />
            </View>
            {data.totalSets === 0 ? (
              <Text style={s.note}>{t('muscle.empty')}</Text>
            ) : null}
            {data.unmappedSets > 0 ? (
              <Text style={s.note}>
                {t('muscle.unmapped', { count: data.unmappedSets })}
              </Text>
            ) : null}
            <MuscleDisclosure
              label={t('muscle.readMap')}
              onPress={() => setSection('guide')}
            />
            <MuscleDisclosure
              label={t('muscle.setsByMuscle')}
              onPress={() => setSection('sets')}
            />
          </GlassCard>
          <AppButton
            title={t('muscle.discover')}
            onPress={() => setDiscover({})}
          />
        </AppScrollView>
      )}
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
                <View style={s.roleCounts}>
                  {(['primary', 'secondary'] as const).map((role) => (
                    <GlassCard key={role} style={s.roleCount}>
                      <Text style={s.stat}>
                        {formatNumber(locale, muscle[role])}
                      </Text>
                      <MuscleRole role={role} />
                    </GlassCard>
                  ))}
                </View>
                <GlassCard style={s.card}>
                  <MuscleMap
                    muscles={[muscle]}
                    height={232}
                    selected={muscle.id}
                    onSelect={select}
                  />
                </GlassCard>
                <MuscleFunction id={muscle.id} onExample={setExample} />
                <Text style={s.heading} accessibilityRole="header">
                  {t('muscle.periodHistory')}
                </Text>
                {Array.from(
                  new Set(muscle.sets.map((set) => set.libraryId)),
                ).map((id) => {
                  const sets = muscle.sets.filter(
                    (set) => set.libraryId === id,
                  );
                  const isOpen = expandedHistory === id;
                  return (
                    <GlassCard key={id} style={s.card}>
                      <MuscleDisclosure
                        label={sets[0].exerciseName}
                        expanded={isOpen}
                        onPress={() =>
                          setExpandedHistory(isOpen ? undefined : id)
                        }
                      />
                      <Text style={s.note}>
                        {t('muscle.counts', {
                          primary: sets.filter((set) => set.role === 'primary')
                            .length,
                          secondary: sets.filter(
                            (set) => set.role === 'secondary',
                          ).length,
                        })}
                      </Text>
                    </GlassCard>
                  );
                })}
                {!muscle.sets.length ? (
                  <>
                    <Text style={s.body}>{t('muscle.noSets')}</Text>
                    <AppButton
                      title={t('muscle.discover')}
                      onPress={() => setDiscover({ initialMuscle: muscle.id })}
                    />
                  </>
                ) : (
                  <AppButton
                    title={t(showSets ? 'muscle.hideSets' : 'muscle.showSets')}
                    secondary
                    onPress={() => {
                      setShowSets(!showSets);
                      setExpandedHistory(undefined);
                    }}
                  />
                )}
                {showSets || expandedHistory
                  ? muscle.sets
                      .filter(
                        (set) => showSets || set.libraryId === expandedHistory,
                      )
                      .map((set, index) => (
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
                                    : formatEntryNumber(
                                        locale,
                                        set.reps || '—',
                                      ),
                              })}
                            </Text>
                          </View>
                        </GlassCard>
                      ))
                  : null}
              </>
            ) : null}
          </AppScrollView>
          {example ? (
            <ExerciseTechnique
              exercise={example}
              history={history}
              now={now}
              onClose={() => setExample(undefined)}
            />
          ) : null}
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
  roleCounts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  roleCount: { flexGrow: 1, flexBasis: 130, minWidth: 0, gap: spacing.xs },
  stat: { ...typography.title2, color: colors.textPrimary },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
}));
