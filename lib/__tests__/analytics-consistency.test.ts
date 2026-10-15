import { projectPeriodAnalytics } from '../progress-periods';
import {
  projectEstimatedOneRepMaxSeries,
  projectExercisePerformance,
} from '../exercise-performance';
import { projectExerciseStatistics } from '../exercise-statistics';
import type { WorkoutSession, WorkoutSet } from '../workout-model';

const now = new Date(2026, 9, 15, 12).getTime();
const key = 'canonical:barbell-bench-press';
const saved = (
  id: string,
  weight: string,
  reps: string,
  completedAt = now - 1,
): WorkoutSet => ({ id, weight, reps, completedAt });
const workout = (sets: WorkoutSet[]): WorkoutSession => ({
  id: 'workout',
  name: 'Saved workout',
  templateId: 't',
  startedAt: now - 60000,
  finishedAt: now,
  currentExerciseIndex: 0,
  restDurationSeconds: 90,
  exercises: [
    {
      id: 'snapshot',
      libraryId: 'bench',
      name: 'Saved Bench',
      muscle: 'Chest',
      sets,
    },
  ],
});
function projections(history: WorkoutSession[]) {
  return {
    records: projectPeriodAnalytics(history, '1M', now)
      .estimatedOneRepMaxRecords,
    series: projectEstimatedOneRepMaxSeries(history, '1M', now, key),
    library: projectExerciseStatistics(history, '1M', now, key, 'estimated1RM'),
  };
}

it.each(['zero', 'paired'] as const)(
  'keeps %s logs and volume without inventing an estimated record on any screen',
  (kind) => {
    const sample =
      kind === 'zero'
        ? saved('s', '0', '10')
        : { ...saved('s', '20', '8'), otherSideReps: '6' };
    const history = [workout([sample])];
    const before = JSON.stringify(history);
    const { records, series, library } = projections(history);
    expect(records).toEqual([]);
    expect(series).toEqual([]);
    expect(library.value).toBeUndefined();
    expect(library.setCount).toBe(1);
    expect(
      projectExerciseStatistics(history, '1M', now, key, 'volume').value,
    ).toBe(kind === 'zero' ? 0 : 280);
    expect(
      projectExerciseStatistics(history, '1M', now, key, 'topWeight').value,
    ).toBe(kind === 'zero' ? 0 : 20);
    expect(
      projectExercisePerformance(history, '1M', now, key)[0].sets,
    ).toHaveLength(1);
    expect(JSON.stringify(history)).toBe(before);
  },
);

it.each([
  [
    'later timestamp',
    [saved('a', '100', '1', now - 2), saved('z', '75', '10')],
  ],
  ['stable ID', [saved('z', '100', '1'), saved('a', '75', '10')]],
] as const)(
  'selects the same source for equal estimates by %s',
  (_label, sets) => {
    const history = [workout([...sets])];
    const { records, series, library } = projections(history);
    expect(records[0]).toMatchObject({
      weight: 75,
      reps: 10,
      estimatedOneRepMax: 100,
    });
    expect(series[0]).toMatchObject({
      weight: 75,
      reps: 10,
      estimatedOneRepMax: 100,
    });
    expect(library.points[0].estimateSource).toEqual({ weight: 75, reps: 10 });
  },
);

it('uses the same tied source across repeated canonical and legacy snapshots regardless of snapshot order', () => {
  const entry = workout([saved('s', '100', '1')]);
  entry.exercises.push({
    ...entry.exercises[0],
    id: 'a-snapshot',
    libraryId: 'barbell-bench-press',
    sets: [saved('s', '75', '10')],
  });
  for (const exercises of [entry.exercises, [...entry.exercises].reverse()]) {
    const history = [{ ...entry, exercises }];
    const { records, series, library } = projections(history);
    expect(records[0].weight).toBe(75);
    expect(series[0].weight).toBe(75);
    expect(library.points[0].estimateSource?.weight).toBe(75);
  }
});

it('keeps positive and legacy estimates identical while excluding malformed completion times', () => {
  const legacy = {
    id: 'legacy',
    weight: '75',
    reps: '10',
    done: true,
  } as WorkoutSet;
  const history = [
    workout([
      legacy,
      { ...saved('invalid', '500', '10'), completedAt: NaN },
      saved('zero', '0', '10'),
    ]),
  ];
  const before = JSON.stringify(history);
  const { records, series, library } = projections(history);
  expect(records[0]).toMatchObject({
    weight: 75,
    reps: 10,
    estimatedOneRepMax: 100,
    recordedAt: now,
  });
  expect(series[0]).toMatchObject({
    weight: 75,
    reps: 10,
    estimatedOneRepMax: 100,
    completedAt: now,
  });
  expect(library.value).toBe(100);
  expect(library.points[0].estimateSource).toEqual({ weight: 75, reps: 10 });
  expect(JSON.stringify(history)).toBe(before);
});

it.each(['zero', 'paired'] as const)(
  'retains the newest valid %s snapshot label without replacing an older positive record',
  (kind) => {
    const older = workout([saved('positive', '75', '10', now - 2)]);
    older.id = 'older';
    older.finishedAt = now - 1;
    const newer = workout([
      kind === 'zero'
        ? saved('new', '0', '10')
        : { ...saved('new', '20', '8'), otherSideReps: '6' },
    ]);
    newer.exercises[0].name = 'New saved label';
    for (const history of [
      [older, newer],
      [newer, older],
    ]) {
      expect(projections(history).records[0]).toMatchObject({
        name: 'New saved label',
        weight: 75,
        reps: 10,
        estimatedOneRepMax: 100,
      });
    }
  },
);

it.each([
  ['encoded IDs', ['quote"id', 'slash\\id', 'prefix', 'prefix-long']],
  ['duplicate IDs', ['same', 'same']],
])('keeps tied source selection consistent for %s', (_label, ids) => {
  const sets = ids.map((id, index) =>
    saved(id, index % 2 ? '75' : '100', index % 2 ? '10' : '1'),
  );
  for (const ordered of [sets, [...sets].reverse()]) {
    const { records, series, library } = projections([workout(ordered)]);
    const expected = { weight: records[0].weight, reps: records[0].reps };
    expect(series[0]).toMatchObject(expected);
    expect(library.points[0].estimateSource).toEqual(expected);
    if (_label === 'duplicate IDs')
      expect(expected.weight).toBe(Number(ordered[0].weight));
  }
});

it('retains stable tied period records across workout order and keeps all per-workout points', () => {
  const a = { ...workout([saved('s', '75', '10')]), id: 'a' };
  const b = { ...workout([saved('s', '100', '1')]), id: 'b' };
  for (const history of [
    [a, b],
    [b, a],
  ]) {
    const { records, series, library } = projections(history);
    expect(records[0]).toMatchObject({
      weight: 75,
      reps: 10,
      estimatedOneRepMax: 100,
    });
    expect(series.map((p) => [p.workoutId, p.weight])).toEqual([
      ['a', 75],
      ['b', 100],
    ]);
    expect(library.value).toBe(100);
    expect(
      library.points.map((p) => [p.workoutId, p.estimateSource?.weight]),
    ).toEqual([
      ['a', 75],
      ['b', 100],
    ]);
  }
});
