import { stableExerciseIdentity } from './progress-analytics';
import {
  filterProgressWorkouts,
  progressPeriodStart,
  type ProgressPeriodId,
} from './progress-periods';
import {
  completedSetMetrics,
  completedSetTimestamp,
  type CompletedSetMetrics,
} from './workout-metrics';
import type { WorkoutSession } from './workout-model';

export type ExerciseMetric = 'estimated1RM' | 'volume' | 'topWeight';
export type ExerciseStatisticsPoint = {
  workoutId: string;
  workoutName: string;
  finishedAt: number;
  volume: number;
  topWeight: number;
  estimated1RM?: number;
  estimateSource?: { weight: number; reps: number };
  sets: (CompletedSetMetrics & { id: string; snapshotId: string })[];
};

const finiteSum = (values: number[]) =>
  values.reduce((total, value) => {
    const next = total + value;
    return Number.isFinite(next) ? next : total;
  }, 0);

function pointsFor(
  workouts: readonly WorkoutSession[],
  identityKey: string,
): ExerciseStatisticsPoint[] {
  return workouts.flatMap((session) => {
    const sets = session.exercises.flatMap((exercise) => {
      if (stableExerciseIdentity(session, exercise).identityKey !== identityKey)
        return [];
      return exercise.sets.flatMap((set) => {
        if (completedSetTimestamp(set, session.finishedAt!) === undefined)
          return [];
        const metrics = completedSetMetrics(set);
        return metrics
          ? [{ ...metrics, id: set.id, snapshotId: exercise.id }]
          : [];
      });
    });
    if (!sets.length) return [];
    const best = sets
      .filter((s) => s.weight > 0 && s.estimatedOneRepMax !== undefined)
      .reduce<(typeof sets)[number] | undefined>(
        (best, s) =>
          !best || s.estimatedOneRepMax! > best.estimatedOneRepMax! ? s : best,
        undefined,
      );
    return [
      {
        workoutId: session.id,
        workoutName: session.name,
        finishedAt: session.finishedAt!,
        volume: finiteSum(sets.map((s) => s.volume)),
        topWeight: Math.max(...sets.map((s) => s.weight)),
        ...(best
          ? {
              estimated1RM: best.estimatedOneRepMax,
              estimateSource: { weight: best.weight, reps: best.reps },
            }
          : {}),
        sets,
      },
    ];
  });
}

export function projectExerciseStatistics(
  history: readonly WorkoutSession[],
  period: ProgressPeriodId,
  now: number,
  identityKey: string,
  metric: ExerciseMetric,
) {
  const allPoints = pointsFor(
    filterProgressWorkouts(history, period, now),
    identityKey,
  );
  const points = allPoints.filter((p) => p[metric] !== undefined);
  const aggregate = (items: ExerciseStatisticsPoint[]): number | undefined => {
    const values = items.flatMap((p) =>
      p[metric] === undefined ? [] : [p[metric]!],
    );
    return values.length
      ? metric === 'volume'
        ? finiteSum(values)
        : Math.max(...values)
      : undefined;
  };
  const value = aggregate(points);
  const start = progressPeriodStart(period, now);
  const previous =
    start === undefined
      ? undefined
      : aggregate(
          pointsFor(
            filterProgressWorkouts(history, period, start).filter(
              (s) => s.finishedAt! < start,
            ),
            identityKey,
          ),
        );
  const delta =
    value === undefined || previous === undefined
      ? undefined
      : value - previous;
  const tolerance =
    delta === undefined
      ? 0
      : Number.EPSILON *
        Math.max(1, value!, previous!) *
        Math.max(1, allPoints.length) *
        8;
  const comparison =
    start === undefined
      ? undefined
      : delta === undefined
        ? { kind: 'unavailable' as const }
        : {
            kind:
              Math.abs(delta) <= tolerance
                ? ('unchanged' as const)
                : delta > 0
                  ? ('increase' as const)
                  : ('decrease' as const),
            delta: Math.abs(delta) <= tolerance ? 0 : delta,
          };
  return {
    points,
    value,
    comparison,
    workoutCount: allPoints.length,
    setCount: allPoints.reduce((n, p) => n + p.sets.length, 0),
  };
}
