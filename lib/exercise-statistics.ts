import { stableExerciseIdentity } from './progress-analytics';
import {
  filterProgressWorkouts,
  progressPeriodStart,
  type ProgressPeriodId,
} from './progress-periods';
import {
  completedSetMetrics,
  completedSetTimestamp,
  isBetterEstimate,
  type EstimatedSetCandidate,
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
  sets: (CompletedSetMetrics & {
    id: string;
    snapshotId: string;
    exerciseId: string;
  })[];
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
    let best:
      (EstimatedSetCandidate & { weight: number; reps: number }) | undefined;
    const sets = session.exercises.flatMap((exercise, exerciseIndex) => {
      const identity = stableExerciseIdentity(session, exercise);
      const matches =
        identityKey === 'family:goblet-squat'
          ? [
              'canonical:goblet-squat',
              'canonical:kettlebell-goblet-squat',
            ].includes(identity.identityKey)
          : identity.identityKey === identityKey;
      if (!matches) return [];
      return exercise.sets.flatMap((set, setIndex) => {
        const completedAt = completedSetTimestamp(set, session.finishedAt!);
        if (completedAt === undefined) return [];
        const metrics = completedSetMetrics(set);
        if (metrics?.estimatedOneRepMax !== undefined) {
          const candidate = {
            estimatedOneRepMax: metrics.estimatedOneRepMax,
            completedAt,
            workoutId: session.id,
            exerciseSnapshotId: exercise.id,
            setId: set.id,
            exerciseIndex,
            setIndex,
            weight: metrics.weight,
            reps: metrics.reps,
          };
          if (!best || isBetterEstimate(candidate, best)) best = candidate;
        }
        return metrics
          ? [
              {
                ...metrics,
                id: set.id,
                snapshotId: exercise.id,
                exerciseId: identity.exerciseId,
              },
            ]
          : [];
      });
    });
    if (!sets.length) return [];
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
