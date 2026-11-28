import { isPriorWorkout } from './set-entry';
import { canonicalExerciseId } from './exercise-library';
import { volume } from './workout-metrics';
import { isSetComplete, type WorkoutSession } from './workout-model';

const exerciseSignature = (session: WorkoutSession) =>
  JSON.stringify(
    session.exercises
      .map(({ libraryId }) => canonicalExerciseId(libraryId) ?? libraryId)
      .sort(),
  );

export function workoutRecap(
  session: WorkoutSession,
  history: readonly WorkoutSession[],
) {
  const signature = exerciseSignature(session);
  let previous: WorkoutSession | undefined;
  for (const item of history) {
    if (
      isPriorWorkout(item, session) &&
      item.finishedAt !== undefined &&
      item.templateId === session.templateId &&
      (!previous || item.finishedAt > previous.finishedAt!) &&
      exerciseSignature(item) === signature
    )
      previous = item;
  }

  const totalVolume = volume(session);
  const previousVolume = previous && volume(previous);
  const change =
    previousVolume === undefined ? undefined : totalVolume - previousVolume;
  const performed = session.exercises.filter(
    ({ sets, cardio }) =>
      sets.some(isSetComplete) || (cardio?.elapsedMs ?? 0) > 0,
  );
  return {
    exercises: new Set(
      performed.map((exercise) => exercise.exerciseGroup?.id ?? exercise.id),
    ).size,
    totalVolume,
    change,
    fraction:
      previousVolume !== undefined && previousVolume > 0 && change !== undefined
        ? change / previousVolume
        : undefined,
  };
}
