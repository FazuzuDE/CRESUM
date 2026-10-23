import { WorkoutStore } from '../workout-store';
import { WorkoutRepository, STATE_KEY } from '../workout-repository';
import { parseSharedPlan } from '../workout-sharing/contract';
const plan = parseSharedPlan({
  schemaVersion: 1,
  title: 'Coach plan',
  exercises: [
    {
      exerciseId: 'barbell-bench-press',
      sets: 2,
      target: { repMin: 8, repMax: 12, restMin: 0, restMax: 90 },
    },
  ],
});
const origin = {
  publicationId: '550e8400-e29b-41d4-a716-446655440000',
  version: 1,
};
async function setup() {
  const values = new Map<string, string>();
  let fail = false;
  let release: (() => void) | undefined;
  const storage = {
    getItem: async (k: string) => values.get(k) ?? null,
    setItem: async (k: string, v: string) => {
      if (fail) throw Error('disk full');
      if (release)
        await new Promise<void>((r) => {
          release = r;
        });
      values.set(k, v);
    },
  };
  const repository = new WorkoutRepository(storage);
  const store = new WorkoutStore(repository);
  await store.load();
  return {
    store,
    values,
    repository,
    fail: () => {
      fail = true;
    },
    recover: () => {
      fail = false;
    },
  };
}
test('imports once, preserves edits, duplicates only explicitly, and retains origin after reload', async () => {
  const { store, repository } = await setup();
  const a = await store.importSharedPlan(plan, origin);
  expect(a.created).toBe(true);
  expect(a.template.name).toBe('Coach plan');
  await store.updateTemplate(a.template.id, {
    name: 'My edit',
    exerciseIds: a.template.exerciseIds,
  });
  const b = await store.importSharedPlan(plan, origin);
  expect(b.created).toBe(false);
  expect(b.template.name).toBe('My edit');
  const duplicate = await store.importSharedPlan(plan, origin, {
    duplicate: true,
  });
  expect(duplicate.template.id).not.toBe(a.template.id);
  const reloaded = new WorkoutStore(repository);
  await reloaded.load();
  expect((await reloaded.importSharedPlan(plan, origin)).created).toBe(false);
  await store.deleteTemplate(a.template.id);
  await store.deleteTemplate(duplicate.template.id);
  expect((await store.importSharedPlan(plan, origin)).created).toBe(true);
});
test('rejected writes leave no imported copy and retry safely', async () => {
  const s = await setup();
  const before = s.store.getSnapshot().data;
  s.fail();
  await expect(s.store.importSharedPlan(plan, origin)).rejects.toThrow();
  expect(s.store.getSnapshot().data).toBe(before);
  s.recover();
  const result = await s.store.importSharedPlan(plan, origin);
  const raw = JSON.parse(s.values.get(STATE_KEY)!);
  expect(
    raw.templates.filter((t: { id: string }) => t.id === result.template.id),
  ).toHaveLength(1);
});
test('concurrent requests never duplicate or overwrite another active session', async () => {
  const { store } = await setup();
  store.start(store.getSnapshot().data.templates[0]);
  await store.waitForPendingWrites();
  const active = store.getSnapshot().data.activeWorkout;
  const results = await Promise.allSettled([
    store.importSharedPlan(plan, origin),
    store.importSharedPlan(plan, origin),
  ]);
  expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  expect(
    store
      .getSnapshot()
      .data.templates.filter(
        (t) => t.origin?.publicationId === origin.publicationId,
      ),
  ).toHaveLength(1);
  expect(store.getSnapshot().data.activeWorkout).toBe(active);
  expect(store.getSnapshot().data.history).toHaveLength(0);
});
test('invalid origin rejects before save, and legacy templates still reload', async () => {
  const { store } = await setup();
  await expect(
    store.importSharedPlan(plan, { ...origin, version: 0 }),
  ).rejects.toThrow();
  expect(store.getSnapshot().data.templates.every((t) => !t.origin)).toBe(true);
});
