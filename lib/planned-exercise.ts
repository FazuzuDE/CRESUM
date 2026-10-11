import type { ExerciseTarget, PlannedExercise } from './workout-model';

export const validExerciseTarget = (
  value: unknown,
): value is ExerciseTarget => {
  if (typeof value !== 'object' || value === null) return false;
  const t = value as Record<string, unknown>;
  return (
    ['repMin', 'repMax', 'restMin', 'restMax', 'revision'].every(
      (k) =>
        typeof t[k] === 'number' && Number.isInteger(t[k]) && Number(t[k]) > 0,
    ) &&
    Number(t.repMin) <= Number(t.repMax) &&
    Number(t.restMin) <= Number(t.restMax) &&
    Number(t.restMax) <= 3600 &&
    (t.perSide === undefined || typeof t.perSide === 'boolean') &&
    typeof t.programId === 'string' &&
    t.programId.length > 0 &&
    Array.isArray(t.sourceRefs) &&
    t.sourceRefs.length > 0 &&
    t.sourceRefs.every((s) => typeof s === 'string')
  );
};
export const MAX_PLANNED_SETS = 20;

export const validPlannedSets = (sets: unknown): sets is number =>
  typeof sets === 'number' &&
  Number.isInteger(sets) &&
  sets >= 1 &&
  sets <= MAX_PLANNED_SETS;

export const normalizePlannedWeight = (weight: string): string | null => {
  const normalized = weight.replace(',', '.').trim();
  if (!/^\d+(\.\d+)?$/.test(normalized) || !Number.isFinite(Number(normalized)))
    return null;
  return normalized;
};

export const validPlannedExerciseShape = (
  value: unknown,
): value is PlannedExercise => {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.exerciseId === 'string' &&
    validPlannedSets(item.sets) &&
    (item.target === undefined || validExerciseTarget(item.target)) &&
    (item.weight === undefined ||
      (typeof item.weight === 'string' &&
        normalizePlannedWeight(item.weight) !== null))
  );
};
