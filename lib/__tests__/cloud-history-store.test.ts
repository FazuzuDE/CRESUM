import { WorkoutStore } from '../workout-store';
import { STATE_KEY, WorkoutRepository } from '../workout-repository';
import type { WorkoutSession, WorkoutState } from '../workout-model';
const saved = (id: string): WorkoutSession => ({
  id,
  templateId: 't',
  name: id,
  startedAt: 0,
  finishedAt: 10,
  currentExerciseIndex: 0,
  restDurationSeconds: 90,
  exercises: [],
});
async function setup() {
  const state: WorkoutState = {
    schemaVersion: 1,
    history: [saved('local')],
    templates: [],
    activeWorkout: { ...saved('active'), finishedAt: undefined },
  };
  const values = new Map([[STATE_KEY, JSON.stringify(state)]]);
  const storage = {
    getItem: async (k: string) => values.get(k) ?? null,
    setItem: async (k: string, v: string) => {
      values.set(k, v);
    },
  };
  const store = new WorkoutStore(new WorkoutRepository(storage));
  await store.load();
  return { store, storage, values };
}
it('merges against the live history while preserving the latest active edits and templates', async () => {
  const { store } = await setup();
  const history = store.getSnapshot().data.history;
  store.updateWorkout((w) => ({ ...w, name: 'latest draft' }));
  await store.waitForPendingWrites();
  expect(
    await store.applyCloudHistory(
      history,
      [...history, saved('remote')],
      () => true,
    ),
  ).toBe(true);
  expect(store.getSnapshot().data.activeWorkout?.name).toBe('latest draft');
  expect(store.getSnapshot().data.history.map((w) => w.id)).toEqual([
    'local',
    'remote',
  ]);
  expect(
    await store.applyCloudHistory(history, [saved('stale')], () => true),
  ).toBe(false);
});
it('rejects active ID collisions and invalidated account guards without changing data', async () => {
  const { store } = await setup();
  const history = store.getSnapshot().data.history;
  expect(
    await store.applyCloudHistory(
      history,
      [...history, saved('active')],
      () => true,
    ),
  ).toBe(false);
  expect(
    await store.applyCloudHistory(
      history,
      [...history, saved('remote')],
      () => false,
    ),
  ).toBe(false);
  expect(store.getSnapshot().data.history).toBe(history);
});
it('does not advance memory for a silent write and keeps local training usable', async () => {
  const { store, storage } = await setup();
  const history = store.getSnapshot().data.history;
  storage.setItem = async () => {};
  expect(
    await store.applyCloudHistory(
      history,
      [...history, saved('remote')],
      () => true,
    ),
  ).toBe(false);
  expect(store.getSnapshot().data.history.map((w) => w.id)).toEqual(['local']);
  store.updateWorkout((w) => ({ ...w, name: 'still usable' }));
  expect(store.getSnapshot().data.activeWorkout?.name).toBe('still usable');
});
it('reloads coherent data after a write commits then rejects without claiming sync success', async () => {
  const { store, storage, values } = await setup();
  const history = store.getSnapshot().data.history;
  storage.setItem = async (k, v) => {
    values.set(k, v);
    throw Error('after commit');
  };
  expect(
    await store.applyCloudHistory(
      history,
      [...history, saved('remote')],
      () => true,
    ),
  ).toBe(false);
  expect(store.getSnapshot().data.history.map((w) => w.id)).toEqual([
    'local',
    'remote',
  ]);
});
it('never rewinds unsaved active inputs when a queued write and cloud merge both fail', async () => {
  const { store, storage } = await setup();
  const history = store.getSnapshot().data.history;
  let reject!: () => void;
  let first = true;
  let start!: () => void;
  const writing = new Promise<void>((r) => {
    start = r;
  });
  storage.setItem = async () => {
    if (first) {
      first = false;
      await new Promise<void>((_, r) => {
        reject = () => r(Error('first failed'));
        start();
      });
    } else throw Error('merge failed');
  };
  store.updateWorkout((w) => ({ ...w, name: 'unsaved latest input' }));
  const pending = store.applyCloudHistory(
    history,
    [...history, saved('remote')],
    () => true,
  );
  await writing;
  reject();
  expect(await pending).toBe(false);
  expect(store.getSnapshot().data.activeWorkout?.name).toBe(
    'unsaved latest input',
  );
});
