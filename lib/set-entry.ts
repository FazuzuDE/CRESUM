import { findExercise } from './exercise-library';
import { normalizeDecimalInput } from './i18n/format';
import { exerciseIdsMatch, setInputIsValid, updateSet } from './workout-engine';
import {
  isSetComplete,
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
    reps: v.reps.trim(),
    ...(v.otherSideReps === undefined
      ? {}
      : { otherSideReps: v.otherSideReps.trim() }),
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
export function saveSetEntry(
  session: WorkoutSession,
  sessionId: string,
  exerciseId: string,
  setId: string,
  values: SetValues,
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
    throw new Error(
      'Enter a valid weight and positive whole repetitions for each side.',
    );
  return updateSet(session, e, s, draft);
}
export function previousEntry(
  history: WorkoutSession[],
  libraryId: string,
  index: number,
): WorkoutSet | undefined {
  const previous = [...history]
    .filter((x) => x.finishedAt !== undefined)
    .sort((a, b) => b.finishedAt! - a.finishedAt!)
    .find((x) =>
      x.exercises.some((e) => exerciseIdsMatch(e.libraryId, libraryId)),
    );
  const set = previous?.exercises.find((e) =>
    exerciseIdsMatch(e.libraryId, libraryId),
  )?.sets[index];
  return set && isSetComplete(set) ? set : undefined;
}
