import { exerciseLibrary } from '../exercise-library';
import { startWorkout } from '../workout-engine';
import { createTemplateDraft, duplicateTemplate } from '../workout-templates';
import {
  emptyWorkoutState,
  WorkoutRepository,
  STATE_KEY,
} from '../workout-repository';
import {
  encodeHistoryWorkout,
  decodeHistoryWorkout,
} from '../sync/history-mapper';
import { exportSharedPlan, sharedPlanDraft } from '../workout-sharing/adapter';
import { parseSharedPlan } from '../workout-sharing/contract';
import { HistoryRpc } from '../sync/history-rpc';
import { SharingClient } from '../workout-sharing/client';
import {
  createLocalBackup,
  parseLocalBackup,
  restoreLocalBackup,
} from '../local-backup';
import type { WorkoutTemplate } from '../workout-model';

const ids = [
  'lat-pulldown-close-neutral-ergonomic-handle',
  'lat-pulldown-close-neutral-v-handle',
  'lat-pulldown-wide-pronated-bar',
];
const template = (): WorkoutTemplate => ({
  id: 'pull',
  name: 'Pull',
  exerciseIds: [...ids],
  plannedExercises: ids.map((exerciseId, i) => ({
    exerciseId,
    sets: 2,
    exerciseGroup: { id: 'g', familyId: 'lat-pulldown', name: 'Pulldown' },
    plannedSets: [
      { id: `${i}-a`, weight: '45', reps: '12' },
      { id: `${i}-b`, weight: '40', reps: '10' },
    ],
  })),
});
it('roundtrips template presets, group snapshots and completed History without flattening', async () => {
  const t = template();
  let n = 0;
  const workout = startWorkout(t, exerciseLibrary, 100, () => `i${++n}`);
  workout.finishedAt = 200;
  workout.exercises.forEach((e) =>
    e.sets.forEach((s) => (s.completedAt = 150)),
  );
  const state = { ...emptyWorkoutState(), templates: [t], history: [workout] };
  const values = new Map<string, string>();
  const repo = new WorkoutRepository({
    getItem: async (k) => values.get(k) ?? null,
    setItem: async (k, v) => {
      values.set(k, v);
    },
  });
  await repo.save(state);
  const restored = await repo.load();
  expect(restored.templates[0].plannedExercises).toEqual(t.plannedExercises);
  expect(restored.history[0].exercises).toEqual(workout.exercises);
  expect(decodeHistoryWorkout(encodeHistoryWorkout(workout))).toEqual(workout);
  expect(
    createTemplateDraft(duplicateTemplate([t], t.id, () => 'copy').template)
      .plannedExercises,
  ).toEqual(t.plannedExercises);
  expect(values.has(STATE_KEY)).toBe(true);
});

it('uses V2 for grouped presets and excludes every weight when sharing without weights', () => {
  const shared = exportSharedPlan(template(), false);
  expect(shared.schemaVersion).toBe(2);
  expect(JSON.stringify(shared)).not.toContain('weight');
  const restored = sharedPlanDraft(shared);
  expect(restored.plannedExercises?.[0].exerciseGroup?.id).toBe('g');
  expect(
    restored.plannedExercises?.[0].plannedSets?.map((s) => s.reps),
  ).toEqual(['12', '10']);
  expect(exportSharedPlan(template(), true).exercises[0]).toMatchObject({
    plannedSets: [{ weight: '45' }, { weight: '40' }],
  });
  expect(
    exportSharedPlan(
      { id: 'old', name: 'Old', exerciseIds: ['barbell-bench-press'] },
      true,
    ).schemaVersion,
  ).toBe(1);
  expect(() => parseSharedPlan({ ...shared, schemaVersion: 99 })).toThrow();
  expect(() => parseSharedPlan({ ...shared, schemaVersion: 1 })).toThrow();
});

it('never sends a grouped workout to a backend that does not advertise support', async () => {
  const workout = startWorkout(template(), exerciseLibrary, 100);
  workout.finishedAt = 200;
  const calls: string[] = [];
  const rpc = new HistoryRpc(async (name) => {
    calls.push(name);
    return {
      data:
        name === 'get_equipment_group_capabilities'
          ? {}
          : { revision: 1, changeSequence: '1' },
      error: null,
    };
  });
  await expect(
    rpc.publish({
      workoutId: workout.id,
      mutationId: 'm',
      deviceId: 'd',
      expectedRevision: null,
      workout,
    }),
  ).rejects.toMatchObject({ kind: 'unsupported' });
  expect(calls).toEqual(['get_equipment_group_capabilities']);
});

it('never publishes a grouped plan through a legacy sharing endpoint', async () => {
  let writes = 0;
  const client = new SharingClient(
    'https://example.test/shared-plan',
    'key',
    'plans.example.test',
    async () =>
      ({ ok: true, text: async () => JSON.stringify({}) }) as Response,
    async () => {
      writes++;
      return {
        origin: {
          publicationId: '550e8400-e29b-41d4-a716-446655440000',
          version: 1,
        },
        token: 'a'.repeat(64),
      };
    },
  );
  await expect(
    client.publish(exportSharedPlan(template(), true)),
  ).rejects.toThrow();
  expect(writes).toBe(0);
});

it('uses a new backup envelope for grouped data so an old reader cannot silently flatten it', async () => {
  const values = new Map<string, string>([
    [
      STATE_KEY,
      JSON.stringify({ ...emptyWorkoutState(), templates: [template()] }),
    ],
  ]);
  const storage = {
    getItem: async (k: string) => values.get(k) ?? null,
    setItem: async (k: string, v: string) => {
      values.set(k, v);
    },
    removeItem: async (k: string) => {
      values.delete(k);
    },
  };
  const backup = await createLocalBackup(storage, 300);
  expect(JSON.parse(backup).version).toBe(2);
  const target = new Map<string, string>();
  const destination = {
    getItem: async (k: string) => target.get(k) ?? null,
    setItem: async (k: string, v: string) => {
      target.set(k, v);
    },
    removeItem: async (k: string) => {
      target.delete(k);
    },
  };
  await restoreLocalBackup(destination, await parseLocalBackup(backup));
  expect(
    (await new WorkoutRepository(destination).load()).templates[0]
      .plannedExercises,
  ).toEqual(template().plannedExercises);
});

it('negotiates versioned history reads/writes and keeps legacy RPCs on an old server', async () => {
  const w = startWorkout(template(), exerciseLibrary, 100);
  w.finishedAt = 200;
  w.exercises.forEach((e) => e.sets.forEach((s) => (s.completedAt = 150)));
  const calls: string[] = [];
  const remote = {
    workoutId: w.id,
    revision: 1,
    deletedAt: null,
    workout: encodeHistoryWorkout(w),
  };
  const api = new HistoryRpc(async (name) => {
    calls.push(name);
    if (name === 'get_equipment_group_capabilities')
      return { data: { historyGroups: 1, historyProtocol: 2 }, error: null };
    if (name.startsWith('get_completed_workout'))
      return { data: remote, error: null };
    if (name.startsWith('pull_completed_workouts'))
      return {
        data: {
          cursor: '1',
          hasMore: false,
          changes: [{ ...remote, sequence: '1' }],
        },
        error: null,
      };
    return { data: { revision: 1, changeSequence: '1' }, error: null };
  });
  expect((await api.get(w.id))!.workout!.exercises[0].exerciseGroup).toEqual(
    w.exercises[0].exerciseGroup,
  );
  await api.pull();
  await api.publish({
    workoutId: w.id,
    mutationId: 'm',
    deviceId: 'd',
    expectedRevision: null,
    workout: w,
  });
  expect(calls).toContain('get_completed_workout_v2');
  expect(calls).toContain('pull_completed_workouts_v2');
  expect(calls).toContain('publish_completed_workout_v2');
  const legacyCalls: string[] = [];
  const legacy = new HistoryRpc(async (name) => {
    legacyCalls.push(name);
    return name === 'get_equipment_group_capabilities'
      ? { data: null, error: { code: 'PGRST202' } }
      : { data: null, error: null };
  });
  await legacy.get('missing');
  expect(legacyCalls).toContain('get_completed_workout');
});
