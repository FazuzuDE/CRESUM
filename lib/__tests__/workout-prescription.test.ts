import { exerciseLibrary } from '../exercise-library';
import {
  startWorkout,
  updateSet,
  toggleSet,
  addSet,
  setInputIsValid,
} from '../workout-engine';
import { WorkoutTemplate } from '../workout-model';
import { WorkoutRepository, emptyWorkoutState } from '../workout-repository';
import { duplicateTemplate, validateTemplateDraft } from '../workout-templates';
import { completedSetMetrics, volume } from '../workout-metrics';
const target = {
  repMin: 3,
  repMax: 5,
  restMin: 180,
  restMax: 240,
  programId: 'strength',
  revision: 1,
  sourceRefs: ['S2'],
};
const template = {
  id: 'program-A',
  name: 'A',
  exerciseIds: ['barbell-back-squat', 'dumbbell-bench-press'],
  plannedExercises: [
    { exerciseId: 'barbell-back-squat', sets: 1, target },
    {
      exerciseId: 'dumbbell-bench-press',
      sets: 2,
      target: { ...target, restMin: 120, restMax: 180 },
    },
  ],
} as WorkoutTemplate;
it('keeps prescribed reps separate from blank actuals, including add-set', () => {
  const session = startWorkout(template, exerciseLibrary, 1000);
  expect(session.exercises[0]).toHaveProperty('target', target);
  expect(session.exercises[0].sets[0].reps).toBe('');
  expect(() => toggleSet(session, 0, 0, 2000)).toThrow();
  expect(volume(session)).toBe(0);
  expect(addSet(session, 0).exercises[0].sets[1].reps).toBe('');
  expect(
    startWorkout(
      { id: 'old', name: 'Old', exerciseIds: ['barbell-back-squat'] },
      exerciseLibrary,
    ).exercises[0].sets[0].reps,
  ).toBe('10');
});
it('uses the completed exercise rest before advancing and preserves actual reps outside target', () => {
  let session = startWorkout(template, exerciseLibrary, 1000);
  session = updateSet(session, 0, 0, { weight: '50', reps: '8' });
  const done = toggleSet(session, 0, 0, 2000).session;
  expect(done.currentExerciseIndex).toBe(1);
  expect(done.restEndsAt).toBe(182000);
  expect(done.exercises[0].sets[0].reps).toBe('8');
});
it('requires both sides and excludes combined reps from Epley', () => {
  const session = startWorkout(
    {
      id: 'side',
      name: 'Side',
      exerciseIds: ['standing-cable-anti-rotation-press'],
    },
    exerciseLibrary,
  );
  const set = { ...session.exercises[0].sets[0], weight: '10', reps: '10' };
  expect(setInputIsValid(set)).toBe(false);
  const both = { ...set, otherSideReps: '8', completedAt: 1000 };
  expect(setInputIsValid(both)).toBe(true);
  expect(completedSetMetrics(both)).toMatchObject({ volume: 180 });
  expect(completedSetMetrics(both)?.estimatedOneRepMax).toBeUndefined();
});
it('rejects loaded actuals under an unloaded step-up identity', () => {
  const session = startWorkout(
    { id: 's', name: 'S', exerciseIds: ['bodyweight-step-up'] },
    exerciseLibrary,
  );
  const next = updateSet(session, 0, 0, {
    weight: '20',
    reps: '8',
    otherSideReps: '8',
  } as never);
  expect(() => toggleSet(next, 0, 0)).toThrow();
});
it('round trips targets and both sides, rejects damaged targets without replacing saved results', async () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: async (k: string) => values.get(k) ?? null,
    setItem: async (k: string, v: string) => {
      values.set(k, v);
    },
  };
  const repository = new WorkoutRepository(storage);
  const session = startWorkout(template, exerciseLibrary);
  const state = {
    ...emptyWorkoutState(),
    templates: [template],
    activeWorkout: session,
  };
  await repository.save(state);
  expect(await repository.load()).toEqual(state);
  const damaged = JSON.parse(JSON.stringify(state));
  damaged.activeWorkout.exercises[0].target.repMin = -1;
  await repository.save(damaged);
  await expect(repository.load()).rejects.toThrow();
  expect(values.size).toBe(1);
});
it('deep copies targets during duplicate/edit so active and original values stay independent', () => {
  const copy = duplicateTemplate(
    [template],
    template.id,
    () => 'copy',
  ).template;
  const original = JSON.stringify(template);
  copy.plannedExercises![0].target!.repMin = 1;
  expect(JSON.stringify(template)).toBe(original);
  const validated = validateTemplateDraft(template);
  expect(validated.ok && validated.draft.plannedExercises![0]).toHaveProperty(
    'target',
    target,
  );
});
