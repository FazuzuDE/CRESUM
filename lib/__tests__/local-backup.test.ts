import { trainingPrograms } from '../training-programs/catalog';
import { makeAssignment } from '../training-programs/assignment';
import {
  createLocalBackup,
  parseLocalBackup,
  restoreLocalBackup,
  recoverLocalRestore,
  RESTORE_JOURNAL_KEY,
} from '../local-backup';
import {
  STATE_KEY,
  emptyWorkoutState,
  WorkoutRepository,
} from '../workout-repository';
import { LOCAL_DATA_KEYS } from '../local-data-reset';
import { startWorkout, finishWorkout } from '../workout-engine';
import { defaultTemplates, exerciseLibrary } from '../workout-catalog';
const now = 100000;
function storage() {
  const values = new Map<string, string>([
    [STATE_KEY, JSON.stringify(emptyWorkoutState())],
    ['other', 'keep'],
  ]);
  return {
    values,
    getItem: async (k: string) => values.get(k) ?? null,
    setItem: async (k: string, v: string) => {
      values.set(k, v);
    },
    removeItem: async (k: string) => {
      values.delete(k);
    },
  };
}
it('roundtrips whitelisted data without exporting unrelated keys or rewriting snapshots', async () => {
  const source = storage();
  source.values.set(
    'cresum_body_weight_v1',
    JSON.stringify({
      version: 1,
      entries: [{ id: 'w', kg: 80, recordedAt: 900 }],
    }),
  );
  source.values.set(
    'cresum_onboarding_v1',
    JSON.stringify({
      version: 1,
      status: 'in_progress',
      step: 'welcome',
      answers: {},
    }),
  );
  const text = await createLocalBackup(source, now);
  expect(text).not.toContain('"other"');
  const backup = await parseLocalBackup(text);
  expect(backup.summary.measurements).toBe(1);
  const target = storage();
  target.values.set('fitflow_history', 'obsolete');
  await restoreLocalBackup(target, backup);
  expect(await new WorkoutRepository(target).load()).toEqual(
    emptyWorkoutState(),
  );
  expect(target.values.get('cresum_body_weight_v1')).toBe(
    source.values.get('cresum_body_weight_v1'),
  );
  expect(target.values.get('other')).toBe('keep');
  expect(target.values.has('fitflow_history')).toBe(false);
  expect(target.values.has(RESTORE_JOURNAL_KEY)).toBe(false);
});
it('rejects malformed, future, incomplete and duplicate backup data before writes', async () => {
  const good = JSON.parse(await createLocalBackup(storage(), now));
  for (const bad of [
    { ...good, version: 99 },
    { ...good, format: 'other' },
    { ...good, data: {} },
    {
      ...good,
      data: {
        ...good.data,
        workouts: {
          ...emptyWorkoutState(),
          templates: [defaultTemplates[0], defaultTemplates[0]],
        },
      },
    },
  ])
    await expect(parseLocalBackup(JSON.stringify(bad))).rejects.toThrow();
  await expect(parseLocalBackup('{bad')).rejects.toThrow();
});
it('exports an active session but refuses to overwrite a current one', async () => {
  const s = storage();
  const active = startWorkout(defaultTemplates[0], exerciseLibrary, now);
  s.values.set(
    STATE_KEY,
    JSON.stringify({ ...emptyWorkoutState(), activeWorkout: active }),
  );
  const backup = await parseLocalBackup(await createLocalBackup(s, now));
  expect(backup.summary.activeWorkout).toBe(true);
  const before = new Map(s.values);
  await expect(restoreLocalBackup(s, backup)).rejects.toThrow('active workout');
  expect(s.values).toEqual(before);
  const target = storage();
  await restoreLocalBackup(target, backup);
  expect((await new WorkoutRepository(target).load()).activeWorkout).toEqual(
    active,
  );
});
it.each(LOCAL_DATA_KEYS)(
  'rolls back an interrupted write at %s',
  async (key) => {
    const source = storage();
    const backup = await parseLocalBackup(await createLocalBackup(source, now));
    const s = storage();
    s.values.set('fitflow_history', 'legacy');
    const before = new Map(s.values);
    let failed = false;
    const put = s.setItem,
      remove = s.removeItem;
    s.setItem = async (k, v) => {
      if (k === key && !failed) {
        failed = true;
        throw Error('disk');
      }
      await put(k, v);
    };
    s.removeItem = async (k) => {
      if (k === key && !failed) {
        failed = true;
        throw Error('disk');
      }
      await remove(k);
    };
    await expect(restoreLocalBackup(s, backup)).rejects.toThrow('restored');
    expect(s.values).toEqual(before);
  },
);
it('recovers the exact pre-restore snapshot at startup before any loads', async () => {
  const s = storage();
  const before = Object.fromEntries(
    await Promise.all(
      LOCAL_DATA_KEYS.map(async (k) => [k, await s.getItem(k)]),
    ),
  );
  s.values.set(RESTORE_JOURNAL_KEY, JSON.stringify({ version: 1, before }));
  s.values.set(STATE_KEY, 'partial');
  await recoverLocalRestore(s);
  expect(s.values.get(STATE_KEY)).toBe(before[STATE_KEY]);
  expect(s.values.has(RESTORE_JOURNAL_KEY)).toBe(false);
});
it('retains a journal and blocks recovery when rollback fails, then permits retry', async () => {
  const s = storage();
  const before = Object.fromEntries(
    await Promise.all(
      LOCAL_DATA_KEYS.map(async (k) => [k, await s.getItem(k)]),
    ),
  );
  s.values.set(RESTORE_JOURNAL_KEY, JSON.stringify({ version: 1, before }));
  s.values.set(STATE_KEY, 'partial');
  const put = s.setItem;
  s.setItem = async () => {
    throw Error('disk');
  };
  await expect(recoverLocalRestore(s)).rejects.toThrow('recovery');
  expect(s.values.has(RESTORE_JOURNAL_KEY)).toBe(true);
  s.setItem = put;
  await recoverLocalRestore(s);
  expect(s.values.get(STATE_KEY)).toBe(before[STATE_KEY]);
});

it('rejects oversized files and invalid sidecar documents', async () => {
  await expect(parseLocalBackup(' '.repeat(10_000_001))).rejects.toThrow(
    'valid CRESUM',
  );
  const good = JSON.parse(await createLocalBackup(storage(), now));
  for (const [name, value] of Object.entries({
    program: { version: 99 },
    onboarding: { version: 99 },
    bodyWeight: { version: 1, entries: [{ id: 'bad', kg: -1, recordedAt: 1 }] },
    hiddenBuiltIns: { version: 1, ids: ['unknown'] },
  }))
    await expect(
      parseLocalBackup(
        JSON.stringify({ ...good, data: { ...good.data, [name]: value } }),
      ),
    ).rejects.toThrow();
});
it('does not touch existing data when a rollback journal cannot be saved', async () => {
  const s = storage(),
    before = new Map(s.values),
    backup = await parseLocalBackup(await createLocalBackup(s, now));
  s.setItem = async () => {
    throw Error('disk');
  };
  await expect(restoreLocalBackup(s, backup)).rejects.toThrow();
  expect(s.values).toEqual(before);
});
it('detects a silent write failure and restores the previous values', async () => {
  const source = storage();
  source.values.set(
    STATE_KEY,
    JSON.stringify({ ...emptyWorkoutState(), templates: [] }),
  );
  const backup = await parseLocalBackup(await createLocalBackup(source, now));
  const s = storage(),
    before = new Map(s.values),
    put = s.setItem;
  let skipped = false;
  s.setItem = async (k, v) => {
    if (k === STATE_KEY && !skipped) {
      skipped = true;
      return;
    }
    await put(k, v);
  };
  await expect(restoreLocalBackup(s, backup)).rejects.toThrow(
    'previous local data was restored',
  );
  expect(s.values).toEqual(before);
});
it('refuses concurrent restores while a journal write is pending', async () => {
  const s = storage(),
    backup = await parseLocalBackup(await createLocalBackup(s, now));
  const put = s.setItem;
  let release!: () => void;
  const blocked = new Promise<void>((r) => {
    release = r;
  });
  s.setItem = async (k, v) => {
    if (k === RESTORE_JOURNAL_KEY) await blocked;
    await put(k, v);
  };
  const first = restoreLocalBackup(s, backup);
  await expect(restoreLocalBackup(s, backup)).rejects.toThrow(
    'already in progress',
  );
  release();
  await first;
});
it('blocks an invalid recovery journal without touching current data', async () => {
  const s = storage();
  s.values.set(
    RESTORE_JOURNAL_KEY,
    JSON.stringify({ version: 1, before: { unrelated: 'injected' } }),
  );
  const before = new Map(s.values);
  await expect(recoverLocalRestore(s)).rejects.toThrow('recovery');
  expect(s.values).toEqual(before);
});

it('serializes duplicate startup recovery attempts onto the same journal rollback', async () => {
  const s = storage();
  const before = Object.fromEntries(
    await Promise.all(
      LOCAL_DATA_KEYS.map(async (k) => [k, await s.getItem(k)]),
    ),
  );
  s.values.set(RESTORE_JOURNAL_KEY, JSON.stringify({ version: 1, before }));
  s.values.set(STATE_KEY, 'partial');
  const first = recoverLocalRestore(s),
    second = recoverLocalRestore(s);
  expect(second).toBe(first);
  await Promise.all([first, second]);
  expect(s.values.get(STATE_KEY)).toBe(before[STATE_KEY]);
});
it('exposes an ambiguous commit read failure for the gate to reload, without corrupting committed data', async () => {
  const source = storage();
  source.values.set(
    STATE_KEY,
    JSON.stringify({ ...emptyWorkoutState(), templates: [] }),
  );
  const backup = await parseLocalBackup(await createLocalBackup(source, now));
  const s = storage(),
    read = s.getItem,
    remove = s.removeItem;
  let failedReads = 0;
  s.removeItem = async (k) => {
    await remove(k);
    if (k === RESTORE_JOURNAL_KEY) failedReads = 2;
  };
  s.getItem = async (k) => {
    if (k === RESTORE_JOURNAL_KEY && failedReads > 0) {
      failedReads--;
      throw Error('temporary read failure');
    }
    return read(k);
  };
  await expect(restoreLocalBackup(s, backup)).rejects.toThrow();
  await recoverLocalRestore(s);
  expect((await new WorkoutRepository(s).load()).templates).toEqual([]);
});

it('roundtrips actual completed History, custom routines and every sidecar document', async () => {
  const source = storage(),
    assignment = makeAssignment(
      trainingPrograms[0],
      'installed',
      '2026-10-15',
      false,
    );
  const session = startWorkout(
    defaultTemplates[0],
    exerciseLibrary,
    now - 60000,
  );
  session.exercises[0].sets[0] = {
    ...session.exercises[0].sets[0],
    weight: '60.5',
    reps: '10',
    completedAt: now - 1,
  };
  const state = {
    ...emptyWorkoutState(),
    history: [finishWorkout(session, now)],
    templates: [
      ...defaultTemplates,
      ...assignment.templates,
      { ...defaultTemplates[0], id: 'custom', name: 'My routine' },
    ],
    programInstallations: [assignment.id],
  };
  source.values.set(STATE_KEY, JSON.stringify(state));
  source.values.set(
    'cresum_training_program_v1',
    JSON.stringify({ version: 1, assignment, pending: null }),
  );
  source.values.set(
    'cresum_hidden_builtins_v1',
    JSON.stringify({ version: 1, ids: ['upper'] }),
  );
  source.values.set(
    'cresum_body_weight_v1',
    JSON.stringify({
      version: 1,
      entries: [{ id: 'w', kg: 81.5, recordedAt: 900 }],
    }),
  );
  source.values.set(
    'cresum_onboarding_v1',
    JSON.stringify({
      version: 1,
      status: 'completed',
      step: 'complete',
      answers: { displayName: 'Saved name' },
    }),
  );
  const sourceBefore = new Map(source.values),
    prepared = await parseLocalBackup(await createLocalBackup(source, now)),
    target = storage();
  await restoreLocalBackup(target, prepared);
  expect(await new WorkoutRepository(target).load()).toEqual(state);
  for (const key of [
    'cresum_training_program_v1',
    'cresum_hidden_builtins_v1',
    'cresum_body_weight_v1',
    'cresum_onboarding_v1',
  ])
    expect(JSON.parse(target.values.get(key)!)).toEqual(
      JSON.parse(source.values.get(key)!),
    );
  expect(source.values).toEqual(sourceBefore);
  expect(prepared.summary).toMatchObject({
    workouts: 1,
    measurements: 1,
    activeWorkout: false,
  });
});
