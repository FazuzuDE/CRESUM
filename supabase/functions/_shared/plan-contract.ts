// Pure transfer schema: shared by Edge Functions and the offline app adapter.
export type SharedTarget = {
  repMin: number;
  repMax: number;
  restMin: number;
  restMax: number;
  perSide?: boolean;
};
export type SharedPlanV1 = {
  schemaVersion: 1;
  title: string;
  exercises: {
    exerciseId: string;
    sets: number;
    weightKg?: string;
    target?: SharedTarget;
  }[];
};
export type SharedPlanExerciseV2 = SharedPlanV1['exercises'][number] & {
  exerciseGroup?: { id: string; familyId: string; name: string };
  plannedSets?: { id: string; weight?: string; reps?: string }[];
};
export type SharedPlanV2 = {
  schemaVersion: 2;
  title: string;
  exercises: SharedPlanExerciseV2[];
};
export type SharedPlan = SharedPlanV1 | SharedPlanV2;
export class PlanValidationError extends Error {
  constructor() {
    super('Invalid or unsupported workout plan.');
    this.name = 'PlanValidationError';
  }
}
function fail(): never {
  throw new PlanValidationError();
}
const record = (v: unknown): Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : fail();
const keys = (v: Record<string, unknown>, allowed: string[]) => {
  if (Object.keys(v).some((k) => !allowed.includes(k))) fail();
};
const integer = (v: unknown, min: number, max: number): number =>
  typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max
    ? v
    : fail();
export const utf8Bytes = (text: string): number => {
  let bytes = 0;
  for (const c of text) {
    const n = c.codePointAt(0)!;
    if (n >= 0xd800 && n <= 0xdfff) fail();
    bytes += n < 0x80 ? 1 : n < 0x800 ? 2 : n < 0x10000 ? 3 : 4;
  }
  return bytes;
};
export function validateSharedPlan(
  input: unknown,
  resolveExercise: (id: string) => string | null,
  resolveFamily?: (id: string) => string | null,
): SharedPlan {
  let raw: string;
  try {
    raw = typeof input === 'string' ? input : JSON.stringify(input);
  } catch {
    return fail();
  }
  if (typeof raw !== 'string' || utf8Bytes(raw) > 65536) fail();
  let v: Record<string, unknown>;
  try {
    v = record(typeof input === 'string' ? JSON.parse(input) : input);
  } catch {
    return fail();
  }
  keys(v, ['schemaVersion', 'title', 'exercises']);
  if (
    (v.schemaVersion !== 1 && v.schemaVersion !== 2) ||
    typeof v.title !== 'string' ||
    !v.title.trim() ||
    v.title.length > 120 ||
    !Array.isArray(v.exercises) ||
    v.exercises.length < 1 ||
    v.exercises.length > 50
  )
    fail();
  const seen = new Set<string>();
  const exercises = v.exercises.map((value) => {
    const e = record(value);
    keys(
      e,
      v.schemaVersion === 1
        ? ['exerciseId', 'sets', 'weightKg', 'target']
        : [
            'exerciseId',
            'sets',
            'weightKg',
            'target',
            'exerciseGroup',
            'plannedSets',
          ],
    );
    const id =
      typeof e.exerciseId === 'string' ? resolveExercise(e.exerciseId) : null;
    if (!id || seen.has(id)) return fail();
    seen.add(id);
    const item: SharedPlanExerciseV2 = {
      exerciseId: id,
      sets: integer(e.sets, 1, 20),
    };
    if (e.weightKg !== undefined) {
      if (
        typeof e.weightKg !== 'string' ||
        !/^\d+(\.\d+)?$/.test(e.weightKg) ||
        e.weightKg.length > 64 ||
        !Number.isFinite(Number(e.weightKg)) ||
        Number(e.weightKg) > 2000
      )
        fail();
      item.weightKg = e.weightKg as string;
    }
    if (e.target !== undefined) {
      const t = record(e.target);
      keys(t, ['repMin', 'repMax', 'restMin', 'restMax', 'perSide']);
      const target: SharedTarget = {
        repMin: integer(t.repMin, 1, 1000),
        repMax: integer(t.repMax, 1, 1000),
        restMin: integer(t.restMin, 0, 3600),
        restMax: integer(t.restMax, 0, 3600),
      };
      if (
        target.repMin > target.repMax ||
        target.restMin > target.restMax ||
        (t.perSide !== undefined && typeof t.perSide !== 'boolean')
      )
        fail();
      if (t.perSide !== undefined) target.perSide = t.perSide as boolean;
      item.target = target;
    }
    if (e.exerciseGroup !== undefined) {
      const g = record(e.exerciseGroup);
      keys(g, ['id', 'familyId', 'name']);
      for (const k of ['id', 'familyId', 'name'])
        if (
          typeof g[k] !== 'string' ||
          !(g[k] as string).trim() ||
          (g[k] as string).length > 160
        )
          fail();
      if (!resolveFamily || resolveFamily(id) !== g.familyId) fail();
      item.exerciseGroup = {
        id: g.id as string,
        familyId: g.familyId as string,
        name: g.name as string,
      };
    }
    if (e.plannedSets !== undefined) {
      if (!Array.isArray(e.plannedSets) || e.plannedSets.length !== item.sets)
        fail();
      const rowIds = new Set<string>();
      item.plannedSets = (e.plannedSets as unknown[]).map((value) => {
        const s = record(value);
        keys(s, ['id', 'weight', 'reps']);
        if (
          typeof s.id !== 'string' ||
          !s.id.trim() ||
          s.id.length > 160 ||
          rowIds.has(s.id)
        )
          return fail();
        rowIds.add(s.id);
        const row: NonNullable<SharedPlanExerciseV2['plannedSets']>[number] = {
          id: s.id,
        };
        if (s.weight !== undefined) {
          if (
            typeof s.weight !== 'string' ||
            !/^\d+(\.\d+)?$/.test(s.weight) ||
            s.weight.length > 64 ||
            !Number.isFinite(Number(s.weight)) ||
            Number(s.weight) > 2000
          )
            fail();
          row.weight = s.weight as string;
        }
        if (s.reps !== undefined) {
          if (
            typeof s.reps !== 'string' ||
            !/^\d+$/.test(s.reps) ||
            Number(s.reps) < 1 ||
            Number(s.reps) > 1000 ||
            !Number.isSafeInteger(Number(s.reps))
          )
            fail();
          row.reps = s.reps as string;
        }
        return row;
      });
    }
    return item;
  });
  const closed = new Set<string>();
  const groups = new Map<string, string>();
  let last: string | undefined;
  for (const e of exercises) {
    const g = e.exerciseGroup;
    if (last && last !== g?.id) closed.add(last);
    last = g?.id;
    if (!g) continue;
    if (closed.has(g.id)) fail();
    const snapshot = JSON.stringify(g);
    if (groups.has(g.id) && groups.get(g.id) !== snapshot) fail();
    groups.set(g.id, snapshot);
  }
  return v.schemaVersion === 1
    ? { schemaVersion: 1, title: v.title.trim(), exercises }
    : { schemaVersion: 2, title: v.title.trim(), exercises };
}
