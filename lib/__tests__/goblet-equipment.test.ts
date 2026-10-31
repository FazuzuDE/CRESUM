import { emptyWorkoutState, WorkoutRepository } from '../workout-repository';
import {
  createLocalBackup,
  parseLocalBackup,
  restoreLocalBackup,
} from '../local-backup';
import { parseSharedPlan } from '../workout-sharing/contract';
import { exportSharedPlan, sharedPlanDraft } from '../workout-sharing/adapter';
import { startWorkout } from '../workout-engine';
import { exerciseLibrary, findExercise } from '../exercise-library';
import { previousEntry } from '../set-entry';
import { searchLocalizedExercises } from '../i18n/catalog';
import { equipmentPolicyFor } from '../exercise-equipment';
import { projectExerciseStatistics } from '../exercise-statistics';
import type { WorkoutSession } from '../workout-model';

it('keeps old dumbbell identity and exposes one family under either equipment filter', () => {
  expect(findExercise('goblet-squat')?.equipment).toEqual(['dumbbell']);
  expect(findExercise('kettlebell-goblet-squat')?.equipment).toEqual([
    'kettlebell',
  ]);
  for (const equipment of ['dumbbell', 'kettlebell'] as const)
    expect(
      searchLocalizedExercises({ query: 'Goblet', equipment }, 'en').map(
        (x) => x.id,
      ),
    ).toEqual(['goblet-squat']);
  expect(
    equipmentPolicyFor('goblet-squat')?.choices.map((x) => x.variantId),
  ).toEqual(['goblet-squat', 'kettlebell-goblet-squat']);
});
it('aggregates mixed equipment once per session and retains attribution on every set', () => {
  const now = Date.now();
  const session = {
    id: 'mixed',
    name: 'Mixed',
    templateId: 't',
    startedAt: now - 1000,
    finishedAt: now,
    currentExerciseIndex: 0,
    restDurationSeconds: 90,
    exercises: ['goblet-squat', 'kettlebell-goblet-squat'].map(
      (libraryId, i) => ({
        id: String(i),
        libraryId,
        name: 'Goblet Squat',
        muscle: 'Legs',
        sets: [
          {
            id: String(i),
            weight: String(10 + i * 10),
            reps: '5',
            completedAt: now,
          },
        ],
      }),
    ),
  } satisfies WorkoutSession;
  const all = projectExerciseStatistics(
    [session],
    'ALL',
    now,
    'family:goblet-squat',
    'volume',
  );
  expect(all.value).toBe(150);
  expect(all.workoutCount).toBe(1);
  expect(all.points[0].sets.map((s) => s.exerciseId)).toEqual([
    'goblet-squat',
    'kettlebell-goblet-squat',
  ]);
  expect(
    projectExerciseStatistics(
      [session],
      'ALL',
      now,
      'canonical:goblet-squat',
      'volume',
    ).value,
  ).toBe(50);
  expect(
    projectExerciseStatistics(
      [session],
      'ALL',
      now,
      'canonical:kettlebell-goblet-squat',
      'volume',
    ).value,
  ).toBe(100);
});

it('round-trips both concrete plan IDs and preserves independent previous completed sets', () => {
  const ids = ['goblet-squat', 'kettlebell-goblet-squat'];
  const plan = {
    id: 'goblet-plan',
    name: 'Goblet',
    exerciseIds: ids,
    plannedExercises: ids.map((exerciseId, i) => ({
      exerciseId,
      sets: 1,
      weight: String(10 + i * 10),
    })),
  };
  const reopened = sharedPlanDraft(
    parseSharedPlan(exportSharedPlan(plan, true)),
  );
  expect(reopened.exerciseIds).toEqual(ids);
  const session = startWorkout(
    { id: 'reopened', ...reopened },
    exerciseLibrary,
    100,
  );
  expect(session.exercises.map((e: any) => e.libraryId)).toEqual(ids);
  session.finishedAt = 200;
  session.exercises.forEach((e: any) => {
    e.sets[0].reps = '5';
    e.sets[0].completedAt = 150;
  });
  expect(previousEntry([session], 'goblet-squat', 0)?.weight).toBe('10');
  expect(previousEntry([session], 'kettlebell-goblet-squat', 0)?.weight).toBe(
    '20',
  );
  expect(
    previousEntry(
      [{ ...session, exercises: [session.exercises[0]] }],
      'kettlebell-goblet-squat',
      0,
    ),
  ).toBeUndefined();
  expect(session.exercises[0].libraryId).toBe('goblet-squat');
});

it('restores concrete plan and active-workout choices through local backup without rewriting old dumbbell history', async () => {
  const sourceValues = new Map<string, string>();
  const targetValues = new Map<string, string>();
  const storage = (values: Map<string, string>) => ({
    removeItem: async (key: string) => {
      values.delete(key);
    },
    getItem: async (key: string) => values.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      values.set(key, value);
    },
  });
  const plan = {
    id: 'goblet',
    name: 'Goblet',
    exerciseIds: ['kettlebell-goblet-squat'],
  };
  const old = startWorkout(
    { id: 'old', name: 'Old', exerciseIds: ['goblet-squat'] },
    exerciseLibrary,
    100,
  );
  old.exercises[0].sets[0] = {
    id: old.exercises[0].sets[0].id,
    weight: '12',
    reps: '5',
    completedAt: 150,
  };
  old.finishedAt = 200;
  const state = {
    ...emptyWorkoutState(),
    templates: [plan],
    history: [old],
    activeWorkout: startWorkout(plan, exerciseLibrary, 300),
  };
  await new WorkoutRepository(storage(sourceValues)).save(state);
  const backup = await parseLocalBackup(
    await createLocalBackup(storage(sourceValues), 400),
  );
  await restoreLocalBackup(storage(targetValues), backup);
  const restored = await new WorkoutRepository(storage(targetValues)).load();
  expect(restored.templates[0].exerciseIds).toEqual([
    'kettlebell-goblet-squat',
  ]);
  expect(restored.activeWorkout?.exercises[0].libraryId).toBe(
    'kettlebell-goblet-squat',
  );
  expect(restored.history[0].exercises[0]).toEqual(old.exercises[0]);
});
