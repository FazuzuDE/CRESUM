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
import { useLocalization } from './LocalizationProvider';
import { catalogLabel } from '@/lib/i18n/catalog';
import { formatNumber } from '@/lib/i18n/format';
import {
  progressNumber,
  progressDate,
  periodLabel,
  volumeNumber,
} from '@/lib/i18n/progress';

const metrics = [
  { id: 'estimated1RM', key: 'progress.estimated' },
  { id: 'volume', key: 'stats.volume' },
  { id: 'topWeight', key: 'stats.topWeight' },
] as const;

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
  const { t, locale } = useLocalization();
  const number = (v: number, estimate = false) =>
    progressNumber(locale, v, estimate);
  const date = (v: number) => progressDate(locale, v);
  const goblet =
    exerciseId === 'goblet-squat' || exerciseId === 'kettlebell-goblet-squat';
  const [equipment, setEquipment] = useState('all');
  const equipmentName = (id: string) =>
    catalogLabel(
      locale,
      'equipment',
      id === 'kettlebell-goblet-squat' ? 'kettlebell' : 'dumbbell',
      id,
    );
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
        goblet
          ? equipment === 'all'
            ? 'family:goblet-squat'
            : `canonical:${equipment}`
          : `canonical:${exerciseId}`,
        metric,
      ),
    [history, period, now, exerciseId, metric, goblet, equipment],
  );
  const label = t(metrics.find((m) => m.id === metric)!.key);
  const points = result.points.map((p) => ({
    workoutId: p.workoutId,
    workoutName: p.workoutName,
    finishedAt: p.finishedAt,
    volume: p[metric]!,
    equipment: [
      ...new Set(p.sets.map((s) => equipmentName(s.exerciseId))),
    ].join(' · '),
  }));
  const selectedPoint = result.points.find((p) => p.workoutId === selected);
  const selectPoint = (p: WorkoutVolume) => setSelected(p.workoutId);
  const pointLabel = (p: WorkoutVolume) =>
    t('progress.point', {
      name: goblet
        ? `${p.workoutName} · ${points.find((point) => point.workoutId === p.workoutId)?.equipment ?? ''}`
        : p.workoutName,
      date: date(p.finishedAt),
      value: number(p.volume, metric === 'estimated1RM'),
    });
  const start =
    progressPeriodStart(period, now) ?? points[0]?.finishedAt ?? now;
  const comparison = result.comparison;
  return (
    <View style={s.content}>
      {goblet ? (
        <View style={s.segments} accessibilityLabel={t('library.equipment')}>
          {['all', 'goblet-squat', 'kettlebell-goblet-squat'].map((id) => {
            const title = id === 'all' ? t('library.all') : equipmentName(id);
            return (
              <Pressable
                key={id}
                accessibilityRole="button"
                accessibilityLabel={title}
                accessibilityState={{ selected: equipment === id }}
                onPress={() => {
                  setEquipment(id);
                  setSelected(undefined);
                }}
                style={[s.segment, equipment === id && s.active]}
              >
                <Text style={[s.segmentText, equipment === id && s.activeText]}>
                  {title}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      <View style={s.segments} accessibilityLabel={t('stats.periodGroup')}>
        {PROGRESS_PERIODS.map((p) => (
          <Pressable
            key={p.id}
            accessibilityRole="button"
            accessibilityLabel={t('stats.periodAction', {
              period: periodLabel(t, p.id),
            })}
            accessibilityState={{ selected: p.id === period }}
            onPress={() => {
              setPeriod(p.id);
              setSelected(undefined);
            }}
            style={[s.segment, p.id === period && s.active]}
          >
            <Text style={[s.segmentText, p.id === period && s.activeText]}>
              {periodLabel(t, p.id)}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={s.segments} accessibilityLabel={t('stats.metricGroup')}>
        {metrics.map((m) => (
          <Pressable
            key={m.id}
            accessibilityRole="button"
            accessibilityLabel={t('stats.metricAction', { metric: t(m.key) })}
            accessibilityState={{ selected: m.id === metric }}
            onPress={() => {
              setMetric(m.id);
              setSelected(undefined);
            }}
            style={[s.segment, m.id === metric && s.active]}
          >
            <Text style={[s.segmentText, m.id === metric && s.activeText]}>
              {t(m.key)}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={s.card}>
        <Text style={s.caption}>
          {label.toUpperCase()}
          {goblet
            ? ` · ${equipment === 'all' ? t('library.all') : equipmentName(equipment)}`
            : ''}
        </Text>
        <View style={s.summary}>
          <Text style={s.value}>
            {result.value === undefined
              ? '—'
              : number(result.value, metric === 'estimated1RM')}{' '}
            <Text style={s.unit}>{t('progress.kg')}</Text>
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
                    ? t('stats.comparisonUnavailable')
                    : t('stats.noPrevious')
                  : t('progress.valueKg', {
                      value: `${comparison.kind === 'increase' ? '↑ +' : comparison.kind === 'decrease' ? '↓ −' : ''}${number(Math.abs(comparison.delta!), metric === 'estimated1RM')}`,
                    })}
              </Text>
              {comparison.kind !== 'unavailable' ? (
                <Text style={s.note}>{t('progress.vsPrevious')}</Text>
              ) : null}
            </View>
          ) : null}
        </View>
        <Text style={s.note}>
          {metric === 'volume'
            ? t('stats.volumeHelp')
            : metric === 'topWeight'
              ? t('stats.weightHelp')
              : t('stats.estimateHelp')}
        </Text>
        {!points.length ? (
          <Text style={s.empty}>
            {result.setCount ? t('stats.noEstimate') : t('stats.empty')}
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
          <Text style={s.note}>{t('stats.estimateNote')}</Text>
        ) : null}
        {points.length ? <Text style={s.note}>{t('stats.tap')}</Text> : null}
      </View>
      <View style={s.counts}>
        <View style={[s.card, s.count]}>
          <Text style={s.countValue}>
            {formatNumber(locale, result.workoutCount)}
          </Text>
          <Text style={s.note}>{t('stats.workouts')}</Text>
        </View>
        <View style={[s.card, s.count]}>
          <Text style={s.countValue}>
            {formatNumber(locale, result.setCount)}
          </Text>
          <Text style={s.note}>{t('stats.completed')}</Text>
        </View>
      </View>
      {points.length ? (
        <View style={s.card}>
          <Text style={s.title}>
            {t('volume.recent', {
              shown: Math.min(3, points.length),
              total: points.length,
            })}
          </Text>
          {[...points]
            .reverse()
            .slice(0, 3)
            .map((p) => (
              <Pressable
                key={p.workoutId}
                accessibilityRole="button"
                accessibilityLabel={t('stats.viewSets', {
                  name: p.workoutName,
                  id: p.workoutId,
                })}
                onPress={() => selectPoint(p)}
                style={s.workout}
              >
                <Text style={s.title}>{p.workoutName}</Text>
                {goblet ? <Text style={s.note}>{p.equipment}</Text> : null}
                <Text style={s.note}>{date(p.finishedAt)}</Text>
                <Text style={s.link}>
                  {t('progress.valueKg', {
                    value: number(p.volume, metric === 'estimated1RM'),
                  })}
                </Text>
              </Pressable>
            ))}
        </View>
      ) : null}
      {selectedPoint ? (
        <LoggedExerciseSets
          point={selectedPoint}
          name={name}
          showEquipment={goblet}
          onClose={() => setSelected(undefined)}
        />
      ) : null}
    </View>
  );
}

function LoggedExerciseSets({
  point,
  name,
  showEquipment,
  onClose,
}: {
  point: ExerciseStatisticsPoint;
  name: string;
  showEquipment?: boolean;
  onClose: () => void;
}) {
  const { t, locale } = useLocalization();
  const number = (v: number, estimate = false) =>
    progressNumber(locale, v, estimate);
  const date = (v: number) => progressDate(locale, v);
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
          accessibilityLabel={t('stats.backA11y')}
          onPress={onClose}
          style={s.back}
        >
          <Text style={s.link}>{t('stats.back')}</Text>
        </Pressable>
        <AppScrollView contentContainerStyle={s.content}>
          <Text style={s.pageTitle} accessibilityRole="header">
            {t('stats.logged')}
          </Text>
          <Text style={s.title}>{name}</Text>
          <Text style={s.note}>
            {date(point.finishedAt)} · {point.workoutName}
          </Text>
          <View style={s.card}>
            <Text style={s.countValue}>
              {t('progress.valueKg', { value: number(point.volume) })}
            </Text>
            <Text style={s.note}>
              {t('stats.trainingSets', { count: point.sets.length })}
            </Text>
          </View>
          <View style={s.card}>
            <Text style={s.title}>{t('stats.completed')}</Text>
            <View style={s.setRow}>
              {[
                t('workout.tableSet'),
                t('workout.tableKg'),
                t('workout.tableReps'),
              ].map((label) => (
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
                <Text style={s.cell}>
                  {formatNumber(locale, index + 1)}
                  {showEquipment
                    ? ` · ${catalogLabel(locale, 'equipment', set.exerciseId === 'kettlebell-goblet-squat' ? 'kettlebell' : 'dumbbell', set.exerciseId)}`
                    : ''}
                </Text>
                <Text style={s.cell}>{number(set.weight)}</Text>
                <Text style={s.cell}>
                  {set.otherSideReps === undefined
                    ? formatNumber(locale, set.reps)
                    : t('progress.bilateral', {
                        reps: formatNumber(locale, set.reps),
                        other: formatNumber(locale, set.otherSideReps),
                      })}
                </Text>
              </View>
            ))}
          </View>
          {point.estimated1RM !== undefined ? (
            <View style={s.card}>
              <Text style={s.title}>{t('progress.estimated')}</Text>
              <Text style={s.countValue}>
                {t('progress.valueKg', {
                  value: number(point.estimated1RM, true),
                })}
              </Text>
              <Text style={s.note}>
                {t('stats.source', {
                  weight: volumeNumber(locale, point.estimateSource!.weight),
                  reps: formatNumber(locale, point.estimateSource!.reps),
                })}
              </Text>
            </View>
          ) : null}
          <Text style={s.note}>{t('stats.included')}</Text>
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
