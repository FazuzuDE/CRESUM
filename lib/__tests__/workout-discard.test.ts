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

function memoryStorage() {
  const values = new Map<string, string>();
  const storage: KeyValueStorage = {
    getItem: async (key) => values.get(key) ?? null,
    setItem: jest.fn(async (key, value) => {
      values.set(key, value);
    }),
  };
  return { storage, values };
}
const active = () => startWorkout(defaultTemplates[0], exerciseLibrary, 1000);
const logged = () =>
  toggleSet(updateSet(active(), 0, 0, { weight: '40', reps: '10' }), 0, 0, 2000)
    .session;

it.each([false, true])(
  'durably discards an active workout with completed sets=%s without changing history or routines',
  async (hasSets) => {
    const { storage } = memoryStorage();
    const repository = new WorkoutRepository(storage);
    const state = await repository.load();
    const session = hasSets ? logged() : active();
    const history = [{ ...finishWorkout(logged(), 3000), id: 'previous' }];
    await repository.save({
      ...state,
      activeWorkout: session,
      history,
      programInstallations: ['installed'],
    });
    const store = new WorkoutStore(repository);
    await store.load();
    expect(await store.discard(session.id)).toBe(true);
    expect(store.getSnapshot()).toMatchObject({
      busy: false,
      error: '',
      data: { activeWorkout: null, history },
    });
    const restored = await new WorkoutRepository(storage).load();
    expect(restored).toEqual({
      ...state,
      activeWorkout: null,
      history,
      programInstallations: ['installed'],
    });
    store.start(defaultTemplates[1]);
    await store.waitForPendingWrites();
    expect(store.getSnapshot().data.activeWorkout?.templateId).toBe(
      defaultTemplates[1].id,
    );
  },
);

it('keeps all active inputs on failed discard and safely retries', async () => {
  const { storage, values } = memoryStorage();
  const repository = new WorkoutRepository(storage);
  await repository.save({
    ...(await repository.load()),
    activeWorkout: logged(),
  });
  const store = new WorkoutStore(repository);
  await store.load();
  const session = store.getSnapshot().data.activeWorkout!;
  const raw = values.get(STATE_KEY);
  jest.mocked(storage.setItem).mockRejectedValueOnce(new Error('disk full'));
  expect(await store.discard(session.id)).toBe(false);
  expect(store.getSnapshot().data.activeWorkout).toBe(session);
  expect(store.getSnapshot().busy).toBe(false);
  expect(store.getSnapshot().error).toMatch(/could not be discarded/i);
  expect(values.get(STATE_KEY)).toBe(raw);
  expect((await repository.load()).activeWorkout).toEqual(session);
  expect(await store.discard(session.id)).toBe(true);
  expect((await repository.load()).activeWorkout).toBeNull();
});

it('waits behind pending edits and blocks overlapping start/finish/discard until the discard is durable', async () => {
  const { storage } = memoryStorage();
  const repository = new WorkoutRepository(storage);
  await repository.save({
    ...(await repository.load()),
    activeWorkout: logged(),
  });
  const store = new WorkoutStore(repository);
  await store.load();
  const id = store.getSnapshot().data.activeWorkout!.id;
  let release!: () => void;
  jest.mocked(storage.setItem).mockImplementationOnce(async () => {
    await new Promise<void>((resolve) => {
      release = resolve;
    });
  });
  store.updateWorkout((session) => updateSet(session, 0, 1, { weight: '45' }));
  await Promise.resolve();
  await Promise.resolve();
  const discard = store.discard(id);
  expect(store.getSnapshot().busy).toBe(true);
  expect(store.getSnapshot().data.activeWorkout).not.toBeNull();
  store.start(defaultTemplates[1]);
  expect(store.getSnapshot().data.activeWorkout?.id).toBe(id);
  expect(await store.finish()).toBeUndefined();
  expect(await store.discard(id)).toBe(false);
  release();
  expect(await discard).toBe(true);
  expect((await repository.load()).activeWorkout).toBeNull();
  expect((await repository.load()).history).toEqual([]);
});

it('ignores stale confirmation IDs and calls without a ready active session', async () => {
  const { storage } = memoryStorage();
  const store = new WorkoutStore(new WorkoutRepository(storage));
  expect(await store.discard('stale')).toBe(false);
  await store.load();
  expect(await store.discard('stale')).toBe(false);
  store.start(defaultTemplates[0]);
  await store.waitForPendingWrites();
  const session = store.getSnapshot().data.activeWorkout!;
  jest.mocked(storage.setItem).mockClear();
  expect(await store.discard('different-session')).toBe(false);
  expect(store.getSnapshot().data.activeWorkout).toBe(session);
  expect(storage.setItem).not.toHaveBeenCalled();
  expect(await store.discard(session.id)).toBe(true);
  store.start(defaultTemplates[1]);
  await store.waitForPendingWrites();
  const replacement = store.getSnapshot().data.activeWorkout!;
  expect(await store.discard(session.id)).toBe(false);
  expect(store.getSnapshot().data.activeWorkout).toBe(replacement);
});

it('allows discarding after a clock error without requiring a fabricated completion', async () => {
  const { storage } = memoryStorage();
  const repository = new WorkoutRepository(storage);
  const session = logged();
  await repository.save({
    ...(await repository.load()),
    activeWorkout: session,
  });
  const store = new WorkoutStore(repository);
  await store.load();
  const clock = jest.spyOn(Date, 'now').mockReturnValue(500);
  try {
    expect(await store.finish()).toBeUndefined();
    expect(store.getSnapshot().error).toMatch(/device time/i);
    expect(await store.discard(session.id)).toBe(true);
    expect(store.getSnapshot().error).toBe('');
    expect((await repository.load()).history).toEqual([]);
  } finally {
    clock.mockRestore();
  }
});
