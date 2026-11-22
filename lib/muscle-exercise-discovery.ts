import { exerciseLibrary } from './exercise-library';
import type { MuscleId } from './exercise-taxonomy';

type MuscleGroup =
  'chest' | 'arms' | 'back' | 'shoulders' | 'core' | 'hips' | 'legs';

const muscleAreas = {
  upper: {
    chest: { chest: true },
    arms: { biceps: true, triceps: true, forearms: true },
    back: { 'upper-back': true, lats: true, traps: true },
    shoulders: { 'front-delts': true, 'side-delts': true, 'rear-delts': true },
  },
  core: { core: { abs: true, 'lower-back': true } },
  lower: {
    hips: { glutes: true, adductors: true },
    legs: { quadriceps: true, hamstrings: true, calves: true },
  },
} as const satisfies Record<
  string,
  Partial<Record<MuscleGroup, Partial<Record<MuscleId, true>>>>
>;

export type MuscleArea = keyof typeof muscleAreas;
export const muscleAreaIds = Object.keys(muscleAreas) as MuscleArea[];

export function groupsForArea(area: MuscleArea) {
  return Object.entries(muscleAreas[area]).map(([group, ids]) => ({
    label: group as MuscleGroup,
    muscles: Object.keys(ids) as MuscleId[],
  }));
}

export type MuscleMatchMode = 'all' | 'any';

export function findMuscleExercises(
  selected: ReadonlySet<MuscleId>,
  mode: MuscleMatchMode,
) {
  if (!selected.size) return [];
  return exerciseLibrary
    .flatMap((exercise) => {
      const primary = [...selected].filter((id) =>
        exercise.primaryMuscles.includes(id),
      );
      const secondary = [...selected].filter(
        (id) => !primary.includes(id) && exercise.secondaryMuscles.includes(id),
      );
      const matched = primary.length + secondary.length;
      if (!matched || (mode === 'all' && matched < selected.size)) return [];
      return [{ exercise, primary, secondary }];
    })
    .sort(
      (a, b) =>
        b.primary.length - a.primary.length ||
        b.secondary.length - a.secondary.length,
    );
}
