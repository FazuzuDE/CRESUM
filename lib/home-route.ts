import { findExercise } from './exercise-library';
import { filterProgressWorkouts } from './progress-periods';
import { isPriorWorkout } from './set-entry';
import type { ProgramAssignment } from './training-programs/assignment';
import { localDate, projectProgramWeek } from './training-programs/schedule';
import { completedSetMetrics } from './workout-metrics';
import type { WorkoutSession } from './workout-model';

export function routeWeekCounts(
  assignment: ProgramAssignment | null | undefined,
  history: WorkoutSession[],
  timestamps: number[],
) {
  if (!assignment || assignment.scheduleSkipped) return undefined;
  const weeks = new Set<number>();
  const dates = new Set(timestamps.map((time) => localDate(new Date(time))));
  let planned = 0;
  let completed = 0;
  for (const date of dates) {
    if (date < assignment.startDate) continue;
    const week = projectProgramWeek(assignment, history, date);
    if (weeks.has(week.weekIndex)) continue;
    weeks.add(week.weekIndex);
    for (const slot of week.slots) {
      if (!dates.has(slot.date)) continue;
      planned++;
      if (slot.completedWorkoutIds.length) completed++;
    }
  }
  return planned ? { completed, planned } : undefined;
}

export function routeComparison(history: WorkoutSession[], now: number) {
  const dated = filterProgressWorkouts(history, 'ALL', now)
    .filter((item) => isPriorWorkout(item))
    .sort((a, b) => b.finishedAt! - a.finishedAt!);
  const latest = dated[0];
  if (!latest) return undefined;
  const comparable = dated.find(
    (session) =>
      session.id !== latest.id &&
      session.templateId === latest.templateId &&
      session.finishedAt! < latest.finishedAt!,
  );
  if (!comparable || latest.templateId === 'ad-hoc') return undefined;
  for (const exercise of latest.exercises) {
    const definition = findExercise(exercise.libraryId);
    if (!definition || exercise.cardio || definition.perSide) continue;
    const candidates = comparable.exercises.filter(
      (item) => item.libraryId === exercise.libraryId && !item.cardio,
    );
    if (
      candidates.length !== 1 ||
      latest.exercises.filter((item) => item.libraryId === exercise.libraryId)
        .length !== 1
    )
      continue;
    for (let i = 0; i < exercise.sets.length; i++) {
      const current = completedSetMetrics(exercise.sets[i]);
      const previousSet = candidates[0].sets[i];
      const previous = previousSet && completedSetMetrics(previousSet);
      if (
        !current ||
        !previous ||
        current.reps !== previous.reps ||
        current.otherSideReps !== undefined ||
        previous.otherSideReps !== undefined ||
        current.weight <= 0 ||
        previous.weight <= 0 ||
        current.weight === previous.weight
      )
        continue;
      return {
        exerciseId: definition.id,
        name: definition.name,
        previous,
        current,
      };
    }
  }
  return undefined;
}

export function previousPlanSet(
  sessions: readonly WorkoutSession[],
  templateId: string,
  exerciseId: string,
  now: number,
) {
  const candidates = sessions
    .filter(
      (item) =>
        item.templateId === templateId &&
        isPriorWorkout(item) &&
        item.finishedAt! <= now,
    )
    .slice()
    .sort((a, b) => b.finishedAt! - a.finishedAt!);
  for (const session of candidates) {
    const matches = session.exercises.filter(
      (item) => item.libraryId === exerciseId && !item.cardio,
    );
    if (matches.length !== 1) continue;
    const set = matches[0].sets[0];
    const previous = set && completedSetMetrics(set);
    if (previous && previous.otherSideReps === undefined) return previous;
  }
  return undefined;
}
