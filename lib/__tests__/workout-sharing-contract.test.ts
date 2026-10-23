import { parseSharedPlan } from '../workout-sharing/contract';
import { exportSharedPlan, sharedPlanDraft } from '../workout-sharing/adapter';
import { validExerciseTarget, validPlannedTarget } from '../planned-exercise';
import { startWorkout } from '../workout-engine';
import { exerciseLibrary } from '../workout-catalog';
import {
  encodeHistoryWorkout,
  decodeHistoryWorkout,
} from '../sync/history-mapper';

const plan = () => ({
  schemaVersion: 1,
  title: 'День A',
  exercises: [
    {
      exerciseId: 'barbell-bench-press',
      sets: 3,
      weightKg: '12.50',
      target: { repMin: 8, repMax: 12, restMin: 0, restMax: 90 },
    },
  ],
});

test('imports authored targets without fabricating research provenance and preserves exact weight', () => {
  const draft = sharedPlanDraft(parseSharedPlan(plan()));
  expect(draft.plannedExercises?.[0]).toEqual({
    exerciseId: 'barbell-bench-press',
    sets: 3,
    weight: '12.50',
    target: {
      kind: 'authored',
      repMin: 8,
      repMax: 12,
      restMin: 0,
      restMax: 90,
    },
  });
  expect(validPlannedTarget(draft.plannedExercises![0].target)).toBe(true);
  expect(validExerciseTarget(draft.plannedExercises![0].target)).toBe(false);
  const session = startWorkout(
    { id: 'imported', ...draft },
    exerciseLibrary,
    100,
    () => 'id',
  );
  expect(session.exercises[0].sets).toHaveLength(3);
  expect(session.exercises[0].target).toEqual(
    draft.plannedExercises![0].target,
  );
});

test('exports only plan data and opts weights out by default', () => {
  const template = {
    id: 'local-secret',
    ...sharedPlanDraft(parseSharedPlan(plan())),
  };
  expect(exportSharedPlan(template, false)).toEqual({
    schemaVersion: 1,
    title: 'День A',
    exercises: [
      {
        exerciseId: 'barbell-bench-press',
        sets: 3,
        target: { repMin: 8, repMax: 12, restMin: 0, restMax: 90 },
      },
    ],
  });
  expect(exportSharedPlan(template, true).exercises[0].weightKg).toBe('12.50');
});

test.each([
  ['title', () => ({ ...plan(), title: 'x'.repeat(121) })],
  ['empty title', () => ({ ...plan(), title: ' ' })],
  ['version', () => ({ ...plan(), schemaVersion: 2 })],
  [
    'sets',
    () => ({ ...plan(), exercises: [{ ...plan().exercises[0], sets: 21 }] }),
  ],
  [
    'fractional sets',
    () => ({ ...plan(), exercises: [{ ...plan().exercises[0], sets: 1.5 }] }),
  ],
  [
    'unknown exercise',
    () => ({ ...plan(), exercises: [{ exerciseId: 'made-up', sets: 1 }] }),
  ],
  [
    'alias duplicates',
    () => ({
      ...plan(),
      exercises: [
        { exerciseId: 'bench', sets: 1 },
        { exerciseId: 'barbell-bench-press', sets: 1 },
      ],
    }),
  ],
  [
    'non-finite target',
    () => ({
      ...plan(),
      exercises: [
        {
          ...plan().exercises[0],
          target: { ...plan().exercises[0].target, repMax: Infinity },
        },
      ],
    }),
  ],
  [
    'reversed range',
    () => ({
      ...plan(),
      exercises: [
        {
          ...plan().exercises[0],
          target: { ...plan().exercises[0].target, repMin: 15 },
        },
      ],
    }),
  ],
  [
    'weight upper bound',
    () => ({
      ...plan(),
      exercises: [{ ...plan().exercises[0], weightKg: '2000.01' }],
    }),
  ],
  [
    'negative weight',
    () => ({
      ...plan(),
      exercises: [{ ...plan().exercises[0], weightKg: '-1' }],
    }),
  ],
  ['oversized document', () => ({ ...plan(), extra: 'x'.repeat(65536) })],
  [
    'unexpected executable/remote content',
    () => ({ ...plan(), imageUrl: 'https://evil.example/image' }),
  ],
])('rejects %s', (_, input) =>
  expect(() => parseSharedPlan(input())).toThrow(),
);

test('accepts exact title, set, numeric boundaries and returns detached data', () => {
  const p = { ...plan(), title: 'x'.repeat(120) };
  p.exercises[0].sets = 20;
  p.exercises[0].weightKg = '2000';
  p.exercises[0].target = {
    repMin: 1,
    repMax: 1000,
    restMin: 0,
    restMax: 3600,
  };
  const parsed = parseSharedPlan(p);
  p.exercises[0].sets = 1;
  expect(parsed.exercises[0].sets).toBe(20);
});

test('enforces maximum exercise count before catalog resolution', () => {
  expect(() =>
    parseSharedPlan({
      ...plan(),
      exercises: Array.from({ length: 51 }, (_, i) => ({
        exerciseId: `id-${i}`,
        sets: 1,
      })),
    }),
  ).toThrow();
  const ids = exerciseLibrary
    .filter((e) => !e.measurement || e.measurement === 'repetitions')
    .slice(0, 50)
    .map((e) => e.id);
  expect(
    parseSharedPlan({
      ...plan(),
      exercises: ids.map((exerciseId) => ({ exerciseId, sets: 1 })),
    }).exercises,
  ).toHaveLength(50);
});

test('canonicalizes aliases and rejects invalid JSON', () => {
  expect(
    parseSharedPlan({
      ...plan(),
      exercises: [{ exerciseId: 'bench', sets: 1 }],
    }).exercises[0].exerciseId,
  ).toBe('barbell-bench-press');
  expect(() => parseSharedPlan('{bad')).toThrow();
});

test('retains authored target in completed history mapping', () => {
  const session = startWorkout(
    { id: 't', ...sharedPlanDraft(parseSharedPlan(plan())) },
    exerciseLibrary,
    100,
    () => 'id',
  );
  session.finishedAt = 200;
  expect(
    decodeHistoryWorkout(encodeHistoryWorkout(session)).exercises[0].target,
  ).toEqual({
    kind: 'authored',
    repMin: 8,
    repMax: 12,
    restMin: 0,
    restMax: 90,
  });
});

test('exports legacy template aliases with their planned counts and default engine set count', () => {
  const result = exportSharedPlan(
    {
      id: 'legacy',
      name: 'Legacy',
      exerciseIds: ['bench', 'row'],
      plannedExercises: [
        { exerciseId: 'barbell-bench-press', sets: 4, weight: '15,50' },
      ],
    },
    true,
  );
  expect(result.exercises).toEqual([
    { exerciseId: 'barbell-bench-press', sets: 4, weightKg: '15.50' },
    { exerciseId: 'seated-cable-row', sets: 3 },
  ]);
});
