import * as Crypto from 'expo-crypto';
import { defaultTemplates, exerciseLibrary } from '../workout-catalog';
import {
  finishWorkout,
  startWorkout,
  toggleSet,
  updateSet,
} from '../workout-engine';
import {
  WorkoutRepository,
  emptyWorkoutState,
  STATE_KEY,
} from '../workout-repository';
import { WorkoutStore } from '../workout-store';
import { createLocalBackup, parseLocalBackup } from '../local-backup';
import { importBackupHistory } from '../history-import';

const uuidV4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function storage() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: async (key: string) => values.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: async (key: string) => {
      values.delete(key);
    },
  };
}
afterEach(() => jest.restoreAllMocks());

it('creates distinct UUID v4 workout IDs for two offline devices with equal clocks and Math.random values', async () => {
  jest.spyOn(Date, 'now').mockReturnValue(1_000);
  jest.spyOn(Math, 'random').mockReturnValue(0.5);
  const devices = [
    new WorkoutStore(new WorkoutRepository(storage())),
    new WorkoutStore(new WorkoutRepository(storage())),
  ];
  for (const device of devices) {
    await device.load();
    device.start(defaultTemplates[0]);
  }
  const ids = devices.map((d) => d.getSnapshot().data.activeWorkout!.id);
  expect(ids[0]).toMatch(uuidV4);
  expect(ids[1]).toMatch(uuidV4);
  expect(ids[0]).not.toBe(ids[1]);
});

it('preserves a new UUID through resume, Finish, export and repeated history import', async () => {
  const s = storage();
  const original = new WorkoutStore(new WorkoutRepository(s));
  await original.load();
  original.start(defaultTemplates[0]);
  const id = original.getSnapshot().data.activeWorkout!.id;
  expect(id).toMatch(uuidV4);
  await original.waitForPendingWrites();
  const resumed = new WorkoutStore(new WorkoutRepository(s));
  await resumed.load();
  expect(resumed.getSnapshot().data.activeWorkout!.id).toBe(id);
  resumed.updateWorkout(
    (w) =>
      toggleSet(updateSet(w, 0, 0, { weight: '60', reps: '8' }), 0, 0).session,
  );
  expect((await resumed.finish())!.id).toBe(id);
  const backup = await parseLocalBackup(await createLocalBackup(s));
  const destination = storage();
  expect(await importBackupHistory(destination, backup)).toBe(1);
  expect(await importBackupHistory(destination, backup)).toBe(0);
  const imported = await new WorkoutRepository(destination).load();
  expect(imported.history.map((w) => w.id)).toEqual([id]);
});

it('retains legacy active and completed IDs when opening and finishing old data', async () => {
  const s = storage();
  let n = 0;
  const old = startWorkout(
    defaultTemplates[0],
    exerciseLibrary,
    1_000,
    () => `legacy-${++n}`,
  );
  old.id = 'legacy-active';
  const active = toggleSet(
    updateSet(old, 0, 0, { weight: '50', reps: '10' }),
    0,
    0,
    1_100,
  ).session;
  const completed = { ...finishWorkout(active, 1_200), id: 'legacy-history' };
  s.values.set(
    STATE_KEY,
    JSON.stringify({
      ...emptyWorkoutState(),
      activeWorkout: active,
      history: [completed],
    }),
  );
  const store = new WorkoutStore(new WorkoutRepository(s));
  await store.load();
  expect(store.getSnapshot().data.activeWorkout!.id).toBe('legacy-active');
  expect((await store.finish())!.id).toBe('legacy-active');
  const saved = await new WorkoutRepository(s).load();
  expect(saved.history.map((w) => w.id).sort()).toEqual([
    'legacy-active',
    'legacy-history',
  ]);
});

it('does not create or persist a weak-ID workout when secure UUID generation fails', async () => {
  const s = storage();
  const store = new WorkoutStore(new WorkoutRepository(s));
  await store.load();
  const before = store.getSnapshot().data;
  const raw = s.values.get(STATE_KEY);
  jest.spyOn(Crypto, 'randomUUID').mockImplementation(() => {
    throw Error('Secure UUID unavailable');
  });
  expect(() => store.start(defaultTemplates[0])).toThrow(
    'Secure UUID unavailable',
  );
  expect(store.getSnapshot().data).toBe(before);
  await store.waitForPendingWrites();
  expect(s.values.get(STATE_KEY)).toBe(raw);
});

it('loads and finishes existing workouts when the native crypto module cannot load', async () => {
  const cryptoModule = jest.requireMock('expo-crypto');
  jest.doMock('expo-crypto', () => {
    throw Error('Native crypto module missing');
  });
  // Drop the working mock cached by earlier tests before simulating a missing module.
  jest.resetModules();
  try {
    await jest.isolateModulesAsync(async () => {
      const { WorkoutStore: IsolatedStore } =
        jest.requireActual<typeof import('../workout-store')>(
          '../workout-store',
        );
      const s = storage();
      const old = startWorkout(defaultTemplates[0], exerciseLibrary, 1_000);
      old.id = 'existing-active';
      const active = toggleSet(
        updateSet(old, 0, 0, { weight: '50', reps: '10' }),
        0,
        0,
        1_100,
      ).session;
      s.values.set(
        STATE_KEY,
        JSON.stringify({ ...emptyWorkoutState(), activeWorkout: active }),
      );
      const store = new IsolatedStore(new WorkoutRepository(s));
      await store.load();
      expect(store.getSnapshot().data.activeWorkout!.id).toBe(
        'existing-active',
      );
      expect((await store.finish())!.id).toBe('existing-active');
      const before = store.getSnapshot().data;
      const raw = s.values.get(STATE_KEY);
      expect(() => store.start(defaultTemplates[0])).toThrow(
        'Native crypto module missing',
      );
      expect(store.getSnapshot().data).toBe(before);
      await store.waitForPendingWrites();
      expect(s.values.get(STATE_KEY)).toBe(raw);
    });
  } finally {
    jest.doMock('expo-crypto', () => cryptoModule);
  }
});
