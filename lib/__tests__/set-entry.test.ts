import {
  entryStep,
  weightOptions,
  adjustEntry,
  saveSetEntry,
  previousEntry,
} from '../set-entry';
import { startWorkout, moveWorkoutExercise } from '../workout-engine';
import { defaultTemplates, exerciseLibrary } from '../workout-catalog';

it('uses equipment-aware increments and preserves off-grid exact weights in wheels', () => {
  expect(entryStep('barbell-bench-press')).toBe(2.5);
  expect(entryStep('one-arm-dumbbell-row')).toBe(1);
  expect(entryStep('seated-cable-row')).toBe(5);
  expect(weightOptions('63.75', 2.5)).toContain('63.75');
  expect(weightOptions('1250', 2.5)).toContain('1250');
  expect(weightOptions('63.750000000000001', 2.5)).toContain(
    '63.750000000000001',
  );
  expect(adjustEntry('0', -1, 2.5, 0)).toBe('0');
  expect(adjustEntry('1', -1, 1, 1)).toBe('1');
  expect(adjustEntry('60,5', 1, 2.5, 0)).toBe('63');
  expect(adjustEntry('63.750000000000001', 1, 2.5, 0)).toBe(
    '66.250000000000001',
  );
});
it('commits by snapshot IDs without completing sets or changing the rest deadline', () => {
  const session = startWorkout(defaultTemplates[0], exerciseLibrary, 1000);
  session.restEndsAt = 99999;
  const exercise = session.exercises[0],
    set = exercise.sets[0];
  const reordered = moveWorkoutExercise(session, exercise.id, 2);
  const next = saveSetEntry(reordered, session.id, exercise.id, set.id, {
    weight: '63,75',
    reps: '9',
  });
  expect(next.exercises[2].sets[0]).toMatchObject({
    weight: '63.75',
    reps: '9',
  });
  expect(next.exercises[2].sets[0].completedAt).toBeUndefined();
  expect(next.restEndsAt).toBe(99999);
  expect(session.exercises[0].sets[0].weight).toBe('');
});
it('rejects invalid and stale drafts, locks completed sets and preserves bilateral values', () => {
  const s = startWorkout(defaultTemplates[0], exerciseLibrary, 1000),
    e = s.exercises[0],
    v = e.sets[0];
  expect(
    saveSetEntry(s, 'old-session', e.id, v.id, { weight: '60', reps: '8' }),
  ).toBe(s);
  expect(
    saveSetEntry(s, s.id, e.id, 'deleted-set', { weight: '60', reps: '8' }),
  ).toBe(s);
  for (const weight of ['-1', '', 'NaN'])
    expect(() =>
      saveSetEntry(s, s.id, e.id, v.id, { weight, reps: '8' }),
    ).toThrow();
  expect(() =>
    saveSetEntry(s, s.id, e.id, v.id, { weight: '60', reps: '0' }),
  ).toThrow();
  v.otherSideReps = '8';
  expect(() =>
    saveSetEntry(s, s.id, e.id, v.id, { weight: '60', reps: '9' }),
  ).toThrow();
  expect(
    saveSetEntry(s, s.id, e.id, v.id, {
      weight: '60',
      reps: '9',
      otherSideReps: '7',
    }).exercises[0].sets[0].otherSideReps,
  ).toBe('7');
  v.completedAt = 2000;
  expect(
    saveSetEntry(s, s.id, e.id, v.id, {
      weight: '60',
      reps: '9',
      otherSideReps: '7',
    }),
  ).toBe(s);
});
it('finds the same completed set ordinal in the newest finished matching session, never fabricates a prior', () => {
  const old = startWorkout(defaultTemplates[0], exerciseLibrary, 1000),
    recent = startWorkout(defaultTemplates[0], exerciseLibrary, 2000);
  old.finishedAt = 1500;
  recent.finishedAt = 2500;
  old.exercises[0].sets[0] = {
    id: 'old',
    weight: '55',
    reps: '8',
    completedAt: 1400,
  };
  recent.exercises[0].sets[0] = {
    id: 'new',
    weight: '60',
    reps: '10',
    completedAt: 2400,
  };
  expect(previousEntry([old, recent], 'barbell-bench-press', 0)?.weight).toBe(
    '60',
  );
  expect(
    previousEntry([old, recent], 'barbell-bench-press', 2),
  ).toBeUndefined();
});
