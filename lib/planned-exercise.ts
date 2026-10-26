import type {
  ExerciseTarget,
  PlannedTarget,
  PlannedExercise,
  ExerciseGroupSnapshot,
  PlannedSet,
} from './workout-model';

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
export const validPlannedTarget = (value: unknown): value is PlannedTarget => {
  if (typeof value !== 'object' || value === null) return false;
  const t = value as Record<string, unknown>;
  if (t.kind !== 'authored') return validExerciseTarget(value);
  return (
    Object.keys(t).every((k) =>
      ['kind', 'repMin', 'repMax', 'restMin', 'restMax', 'perSide'].includes(k),
    ) &&
    ['repMin', 'repMax', 'restMin', 'restMax'].every(
      (k) => typeof t[k] === 'number' && Number.isSafeInteger(t[k]),
    ) &&
    Number(t.repMin) >= 1 &&
    Number(t.repMax) <= 1000 &&
    Number(t.repMin) <= Number(t.repMax) &&
    Number(t.restMin) >= 0 &&
    Number(t.restMax) <= 3600 &&
    Number(t.restMin) <= Number(t.restMax) &&
    (t.perSide === undefined || typeof t.perSide === 'boolean')
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

export function validExerciseGroup(
  value: unknown,
): value is ExerciseGroupSnapshot {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return false;
  const v = value as Record<string, unknown>;
  return (
    Object.keys(v).every((k) => ['id', 'familyId', 'name'].includes(k)) &&
    ['id', 'familyId', 'name'].every(
      (k) =>
        typeof v[k] === 'string' &&
        (v[k] as string).trim().length > 0 &&
        (v[k] as string).length <= 160,
    )
  );
}

export function validPlannedSet(value: unknown): value is PlannedSet {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return false;
  const v = value as Record<string, unknown>;
  return (
    Object.keys(v).every((k) => ['id', 'weight', 'reps'].includes(k)) &&
    typeof v.id === 'string' &&
    v.id.trim().length > 0 &&
    v.id.length <= 160 &&
    (v.weight === undefined ||
      (typeof v.weight === 'string' &&
        normalizePlannedWeight(v.weight) !== null)) &&
    (v.reps === undefined ||
      (typeof v.reps === 'string' &&
        /^\d+$/.test(v.reps) &&
        Number.isSafeInteger(Number(v.reps)) &&
        Number(v.reps) > 0 &&
        Number(v.reps) <= 1000))
  );
}

export const validPlannedExerciseShape = (
  value: unknown,
): value is PlannedExercise => {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.exerciseId === 'string' &&
    validPlannedSets(item.sets) &&
    (item.exerciseGroup === undefined ||
      validExerciseGroup(item.exerciseGroup)) &&
    (item.plannedSets === undefined ||
      (Array.isArray(item.plannedSets) &&
        item.plannedSets.length === item.sets &&
        item.plannedSets.every(validPlannedSet) &&
        new Set(item.plannedSets.map((s) => s.id)).size ===
          item.plannedSets.length)) &&
    (item.target === undefined || validPlannedTarget(item.target)) &&
    (item.weight === undefined ||
      (typeof item.weight === 'string' &&
        normalizePlannedWeight(item.weight) !== null))
  );
};
