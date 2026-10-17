import { findExercise } from './exercise-library';
import { muscleTaxonomy } from './exercise-taxonomy';
import { filterProgressWorkouts } from './progress-periods';
import { completedSetTimestamp } from './workout-metrics';
import type { WorkoutSession } from './workout-model';

export type MusclePeriod = 'workout' | '7d' | '4w';
export type ParticipationSet = {
  workoutId: string;
  workoutName: string;
  date: number;
  exerciseId: string;
  libraryId: string;
  exerciseName: string;
  setId: string;
  setNumber: number;
  weight: string;
  reps: string;
  otherSideReps?: string;
  role: 'primary' | 'secondary';
};

/** Logged set participation using today's catalog; not stimulus, recovery or hard sets. */
export function projectMuscleParticipation(
  history: readonly WorkoutSession[],
  active: WorkoutSession | undefined,
  period: MusclePeriod,
  now: number,
) {
  if (!Number.isFinite(now) || now < 0)
    throw new RangeError('Invalid current time');
  const completed = filterProgressWorkouts([...history], 'ALL', now);
  const validActive =
    active &&
    active.finishedAt === undefined &&
    Number.isFinite(active.startedAt) &&
    active.startedAt >= 0 &&
    active.startedAt <= now
      ? active
      : undefined;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - (period === '7d' ? 7 : 28));
  const sessions =
    period === 'workout'
      ? validActive
        ? [validActive]
        : completed.slice(-1)
      : completed.filter((session) => session.finishedAt! >= +cutoff);
  const muscles = muscleTaxonomy.map((muscle) => ({
    ...muscle,
    primary: 0,
    secondary: 0,
    sets: [] as ParticipationSet[],
  }));
  let totalSets = 0;
  let unmappedSets = 0;
  for (const session of sessions) {
    for (const exercise of session.exercises) {
      const catalog = findExercise(exercise.libraryId);
      exercise.sets.forEach((set, index) => {
        const timestamp = completedSetTimestamp(set, session.finishedAt ?? NaN);
        if (
          timestamp === undefined ||
          timestamp < session.startedAt ||
          timestamp > (session.finishedAt ?? now)
        )
          return;
        totalSets++;
        if (!catalog) {
          unmappedSets++;
          return;
        }
        for (const muscle of muscles) {
          const role = catalog.primaryMuscles.includes(muscle.id)
            ? 'primary'
            : catalog.secondaryMuscles.includes(muscle.id)
              ? 'secondary'
              : undefined;
          if (!role) continue;
          muscle[role]++;
          muscle.sets.push({
            workoutId: session.id,
            workoutName: session.name,
            date: session.finishedAt ?? now,
            exerciseId: exercise.id,
            libraryId: catalog.id,
            exerciseName: exercise.name,
            setId: set.id,
            setNumber: index + 1,
            weight: set.weight,
            reps: set.reps,
            otherSideReps: set.otherSideReps,
            role,
          });
        }
      });
    }
  }
  return {
    muscles,
    totalSets,
    unmappedSets,
    context:
      period === 'workout'
        ? validActive
          ? 'Current workout'
          : 'Latest completed workout'
        : period === '7d'
          ? 'Last 7 days'
          : 'Last 4 weeks',
    workoutName: period === 'workout' ? sessions[0]?.name : undefined,
  };
}
export type MuscleParticipation = ReturnType<typeof projectMuscleParticipation>;
