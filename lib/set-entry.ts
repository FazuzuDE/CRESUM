import { isWorkoutFragment } from './workout-snapshot-id';
import { findExercise } from './exercise-library';
import { AppError } from './app-error';
import { normalizeDecimalInput, normalizeInputDigits } from './i18n/format';
import { exerciseIdsMatch, setInputIsValid, updateSet } from './workout-engine';
import {
  isSetComplete,
  type WorkoutExercise,
  type WorkoutSession,
  type WorkoutSet,
} from './workout-model';
export type SetValues = Pick<WorkoutSet, 'weight' | 'reps' | 'otherSideReps'>;
export function entryStep(id: string): number {
  const equipment = findExercise(id)?.equipment ?? [];
  if (equipment.includes('barbell')) return 2.5;
  if (equipment.includes('dumbbell') || equipment.includes('kettlebell'))
    return 1;
  if (equipment.includes('machine') || equipment.includes('cable')) return 5;
  return 2.5;
}
export function normalizedEntry(v: SetValues): SetValues {
  return {
    weight: normalizeDecimalInput(v.weight) ?? v.weight.trim(),
    reps: normalizeInputDigits(v.reps).trim(),
    ...(v.otherSideReps === undefined
      ? {}
      : { otherSideReps: normalizeInputDigits(v.otherSideReps).trim() }),
  };
}
export function entryIsValid(v: SetValues, id: string): boolean {
  return (
    setInputIsValid({ id: 'draft', ...v }) &&
    (id !== 'bodyweight-step-up' || Number(v.weight.replace(',', '.')) === 0)
  );
}
export function weightOptions(value: string, step: number): string[] {
  const values = Array.from({ length: Math.floor(500 / step) + 1 }, (_, i) =>
      String(i * step),
    ),
    exact = Number(value.replace(',', '.'));
  if (
    value.trim() &&
    Number.isFinite(exact) &&
    exact >= 0 &&
    !values.includes(value.trim().replace(',', '.'))
  )
    values.push(value.trim().replace(',', '.'));
  return values.sort((a, b) => Number(a) - Number(b));
}
export function repOptions(value: string): string[] {
  const values = Array.from({ length: 100 }, (_, i) => String(i + 1)),
    exact = Number(value);
  if (Number.isInteger(exact) && exact > 0 && !values.includes(value.trim()))
    values.push(value.trim());
  return values.sort((a, b) => Number(a) - Number(b));
}
export function adjustEntry(
  value: string,
  direction: number,
  step: number,
  minimum: number,
): string {
  const n = Number(value.replace(',', '.'));
  if (!value.trim() || !Number.isFinite(n) || n < minimum) return value;
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalized)) return value;
  // Decimal arithmetic keeps precise manual loads intact, without binary rounding.
  const precision = Math.max(
    normalized.split('.')[1]?.length ?? 0,
    String(step).split('.')[1]?.length ?? 0,
  );
  const scale = 10n ** BigInt(precision);
  const units = (text: string) => {
    const [whole, fraction = ''] = text.split('.');
    return (
      BigInt(whole) * scale + BigInt(fraction.padEnd(precision, '0') || '0')
    );
  };
  const candidate = units(normalized) + BigInt(direction) * units(String(step));
  const result =
    candidate < BigInt(minimum) * scale ? BigInt(minimum) * scale : candidate;
  const fraction = (result % scale)
    .toString()
    .padStart(precision, '0')
    .replace(/0+$/, '');
  return (result / scale).toString() + (fraction ? '.' + fraction : '');
}
export function suggestSetValues(
  exercise: WorkoutExercise,
  set: WorkoutSet,
  previous?: WorkoutSet,
): SetValues {
  if (set.entered) return normalizedEntry(set);
  const bilateral = set.otherSideReps !== undefined;
  const target =
    exercise.target && (!bilateral || exercise.target.perSide)
      ? String(exercise.target.repMin)
      : '';
  // Older snapshots have no source flag. Their built-in 10 is ambiguous.
  const explicitReps = set.plannedReps || (set.reps && set.reps !== '10');
  return {
    weight: set.weight || previous?.weight || '',
    reps: explicitReps ? set.reps : target || previous?.reps || set.reps,
    ...(bilateral
      ? {
          otherSideReps:
            set.otherSideReps ||
            (explicitReps ? set.reps : target) ||
            previous?.otherSideReps ||
            '',
        }
      : {}),
  };
}

export function saveSetEntry(
  session: WorkoutSession,
  sessionId: string,
  exerciseId: string,
  setId: string,
  values: SetValues,
  markEntered = true,
): WorkoutSession {
  if (session.id !== sessionId || session.finishedAt !== undefined)
    return session;
  const e = session.exercises.findIndex((x) => x.id === exerciseId),
    s = session.exercises[e]?.sets.findIndex((x) => x.id === setId) ?? -1;
  if (e < 0 || s < 0 || isSetComplete(session.exercises[e].sets[s]))
    return session;
  const original = session.exercises[e].sets[s],
    draft = normalizedEntry(values);
  if (
    (original.otherSideReps === undefined) !==
      (draft.otherSideReps === undefined) ||
    !entryIsValid(draft, session.exercises[e].libraryId)
  )
    throw new AppError(
      'invalid_set_entry',
      'Enter a valid weight and positive whole repetitions for each side.',
    );
  const saved = normalizedEntry(original);
  if (
    saved.weight === draft.weight &&
    saved.reps === draft.reps &&
    saved.otherSideReps === draft.otherSideReps
  )
    return session;
  return updateSet(session, e, s, draft, markEntered);
}
// New fragments carry their origin in the ID. The finish cutoff also excludes
// untagged legacy fragments created during the current session.
export function isPriorWorkout(
  item: WorkoutSession,
  session?: WorkoutSession,
): boolean {
  return (
    item.finishedAt !== undefined &&
    !isWorkoutFragment(item.id) &&
    (!session ||
      (item.id !== session.id && item.finishedAt <= session.startedAt))
  );
}
export function previousExercise(
  history: readonly WorkoutSession[],
  libraryId: string,
  session?: WorkoutSession,
): WorkoutExercise | undefined {
  return [...history]
    .filter((item) => isPriorWorkout(item, session))
    .sort((a, b) => b.finishedAt! - a.finishedAt!)
    .flatMap((item) => item.exercises)
    .find((exercise) => exerciseIdsMatch(exercise.libraryId, libraryId));
}

export function previousEntry(
  history: readonly WorkoutSession[],
  libraryId: string,
  index: number,
  session?: WorkoutSession,
): WorkoutSet | undefined {
  const set = previousExercise(history, libraryId, session)?.sets[index];
  return set && isSetComplete(set) ? set : undefined;
}
