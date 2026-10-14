import { projectExerciseStatistics } from '../exercise-statistics';
import type { WorkoutSession, WorkoutSet } from '../workout-model';

const now = new Date(2026, 9, 14, 12).getTime();
const at = (daysAgo: number) => now - daysAgo * 86400000;
const set = (id: string, weight = '60', reps = '10'): WorkoutSet => ({
  id,
  weight,
  reps,
  completedAt: at(1),
});
const workout = (
  id: string,
  daysAgo: number,
  sets: WorkoutSet[],
  libraryId = 'bench',
): WorkoutSession => ({
  id,
  name: id,
  templateId: 't',
  startedAt: at(daysAgo) - 60000,
  finishedAt: at(daysAgo),
  currentExerciseIndex: 0,
  restDurationSeconds: 90,
  exercises: [
    {
      id: id + '-exercise',
      libraryId,
      name: 'Same label',
      muscle: 'Chest',
      sets,
    },
  ],
});
const key = 'canonical:barbell-bench-press';

it('never merges generic and exact machine variants with the same saved label', () => {
  const history = [
    workout('generic', 2, [set('g', '100')], 'lat-pulldown'),
    workout('wide', 1, [set('w', '80')], 'lat-pulldown-wide-pronated-bar'),
    workout(
      'close',
      1,
      [set('c', '40')],
      'lat-pulldown-close-neutral-v-handle',
    ),
  ];
  const result = projectExerciseStatistics(
    history,
    '1M',
    now,
    'canonical:lat-pulldown-close-neutral-v-handle',
    'volume',
  );
  expect(result.points.map((p) => p.workoutId)).toEqual(['close']);
  expect(result.value).toBe(400);
});

it('does not report floating-point roundoff as progress', () => {
  const history = [
    workout('previous', 31, [set('p', '0.3', '1')]),
    workout('current', 1, [set('c', '0.1', '3')]),
  ];
  expect(
    projectExerciseStatistics(history, '1M', now, key, 'volume').comparison,
  ).toEqual({ kind: 'unchanged', delta: 0 });
});

it('groups repeated snapshots into one workout point and excludes plans and variants', () => {
  const w = workout('current', 1, [
    set('a'),
    { id: 'draft', weight: '200', reps: '10' },
  ]);
  w.exercises.push({
    ...w.exercises[0],
    id: 'repeat',
    libraryId: 'barbell-bench-press',
    sets: [set('b', '70', '5')],
  });
  const history = [
    w,
    workout('other', 2, [set('c', '200')], 'lat-pulldown'),
    workout('future', -1, [set('f')]),
  ];
  const before = JSON.stringify(history);
  const result = projectExerciseStatistics(history, '1M', now, key, 'volume');
  expect(result.points).toHaveLength(1);
  expect(result.value).toBe(950);
  expect(result.setCount).toBe(2);
  expect(result.workoutCount).toBe(1);
  expect(result.points[0].sets.map((s) => s.id)).toEqual(['a', 'b']);
  expect(JSON.stringify(history)).toBe(before);
});

it('uses period maxima for strength and sums for volume with disjoint previous periods', () => {
  const history = [
    workout('previous', 31, [set('p', '50')]),
    workout('boundary', 30, [set('b', '60')]),
    workout('latest', 1, [set('n', '70')]),
  ];
  expect(
    projectExerciseStatistics(history, '1M', now, key, 'volume').comparison
      ?.delta,
  ).toBe(800);
  expect(
    projectExerciseStatistics(history, '1M', now, key, 'topWeight').value,
  ).toBe(70);
  expect(
    projectExerciseStatistics(history, '1M', now, key, 'topWeight').comparison
      ?.delta,
  ).toBe(20);
  expect(
    projectExerciseStatistics(history, '1M', now, key, 'estimated1RM').value,
  ).toBeCloseTo(70 * (1 + 10 / 30));
  expect(
    projectExerciseStatistics(history, 'ALL', now, key, 'volume').comparison,
  ).toBeUndefined();
});

it('retains bilateral volume and prevents unsupported 1RM', () => {
  const history = [
    workout('paired', 1, [{ ...set('pair', '20', '8'), otherSideReps: '6' }]),
  ];
  expect(
    projectExerciseStatistics(history, '1M', now, key, 'volume').value,
  ).toBe(280);
  expect(
    projectExerciseStatistics(history, '1M', now, key, 'topWeight').value,
  ).toBe(20);
  const result = projectExerciseStatistics(
    history,
    '1M',
    now,
    key,
    'estimated1RM',
  );
  expect(result.points).toEqual([]);
  expect(result.value).toBeUndefined();
  expect(result.setCount).toBe(1);
});

it('keeps missing samples unavailable rather than fabricating zero or decline', () => {
  const history = [workout('current', 1, [set('a')])];
  expect(
    projectExerciseStatistics(history, '1M', now, key, 'volume').comparison
      ?.kind,
  ).toBe('unavailable');
  const empty = projectExerciseStatistics([], '1M', now, key, 'volume');
  expect(empty.value).toBeUndefined();
  expect(empty.workoutCount).toBe(0);
  const older = projectExerciseStatistics(
    [workout('old', 40, [set('a')])],
    '1M',
    now,
    key,
    'volume',
  );
  expect(older.comparison?.kind).toBe('unavailable');
});

it('rejects malformed timestamps and zero-load estimates, retaining real zero volume', () => {
  const history = [
    workout('valid', 1, [
      set('zero', '0'),
      { ...set('invalid'), completedAt: NaN },
      { ...set('negative'), completedAt: -1 },
    ]),
  ];
  expect(
    projectExerciseStatistics(history, '1M', now, key, 'volume').value,
  ).toBe(0);
  expect(
    projectExerciseStatistics(history, '1M', now, key, 'volume').setCount,
  ).toBe(1);
  expect(
    projectExerciseStatistics(history, '1M', now, key, 'estimated1RM').value,
  ).toBeUndefined();
});
