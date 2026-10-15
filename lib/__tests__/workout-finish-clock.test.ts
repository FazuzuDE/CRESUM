import { defaultTemplates, exerciseLibrary } from '../workout-catalog';
import {
  finishWorkout,
  startWorkout,
  toggleSet,
  updateSet,
} from '../workout-engine';
import {
  WorkoutRepository,
  STATE_KEY,
  type KeyValueStorage,
} from '../workout-repository';
import { WorkoutStore } from '../workout-store';

const activeWorkout = () =>
  toggleSet(
    updateSet(
      startWorkout(defaultTemplates[0], exerciseLibrary, 10_000),
      0,
      0,
      {
        weight: '40',
        reps: '10',
      },
    ),
    0,
    0,
    10_000,
  ).session;

afterEach(() => jest.restoreAllMocks());

it.each([9_999, -1, NaN, Infinity, -Infinity, 8_640_000_000_000_001])(
  'rejects an invalid finish time %s without changing the active session',
  (now) => {
    const active = activeWorkout(),
      before = JSON.stringify(active);
    expect(() => finishWorkout(active, now)).toThrow(/device time/i);
    expect(JSON.stringify(active)).toBe(before);
  },
);

it('allows a valid zero-duration finish without changing logged timestamps', () => {
  const active = activeWorkout();
  expect(finishWorkout(active, 10_000)).toMatchObject({
    startedAt: 10_000,
    finishedAt: 10_000,
    exercises: active.exercises,
  });
});

it('does not let an earlier draft write clear the clock error', async () => {
  const values = new Map<string, string>();
  let release!: () => void;
  let slow = false;
  const storage: KeyValueStorage = {
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => {
      if (slow) {
        slow = false;
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      }
      values.set(key, value);
    },
  };
  const repository = new WorkoutRepository(storage);
  await repository.save({
    ...(await repository.load()),
    activeWorkout: activeWorkout(),
  });
  const store = new WorkoutStore(repository);
  await store.load();
  slow = true;
  store.updateWorkout((session) => ({ ...session, restEndsAt: undefined }));
  await Promise.resolve();
  await Promise.resolve();
  jest.spyOn(Date, 'now').mockReturnValue(9_000);
  const finishing = store.finish();
  release();
  await expect(finishing).resolves.toBeUndefined();
  await store.waitForPendingWrites();
  expect(store.getSnapshot().error).toMatch(/device time/i);
  expect((await repository.load()).activeWorkout).not.toBeNull();
});

it.each(['before', 'after'] as const)(
  'keeps unsaved-input warnings when the draft write fails %s the clock error',
  async (order) => {
    const values = new Map<string, string>();
    let rejectWrite!: () => void;
    let delayedFailure = false;
    const storage: KeyValueStorage = {
      getItem: async (key) => values.get(key) ?? null,
      setItem: async (key, value) => {
        if (delayedFailure) {
          delayedFailure = false;
          await new Promise<void>((_, reject) => {
            rejectWrite = () => reject(new Error('disk full'));
          });
        }
        values.set(key, value);
      },
    };
    const repository = new WorkoutRepository(storage);
    await repository.save({
      ...(await repository.load()),
      activeWorkout: activeWorkout(),
    });
    const store = new WorkoutStore(repository);
    await store.load();
    delayedFailure = true;
    store.updateWorkout((session) =>
      updateSet(session, 0, 1, { weight: '45' }),
    );
    await Promise.resolve();
    await Promise.resolve();
    const clock = jest.spyOn(Date, 'now').mockReturnValue(9_000);
    if (order === 'before') {
      rejectWrite();
      await store.waitForPendingWrites();
    }
    await expect(store.finish()).resolves.toBeUndefined();
    if (order === 'after') {
      rejectWrite();
      await store.waitForPendingWrites();
    }
    expect(store.getSnapshot().error).toMatch(/device time/i);
    expect(store.getSnapshot().error).toContain('Changes are not saved yet');
    expect(
      store.getSnapshot().data.activeWorkout?.exercises[0].sets[1].weight,
    ).toBe('45');
    expect(
      (await repository.load()).activeWorkout?.exercises[0].sets[1].weight,
    ).toBe('');
    await store.retry();
    await store.waitForPendingWrites();
    expect(store.getSnapshot().error).not.toContain(
      'Changes are not saved yet',
    );
    expect(store.getSnapshot().error).toMatch(/device time/i);
    clock.mockReturnValue(12_000);
    expect(await store.finish()).toBeDefined();
    expect(store.getSnapshot().error).toBe('');
    expect(
      (await repository.load()).history[0].exercises[0].sets[1].weight,
    ).toBe('45');
  },
);

it('keeps durable active data and prior history after clock rollback, then finishes once after correction', async () => {
  const values = new Map<string, string>();
  const storage: KeyValueStorage = {
    getItem: async (key) => values.get(key) ?? null,
    setItem: jest.fn(async (key, value) => {
      values.set(key, value);
    }),
  };
  const repository = new WorkoutRepository(storage);
  const state = await repository.load();
  const previous = {
    ...finishWorkout(activeWorkout(), 11_000),
    id: 'previous',
  };
  await repository.save({
    ...state,
    activeWorkout: activeWorkout(),
    history: [previous],
  });
  const store = new WorkoutStore(repository);
  await store.load();
  const raw = values.get(STATE_KEY),
    active = store.getSnapshot().data.activeWorkout;
  jest.mocked(storage.setItem).mockClear();
  const clock = jest.spyOn(Date, 'now').mockReturnValue(9_000);

  await expect(store.finish()).resolves.toBeUndefined();
  expect(store.getSnapshot()).toMatchObject({
    busy: false,
    error: expect.stringMatching(/device time/i),
  });
  expect(store.getSnapshot().data.activeWorkout).toBe(active);
  expect(storage.setItem).not.toHaveBeenCalled();
  expect(values.get(STATE_KEY)).toBe(raw);

  const restored = new WorkoutStore(new WorkoutRepository(storage));
  await restored.load();
  expect(restored.getSnapshot().ready).toBe(true);
  expect(restored.getSnapshot().data.activeWorkout).toEqual(active);
  expect(restored.getSnapshot().data.history).toEqual([previous]);

  clock.mockReturnValue(12_000);
  const [finished, duplicate] = await Promise.all([
    restored.finish(),
    restored.finish(),
  ]);
  expect(finished?.finishedAt).toBe(12_000);
  expect(duplicate).toBeUndefined();
  const final = await new WorkoutRepository(storage).load();
  expect(final.activeWorkout).toBeNull();
  expect(final.history).toEqual([finished, previous]);
});
