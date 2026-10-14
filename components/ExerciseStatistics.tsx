import { useEffect, useMemo, useState } from 'react';
import {
  AppState,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandHeader } from './BrandHeader';
import { AppScrollView } from './AppScrollView';
import { VolumeTrendChart } from './VolumeTrendChart';
import { EstimatedOneRepMaxBars } from './EstimatedOneRepMaxBars';
import {
  projectExerciseStatistics,
  type ExerciseMetric,
  type ExerciseStatisticsPoint,
} from '@/lib/exercise-statistics';
import {
  PROGRESS_PERIODS,
  progressPeriodStart,
  type ProgressPeriodId,
} from '@/lib/progress-periods';
import type { WorkoutSession } from '@/lib/workout-model';
import type { WorkoutVolume } from '@/lib/progress-analytics';
import { colors, radius, spacing, typography } from '@/lib/theme';

const metrics: { id: ExerciseMetric; label: string }[] = [
  { id: 'estimated1RM', label: 'Estimated 1RM' },
  { id: 'volume', label: 'Volume' },
  { id: 'topWeight', label: 'Top weight' },
];
const number = (v: number, estimate = false) =>
  (v !== 0 && Math.abs(v) < 0.05) || Math.abs(v) >= 1e12
    ? String(v)
    : estimate
      ? v.toFixed(1)
      : v.toLocaleString(undefined, { maximumFractionDigits: 12 });
const date = (v: number) => new Date(v).toLocaleString();

export function ExerciseStatistics({
  history,
  exerciseId,
  name,
  now: fixedNow,
}: {
  history: readonly WorkoutSession[];
  exerciseId: string;
  name: string;
  now?: number;
}) {
  const [period, setPeriod] = useState<ProgressPeriodId>('1M');
  const [metric, setMetric] = useState<ExerciseMetric>('estimated1RM');
  const [clock, setClock] = useState(Date.now);
  const [selected, setSelected] = useState<string>();
  useEffect(() => {
    if (fixedNow !== undefined) return;
    const refresh = () => setClock(Date.now());
    const timer = setInterval(refresh, 60000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [fixedNow]);
  const now = fixedNow ?? clock;
  const result = useMemo(
    () =>
      projectExerciseStatistics(
        history,
        period,
        now,
        `canonical:${exerciseId}`,
        metric,
      ),
    [history, period, now, exerciseId, metric],
  );
  const label = metrics.find((m) => m.id === metric)!.label;
  const points = result.points.map((p) => ({
    workoutId: p.workoutId,
    workoutName: p.workoutName,
    finishedAt: p.finishedAt,
    volume: p[metric]!,
  }));
  const selectedPoint = result.points.find((p) => p.workoutId === selected);
  const selectPoint = (p: WorkoutVolume) => setSelected(p.workoutId);
  const pointLabel = (p: WorkoutVolume) =>
    `${p.workoutName}, ${date(p.finishedAt)}, ${number(p.volume, metric === 'estimated1RM')} kg`;
  const start =
    progressPeriodStart(period, now) ?? points[0]?.finishedAt ?? now;
  const comparison = result.comparison;
  return (
    <View style={s.content}>
      <View style={s.segments} accessibilityLabel="Exercise statistics period">
        {PROGRESS_PERIODS.map((p) => (
          <Pressable
            key={p.id}
            accessibilityRole="button"
            accessibilityLabel={`Exercise period ${p.id}`}
            accessibilityState={{ selected: p.id === period }}
            onPress={() => {
              setPeriod(p.id);
              setSelected(undefined);
            }}
            style={[s.segment, p.id === period && s.active]}
          >
            <Text style={[s.segmentText, p.id === period && s.activeText]}>
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={s.segments} accessibilityLabel="Exercise statistics metric">
        {metrics.map((m) => (
          <Pressable
            key={m.id}
            accessibilityRole="button"
            accessibilityLabel={`Exercise metric ${m.label}`}
            accessibilityState={{ selected: m.id === metric }}
            onPress={() => {
              setMetric(m.id);
              setSelected(undefined);
            }}
            style={[s.segment, m.id === metric && s.active]}
          >
            <Text style={[s.segmentText, m.id === metric && s.activeText]}>
              {m.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={s.card}>
        <Text style={s.caption}>{label.toUpperCase()}</Text>
        <View style={s.summary}>
          <Text style={s.value}>
            {result.value === undefined
              ? '—'
              : number(result.value, metric === 'estimated1RM')}{' '}
            <Text style={s.unit}>kg</Text>
          </Text>
          {comparison ? (
            <View style={s.comparison}>
              <Text
                style={[
                  s.note,
                  comparison.kind === 'increase'
                    ? s.increase
                    : comparison.kind === 'decrease'
                      ? s.decrease
                      : undefined,
                ]}
              >
                {comparison.kind === 'unavailable'
                  ? result.value === undefined
                    ? 'Comparison unavailable'
                    : 'No previous-period data'
                  : `${comparison.kind === 'increase' ? '↑ +' : comparison.kind === 'decrease' ? '↓ −' : ''}${number(Math.abs(comparison.delta!), metric === 'estimated1RM')} kg`}
              </Text>
              {comparison.kind !== 'unavailable' ? (
                <Text style={s.note}>vs previous period</Text>
              ) : null}
            </View>
          ) : null}
        </View>
        <Text style={s.note}>
          {metric === 'volume'
            ? 'Completed training volume in this period'
            : metric === 'topWeight'
              ? 'Highest logged weight in this period'
              : 'Best estimate per workout'}
        </Text>
        {!points.length ? (
          <Text style={s.empty}>
            {result.setCount
              ? '1RM unavailable for paired-side or zero-load sets. Choose Volume or Top weight.'
              : 'No completed sets for this exercise in this period.'}
          </Text>
        ) : period === '1W' ? (
          <EstimatedOneRepMaxBars
            workouts={points}
            pointLabel={pointLabel}
            measureLabel={label}
            onSelectPoint={selectPoint}
            pointLimit={points.length}
          />
        ) : (
          <VolumeTrendChart
            workouts={points}
            start={start}
            end={now}
            measureLabel={label}
            formatPoint={pointLabel}
            onSelectPoint={selectPoint}
          />
        )}
        {metric === 'estimated1RM' ? (
          <Text style={s.note}>
            Epley estimate, not a tested maximum. Paired-side and zero-load sets
            are excluded.
          </Text>
        ) : null}
        {points.length ? (
          <Text style={s.note}>Tap a point to view completed sets.</Text>
        ) : null}
      </View>
      <View style={s.counts}>
        <View style={[s.card, s.count]}>
          <Text style={s.countValue}>{result.workoutCount}</Text>
          <Text style={s.note}>Workouts</Text>
        </View>
        <View style={[s.card, s.count]}>
          <Text style={s.countValue}>{result.setCount}</Text>
          <Text style={s.note}>Completed sets</Text>
        </View>
      </View>
      {points.length ? (
        <View style={s.card}>
          <Text style={s.title}>
            Recent workouts · {Math.min(3, points.length)} of {points.length}
          </Text>
          {[...points]
            .reverse()
            .slice(0, 3)
            .map((p) => (
              <Pressable
                key={p.workoutId}
                accessibilityRole="button"
                accessibilityLabel={`View ${p.workoutName} sets ${p.workoutId}`}
                onPress={() => selectPoint(p)}
                style={s.workout}
              >
                <Text style={s.title}>{p.workoutName}</Text>
                <Text style={s.note}>{date(p.finishedAt)}</Text>
                <Text style={s.link}>
                  {number(p.volume, metric === 'estimated1RM')} kg
                </Text>
              </Pressable>
            ))}
        </View>
      ) : null}
      {selectedPoint ? (
        <LoggedExerciseSets
          point={selectedPoint}
          name={name}
          onClose={() => setSelected(undefined)}
        />
      ) : null}
    </View>
  );
}

function LoggedExerciseSets({
  point,
  name,
  onClose,
}: {
  point: ExerciseStatisticsPoint;
  name: string;
  onClose: () => void;
}) {
  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      allowSwipeDismissal
      onRequestClose={onClose}
    >
      <SafeAreaView style={s.sheet}>
        <BrandHeader tagline={false} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to exercise statistics"
          onPress={onClose}
          style={s.back}
        >
          <Text style={s.link}>‹ Statistics</Text>
        </Pressable>
        <AppScrollView contentContainerStyle={s.content}>
          <Text style={s.pageTitle} accessibilityRole="header">
            Logged sets
          </Text>
          <Text style={s.title}>{name}</Text>
          <Text style={s.note}>
            {date(point.finishedAt)} · {point.workoutName}
          </Text>
          <View style={s.card}>
            <Text style={s.countValue}>{number(point.volume)} kg</Text>
            <Text style={s.note}>
              Training volume · {point.sets.length} completed sets
            </Text>
          </View>
          <View style={s.card}>
            <Text style={s.title}>Completed sets</Text>
            <View style={s.setRow}>
              {['SET', 'KG', 'REPS'].map((label) => (
                <Text key={label} style={s.cellLabel}>
                  {label}
                </Text>
              ))}
            </View>
            {point.sets.map((set, index) => (
              <View
                key={`${set.snapshotId}:${set.id}:${index}`}
                style={s.setRow}
              >
                <Text style={s.cell}>{index + 1}</Text>
                <Text style={s.cell}>{number(set.weight)}</Text>
                <Text style={s.cell}>
                  {set.otherSideReps === undefined
                    ? set.reps
                    : `${set.reps} L / ${set.otherSideReps} R`}
                </Text>
              </View>
            ))}
          </View>
          {point.estimated1RM !== undefined ? (
            <View style={s.card}>
              <Text style={s.title}>Estimated 1RM</Text>
              <Text style={s.countValue}>
                {number(point.estimated1RM, true)} kg
              </Text>
              <Text style={s.note}>
                From {point.estimateSource!.weight} kg ×{' '}
                {point.estimateSource!.reps} · Epley estimate
              </Text>
            </View>
          ) : null}
          <Text style={s.note}>
            Only completed sets for this exercise are included.
          </Text>
        </AppScrollView>
      </SafeAreaView>
    </Modal>
  );
}
const s = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.lg },
  segments: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xxs,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: spacing.xxs,
  },
  segment: {
    flexGrow: 1,
    flexBasis: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  segmentText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  active: { backgroundColor: colors.primaryTint },
  activeText: { color: colors.primary },
  card: {
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
  },
  summary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  value: {
    ...typography.statistic,
    color: colors.textPrimary,
    flexShrink: 1,
    fontVariant: ['tabular-nums'],
  },
  unit: { ...typography.title3, color: colors.textSecondary },
  comparison: { flexShrink: 1, maxWidth: '100%', alignItems: 'flex-end' },
  increase: { color: colors.volumeIncrease },
  decrease: { color: colors.volumeDecrease },
  caption: {
    ...typography.caption,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  note: { ...typography.footnote, color: colors.textSecondary },
  empty: {
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.lg,
  },
  counts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  count: { flexGrow: 1, flexBasis: 120 },
  countValue: { ...typography.title1, color: colors.textPrimary },
  title: { ...typography.headline, color: colors.textPrimary },
  link: { ...typography.headline, color: colors.primary },
  workout: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
    minHeight: 44,
    gap: spacing.xxs,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
  },
  back: { minHeight: 44, justifyContent: 'center' },
  pageTitle: { ...typography.largeTitle, color: colors.textPrimary },
  setRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  cell: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  cellLabel: { flex: 1, ...typography.caption, color: colors.textSecondary },
});
