import { canonicalExerciseId } from './exercise-library';
import {
  completedSetMetrics,
  completedSetTimestamp,
  volume,
  isBetterEstimate,
  type EstimatedSetCandidate,
} from './workout-metrics';
import type { WorkoutSession } from './workout-model';

export type WorkoutVolume = {
  workoutId: string;
  workoutName: string;
  finishedAt: number;
  volume: number;
};

export type EstimatedOneRepMaxRecord = {
  identityKey: string;
  exerciseId: string;
  name: string;
  weight: number;
  reps: number;
  estimatedOneRepMax: number;
  recordedAt: number;
};

export type ProgressAnalytics = {
  totalVolume: number;
  workoutVolumes: WorkoutVolume[];
  estimatedOneRepMaxRecords: EstimatedOneRepMaxRecord[];
  excludedSampleCount: number;
};

type RecordCandidate = Omit<EstimatedOneRepMaxRecord, 'name'> &
  EstimatedSetCandidate & {
    sourceKey: string;
  };

type LabelCandidate = {
  name: string;
  finishedAt: number;
  completedAt: number;
  sourceKey: string;
};

type ExerciseAggregate = {
  best?: RecordCandidate;
  label: LabelCandidate;
};

export type StableExerciseIdentity = {
  identityKey: string;
  exerciseId: string;
};

const completedAt = (session: WorkoutSession): number =>
  session.finishedAt ?? session.startedAt;

export const stableExerciseIdentity = (
  session: WorkoutSession,
  exercise: WorkoutSession['exercises'][number],
): StableExerciseIdentity => {
  const savedId = exercise.libraryId.trim();
  const canonicalId = canonicalExerciseId(savedId);
  if (canonicalId) {
    return {
      identityKey: `canonical:${canonicalId}`,
      exerciseId: canonicalId,
    };
  }
  if (savedId) {
    return {
      identityKey: `unknown:${JSON.stringify(savedId)}`,
      exerciseId: savedId,
    };
  }
  const snapshotKey = `snapshot:${JSON.stringify([session.id, exercise.id])}`;
  return { identityKey: snapshotKey, exerciseId: snapshotKey };
};

const sourceWinsTie = (left: string, right: string): boolean => left < right;

const isNewerLabel = (
  candidate: LabelCandidate,
  current: LabelCandidate,
): boolean =>
  candidate.finishedAt > current.finishedAt ||
  (candidate.finishedAt === current.finishedAt &&
    (candidate.completedAt > current.completedAt ||
      (candidate.completedAt === current.completedAt &&
        sourceWinsTie(candidate.sourceKey, current.sourceKey))));

const compareDescending = (left: number, right: number): number =>
  left === right ? 0 : left > right ? -1 : 1;

export const projectProgressAnalytics = (
  history: readonly WorkoutSession[],
): ProgressAnalytics => {
  const aggregates = new Map<string, ExerciseAggregate>();
  let excludedSampleCount = 0;

  const workoutVolumes = history
    .map((session) => ({
      workoutId: session.id,
      workoutName: session.name,
      finishedAt: completedAt(session),
      volume: volume(session),
    }))
    .sort(
      (left, right) =>
        compareDescending(left.finishedAt, right.finishedAt) ||
        left.workoutId.localeCompare(right.workoutId),
    );

  for (const session of history) {
    for (const [exerciseIndex, exercise] of session.exercises.entries()) {
      const identity = stableExerciseIdentity(session, exercise);
      for (const [setIndex, savedSet] of exercise.sets.entries()) {
        const recordedAt = completedSetTimestamp(
          savedSet,
          completedAt(session),
        );
        if (recordedAt === undefined) continue;
        const metrics = completedSetMetrics(savedSet);
        if (!metrics) {
          excludedSampleCount += 1;
          continue;
        }

        const sourceKey = JSON.stringify([
          session.id,
          exercise.id,
          savedSet.id,
        ]);
        const label: LabelCandidate = {
          name: exercise.name,
          finishedAt: completedAt(session),
          completedAt: recordedAt,
          sourceKey,
        };
        let current = aggregates.get(identity.identityKey);
        if (!current) {
          current = { label };
          aggregates.set(identity.identityKey, current);
        } else if (isNewerLabel(label, current.label)) current.label = label;
        if (metrics.estimatedOneRepMax === undefined) continue;
        const record: RecordCandidate = {
          identityKey: identity.identityKey,
          exerciseId: identity.exerciseId,
          weight: metrics.weight,
          reps: metrics.reps,
          estimatedOneRepMax: metrics.estimatedOneRepMax,
          recordedAt,
          sourceKey,
          completedAt: recordedAt,
          workoutId: session.id,
          exerciseSnapshotId: exercise.id,
          setId: savedSet.id,
          exerciseIndex,
          setIndex,
        };
        if (!current.best || isBetterEstimate(record, current.best))
          current.best = record;
      }
    }
  }

  const estimatedOneRepMaxRecords = [...aggregates.values()]
    .flatMap(({ best, label }) =>
      best
        ? [
            {
              identityKey: best.identityKey,
              exerciseId: best.exerciseId,
              name: label.name,
              weight: best.weight,
              reps: best.reps,
              estimatedOneRepMax: best.estimatedOneRepMax,
              recordedAt: best.recordedAt,
            },
          ]
        : [],
    )
    .sort(
      (left, right) =>
        compareDescending(left.estimatedOneRepMax, right.estimatedOneRepMax) ||
        compareDescending(left.recordedAt, right.recordedAt) ||
        left.identityKey.localeCompare(right.identityKey),
    );

  const totalVolume = workoutVolumes.reduce((total, item) => {
    const next = total + item.volume;
    return Number.isFinite(next) ? next : total;
  }, 0);

  return {
    totalVolume,
    workoutVolumes,
    estimatedOneRepMaxRecords,
    excludedSampleCount,
  };
};
