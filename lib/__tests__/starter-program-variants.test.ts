import { exerciseLibrary, findExercise } from '../exercise-library';
import { createExercise } from '../workout-engine';

it.each([
  ['standing-cable-anti-rotation-press', ['cable'], 'core'],
  ['bodyweight-step-up', ['bodyweight', 'step-platform'], 'lunge'],
  ['dumbbell-floor-glute-bridge', ['dumbbell'], 'hinge'],
  ['lying-barbell-triceps-extension', ['barbell', 'bench'], 'isolation'],
])(
  'resolves the required exact movement %s',
  (id, equipment, movementPattern) => {
    expect(findExercise(id)).toMatchObject({ id, equipment, movementPattern });
  },
);

it('keeps old aliases and floor/overhead movements distinct', () => {
  expect(findExercise('triceps')?.id).toBe('cable-triceps-pushdown');
  expect(findExercise('dumbbell-floor-glute-bridge')?.id).not.toBe(
    findExercise('barbell-hip-thrust')?.id,
  );
  expect(findExercise('lying-barbell-triceps-extension')?.id).not.toBe(
    findExercise('overhead-cable-triceps-extension')?.id,
  );
  expect(new Set(exerciseLibrary.map((e) => e.id)).size).toBe(
    exerciseLibrary.length,
  );
});

it('records required per-side exercises with separate actual side repetitions', () => {
  const exercise = findExercise('bodyweight-step-up');
  expect(exercise).toBeDefined();
  const snapshot = createExercise(exercise!);
  expect(snapshot.sets[0]).toMatchObject({ reps: '', otherSideReps: '' });
});
