import { createThemedStyles } from '@/components/AppThemeProvider';
import { LocalizedText as Text } from '@/components/LayoutDirection';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
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
import {
  groupsForArea,
  muscleAreaIds,
  type MuscleArea,
} from '@/lib/muscle-exercise-discovery';
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
  const s = useStyles();
  const { t, locale } = useLocalization();
  const [period, setPeriod] = useState<MusclePeriod>('7d');
  const [selected, setSelected] = useState<MuscleId>();
  const [showSets, setShowSets] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [area, setArea] = useState<MuscleArea>('upper');
  const [group, setGroup] = useState<string>();
  const [discover, setDiscover] = useState<{ initialMuscle?: MuscleId }>();
  const [example, setExample] = useState<LibraryExercise>();
  const [expandedHistory, setExpandedHistory] = useState<string>();
  const data = useMemo(
    () => projectMuscleParticipation(history, activeWorkout, period, now),
    [history, activeWorkout, period, now],
  );
  const muscle = data.muscles.find((item) => item.id === selected);
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
  function select(id?: MuscleId) {
    setSelected(id);
    setShowSets(false);
    setExpandedHistory(undefined);
  }
  function selectFromMap(id: MuscleId) {
    if (selected === id) {
      select();
      return;
    }
    for (const nextArea of muscleAreaIds) {
      const match = groupsForArea(nextArea).find(({ muscles }) =>
        muscles.includes(id),
      );
      if (!match) continue;
      setArea(nextArea);
      setGroup(match.label);
      setCatalogOpen(true);
      select(id);
      return;
    }
  }
  if (discover)
    return (
      <MuscleExerciseDiscovery
        initialMuscle={discover.initialMuscle}
        onBack={() => setDiscover(undefined)}
        history={history}
        now={now}
      />
    );
  const detail = muscle ? (
    <View style={s.detail}>
      <MuscleMap muscles={[muscle]} height={180} selected={muscle.id} />
      <MuscleFunction id={muscle.id} onExample={setExample} />
      <Text style={s.heading} accessibilityRole="header">
        {t('muscle.periodHistory')}
      </Text>
      {Array.from(new Set(muscle.sets.map((set) => set.libraryId))).map(
        (id) => {
          const sets = muscle.sets.filter((set) => set.libraryId === id);
          const isOpen = expandedHistory === id;
          return (
            <GlassCard key={id} style={s.card}>
              <MuscleDisclosure
                label={sets[0].exerciseName}
                expanded={isOpen}
                onPress={() => setExpandedHistory(isOpen ? undefined : id)}
              />
              <Text style={s.note}>
                {t('muscle.counts', {
                  primary: sets.filter((set) => set.role === 'primary').length,
                  secondary: sets.filter((set) => set.role === 'secondary')
                    .length,
                })}
              </Text>
            </GlassCard>
          );
        },
      )}
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
            .filter((set) => showSets || set.libraryId === expandedHistory)
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
                      weight: formatEntryNumber(locale, set.weight || '—'),
                      reps:
                        set.otherSideReps !== undefined
                          ? t('progress.bilateral', {
                              reps: formatEntryNumber(locale, set.reps || '—'),
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
    </View>
  ) : null;
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
              select();
            }}
          />
          {data.workoutName ? (
            <Text style={s.body}>{data.workoutName}</Text>
          ) : null}
          <MuscleMap
            muscles={data.muscles}
            selected={selected}
            onSelect={selectFromMap}
          />
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
            expanded={guideOpen}
            onPress={() => setGuideOpen(!guideOpen)}
          />
          {guideOpen ? <MuscleGuide /> : null}
          <MuscleDisclosure
            label={t('muscle.setsByMuscle')}
            expanded={catalogOpen}
            onPress={() => {
              setCatalogOpen(!catalogOpen);
              if (catalogOpen) select();
            }}
          />
          {catalogOpen ? (
            <MuscleSetCatalog
              muscles={data.muscles}
              period={context}
              area={area}
              group={group}
              selected={selected}
              detail={detail}
              onBrowse={(nextArea, nextGroup) => {
                setArea(nextArea);
                setGroup(nextGroup);
                select();
              }}
              onSelect={(id) => select(selected === id ? undefined : id)}
            />
          ) : null}
        </GlassCard>
        <AppButton
          title={t('muscle.discover')}
          onPress={() => setDiscover({})}
        />
      </AppScrollView>
      {example ? (
        <ExerciseTechnique
          exercise={example}
          history={history}
          now={now}
          onClose={() => setExample(undefined)}
        />
      ) : null}
    </>
  );
}
const useStyles = createThemedStyles((colors) => ({
  content: { padding: spacing.lg, gap: spacing.md },
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
  detail: { gap: spacing.sm, paddingVertical: spacing.sm },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
}));
