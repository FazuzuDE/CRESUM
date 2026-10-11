import { selectProgram } from '../training-programs/selectors';
import { makeAssignment } from '../training-programs/assignment';
import {
  ProgramRepository,
  PROGRAM_KEY,
} from '../training-programs/repository';
import { ProgramAcceptance } from '../training-programs/acceptance';
import { WorkoutRepository, STATE_KEY } from '../workout-repository';
import { WorkoutStore } from '../workout-store';
import { OnboardingRepository } from '../onboarding-repository';
import { initialOnboardingState } from '../onboarding';
import { exerciseLibrary } from '../exercise-library';
import { resetLocalData } from '../local-data-reset';
const assignment = () =>
  makeAssignment(
    selectProgram('get_stronger', 'beginner')!,
    'accept-1',
    '2026-10-11',
  );
const complete = {
  ...initialOnboardingState,
  status: 'completed' as const,
  step: 'complete' as const,
  answers: {
    goal: 'get_stronger' as const,
    experience: 'beginner' as const,
    environment: 'gym' as const,
  },
};
async function setup() {
  const values = new Map<string, string>();
  let writes = 0;
  let failAt = 0;
  const storage = {
    getItem: async (k: string) => values.get(k) ?? null,
    setItem: async (k: string, v: string) => {
      values.set(k, v);
      writes++;
      if (writes === failAt) throw Error('interrupted after write');
    },
    removeItem: async (k: string) => {
      values.delete(k);
    },
  };
  const store = new WorkoutStore(new WorkoutRepository(storage));
  await store.load();
  writes = 0;
  const repo = new ProgramRepository(storage);
  const onboarding = new OnboardingRepository(storage);
  const controller = new ProgramAcceptance(repo, store, (next) =>
    onboarding.save(next),
  );
  return {
    values,
    storage,
    store,
    repo,
    controller,
    fail: (n: number) => {
      writes = 0;
      failAt = n;
    },
  };
}
it('two START taps install a single complete batch without touching active/history', async () => {
  const s = await setup();
  s.store.start(s.store.getSnapshot().data.templates[0]);
  await s.store.waitForPendingWrites();
  const before = s.store.getSnapshot().data;
  const [one, two] = await Promise.all([
    s.controller.accept(assignment(), complete),
    s.controller.accept(assignment(), complete),
  ]);
  expect(one.status).toBe('accepted');
  expect(two.status).toBe('accepted');
  expect(s.store.getSnapshot().data.activeWorkout).toEqual(
    before.activeWorkout,
  );
  expect(s.store.getSnapshot().data.history).toEqual(before.history);
  expect(s.store.getSnapshot().data.templates).toHaveLength(
    before.templates.length + 2,
  );
  expect((await s.repo.load()).assignment?.id).toBe('accept-1');
});
it.each([1, 2, 3, 4])(
  'rolls forward interruption after write %i with stable IDs and no duplicate templates',
  async (n) => {
    const s = await setup();
    s.fail(n);
    expect((await s.controller.accept(assignment(), complete)).status).toBe(
      'pending',
    );
    s.fail(0);
    const reopened = new WorkoutStore(new WorkoutRepository(s.storage));
    await reopened.load();
    const recovery = new ProgramAcceptance(
      new ProgramRepository(s.storage),
      reopened,
      (next) => new OnboardingRepository(s.storage).save(next),
    );
    expect((await recovery.recover()).status).toBe('accepted');
    const ids = reopened.getSnapshot().data.templates.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.filter((id) => id.startsWith('program-accept-1-'))).toHaveLength(
      2,
    );
    expect(JSON.parse(s.values.get(STATE_KEY)!).history).toEqual([]);
  },
);
it.each(['edit', 'delete'])(
  'never overwrites a user %s after partially accepted templates',
  async (action) => {
    const s = await setup();
    s.fail(3);
    await s.controller.accept(assignment(), complete);
    s.fail(0);
    const template = s.store
      .getSnapshot()
      .data.templates.find((t) => t.id === 'program-accept-1-A')!;
    if (action === 'edit')
      await s.store.updateTemplate(template.id, {
        ...template,
        name: 'My edited day',
      });
    else await s.store.deleteTemplate(template.id);
    const before = JSON.stringify(s.store.getSnapshot().data);
    expect((await s.controller.recover()).status).toBe('conflict');
    expect(JSON.stringify(s.store.getSnapshot().data)).toBe(before);
  },
);
it('blocks a whole unmapped program and keeps damaged storage untouched', async () => {
  const s = await setup();
  const noCore = exerciseLibrary.filter(
    (e) => e.id !== 'standing-cable-anti-rotation-press',
  );
  const blocked = new ProgramAcceptance(
    s.repo,
    s.store,
    async () => {},
    noCore,
  );
  expect((await blocked.accept(assignment(), complete)).status).toBe('blocked');
  expect(s.values.has(PROGRAM_KEY)).toBe(false);
  s.values.set(PROGRAM_KEY, '{');
  expect((await s.controller.recover()).status).toBe('pending');
  expect(s.values.get(PROGRAM_KEY)).toBe('{');
});
it('drains in-flight acceptance before reset removes its key and installation marker', async () => {
  const s = await setup();
  const saving = s.controller.accept(assignment(), complete);
  s.controller.invalidate();
  await resetLocalData(s.storage, () => s.controller.waitForPendingWrites());
  await saving;
  s.store.resetAfterLocalDataRemoval();
  expect(s.values.has(PROGRAM_KEY)).toBe(false);
  expect(s.store.getSnapshot().data.activeWorkout).toBeNull();
});

it('rejects an incomplete supplied template batch before saving any proposal', async () => {
  const s = await setup();
  const forged = { ...assignment(), templates: [] };
  expect((await s.controller.accept(forged, complete)).status).toBe('blocked');
  expect(s.values.has(PROGRAM_KEY)).toBe(false);
});
