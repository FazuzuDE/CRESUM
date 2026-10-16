import {
  conflictFixture,
  savedWorkout,
} from './helpers/history-resolution-fixture';
import { HISTORY_LEDGER_KEY } from '../sync/history-ledger';
import { STATE_KEY } from '../workout-repository';
import { SYNC_METADATA_KEY } from '../sync/storage';
import { SyncRepository } from '../sync/repository';
const reps = (w: ReturnType<typeof savedWorkout>) =>
  w.exercises[0].sets[0].reps;
it('syncs a new Finish queued while a comparison lookup is in flight', async () => {
  const x = await conflictFixture();
  const api = x.server.api('A');
  let release!: () => void;
  const hold = new Promise<void>((r) => {
    release = r;
  });
  await x.engine.setAccount('A', {
    ...api,
    get: async (id) => {
      await hold;
      return api.get(id);
    },
  });
  const comparison = x.engine.compare('local');
  await new Promise((r) => setTimeout(r, 0));
  const before = x.store.getSnapshot().data.history;
  await x.store.applyCloudHistory(
    before,
    [...before, savedWorkout('new-finish')],
    () => true,
  );
  x.engine.changed();
  release();
  await comparison;
  for (let n = 0; n < 10 && !x.server.rows.get('A')?.has('new-finish'); n++)
    await new Promise((r) => setTimeout(r, 0));
  expect(x.server.rows.get('A')?.has('new-finish')).toBe(true);
});
it.each(['local', 'cloud', 'both'] as const)(
  'resolves %s explicitly and leaves unrelated history intact',
  async (choice) => {
    const x = await conflictFixture();
    expect(await x.engine.conflicts()).toEqual([
      { id: 'local', name: 'Upper Body' },
    ]);
    const view = await x.engine.compare('local');
    expect(reps(view.local!)).toBe('8');
    expect(reps(view.remote!.workout!)).toBe('10');
    const before = x.store.getSnapshot().data.history;
    await x.store.applyCloudHistory(
      before,
      [...before, savedWorkout('unrelated')],
      () => true,
    );
    await x.engine.resolve(view, choice);
    await x.engine.request();
    const history = x.store.getSnapshot().data.history;
    expect(reps(history.find((w) => w.id === 'local')!)).toBe(
      choice === 'local' ? '8' : '10',
    );
    expect(history.some((w) => w.id === 'unrelated')).toBe(true);
    expect(history).toHaveLength(choice === 'both' ? 3 : 2);
    if (choice === 'both')
      expect(
        reps(history.find((w) => !['local', 'unrelated'].includes(w.id))!),
      ).toBe('8');
    expect(await x.engine.conflicts()).toEqual([]);
    expect(x.engine.getSnapshot().status).toBe('synced');
  },
);
it.each(['local', 'cloud', 'both'] as const)(
  'recovers %s server success/client timeout on restart without a changed replay',
  async (choice) => {
    const x = await conflictFixture();
    const view = await x.engine.compare('local');
    x.server.failAfterCommit = true;
    await expect(x.engine.resolve(view, choice)).rejects.toMatchObject({
      kind: 'retryable',
    });
    expect(x.engine.getSnapshot().status).not.toBe('synced');
    x.engine.dispose();
    const next = x.create();
    await next.setAccount('A', x.server.api('A'));
    await next.request();
    expect(next.getSnapshot().status).toBe('synced');
    expect(x.server.resolutionCalls).toHaveLength(2);
    expect(x.server.resolutionCalls[1]).toEqual(x.server.resolutionCalls[0]);
    expect(x.store.getSnapshot().data.history).toHaveLength(
      choice === 'both' ? 2 : 1,
    );
    expect(x.server.rows.get('A')!.size).toBe(choice === 'both' ? 2 : 1);
  },
);
it.each(['local', 'remote'] as const)(
  'rejects a comparison after %s content changes',
  async (side) => {
    const x = await conflictFixture();
    const view = await x.engine.compare('local');
    if (side === 'remote') x.server.seed('A', savedWorkout('local', '12'));
    else {
      const old = x.store.getSnapshot().data.history;
      await x.store.applyCloudHistory(
        old,
        [savedWorkout('local', '6')],
        () => true,
      );
    }
    await expect(x.engine.resolve(view, 'cloud')).rejects.toMatchObject({
      kind: 'conflict',
    });
    expect(x.server.resolutionCalls).toHaveLength(0);
    expect(reps(x.store.getSnapshot().data.history[0])).toBe(
      side === 'local' ? '6' : '8',
    );
  },
);
it('rejects a remote CAS race between refreshed comparison and server transaction', async () => {
  const x = await conflictFixture(),
    view = await x.engine.compare('local');
  x.server.beforeResolve = () =>
    x.server.seed('A', savedWorkout('local', '12'));
  await expect(x.engine.resolve(view, 'both')).rejects.toMatchObject({
    kind: 'conflict',
  });
  expect(x.store.getSnapshot().data.history).toHaveLength(1);
  expect(x.server.rows.get('A')!.size).toBe(1);
  expect(reps(x.store.getSnapshot().data.history[0])).toBe('8');
});
it.each(['cloud', 'both'] as const)(
  'handles cloud tombstone using %s without reviving its identity',
  async (choice) => {
    const x = await conflictFixture();
    x.server.seed('A', null, 'local');
    await x.engine.request();
    const view = await x.engine.compare('local');
    expect(view.remote!.workout).toBeNull();
    await expect(x.engine.resolve(view, 'local')).rejects.toMatchObject({
      kind: 'conflict',
    });
    await x.engine.resolve(await x.engine.compare('local'), choice);
    await x.engine.request();
    expect(
      x.store.getSnapshot().data.history.some((w) => w.id === 'local'),
    ).toBe(false);
    expect(x.store.getSnapshot().data.history).toHaveLength(
      choice === 'both' ? 1 : 0,
    );
    expect(x.server.rows.get('A')!.get('local')!.workout).toBeNull();
  },
);
it('recovers Keep both after Core committed but its write rejected', async () => {
  const x = await conflictFixture(),
    view = await x.engine.compare('local');
  const write = x.storage.setItem;
  let failed = false;
  x.storage.setItem = async (k, v) => {
    await write(k, v);
    if (k === STATE_KEY && !failed) {
      failed = true;
      throw Error('after commit');
    }
  };
  await expect(x.engine.resolve(view, 'both')).rejects.toMatchObject({
    kind: 'retryable',
  });
  expect(x.store.getSnapshot().data.history).toHaveLength(2);
  // The prior readback already verified the committed history. Recovery must
  // finish metadata even if another unnecessary Core write would now fail.
  x.storage.setItem = async (k, v) => {
    if (k === STATE_KEY)
      throw Error('Core writes unavailable after verified commit');
    await write(k, v);
  };
  x.engine.dispose();
  const next = x.create();
  await next.setAccount('A', x.server.api('A'));
  await next.request();
  expect(next.getSnapshot().status).toBe('synced');
  expect(x.store.getSnapshot().data.history).toHaveLength(2);
  expect(x.server.resolutionCalls[1]).toEqual(x.server.resolutionCalls[0]);
});
it('keeps the conflict pending after a silent Core write and retries the same copy', async () => {
  const x = await conflictFixture(),
    view = await x.engine.compare('local'),
    write = x.storage.setItem;
  x.storage.setItem = async (k, v) => {
    if (k !== STATE_KEY) await write(k, v);
  };
  await expect(x.engine.resolve(view, 'both')).rejects.toMatchObject({
    kind: 'retryable',
  });
  expect(x.store.getSnapshot().data.history).toHaveLength(1);
  expect(await x.engine.conflicts()).toHaveLength(1);
  x.storage.setItem = write;
  await x.engine.request();
  expect(x.engine.getSnapshot().status).toBe('synced');
  expect(x.store.getSnapshot().data.history).toHaveLength(2);
  expect(x.server.rows.get('A')!.size).toBe(2);
});
it('does not send a choice after silent intent metadata writes', async () => {
  const x = await conflictFixture(),
    view = await x.engine.compare('local'),
    write = x.storage.setItem;
  x.storage.setItem = async (k, v) => {
    if (k !== HISTORY_LEDGER_KEY) await write(k, v);
  };
  await expect(x.engine.resolve(view, 'cloud')).rejects.toBeDefined();
  expect(x.server.resolutionCalls).toHaveLength(0);
  expect(reps(x.store.getSnapshot().data.history[0])).toBe('8');
});
it('retains pending choice after acknowledgement failure even when Core already changed', async () => {
  const x = await conflictFixture();
  const queue = new SyncRepository(x.storage, () => 'queue-id');
  const token = await queue.enqueue('A', {
    entityId: 'local',
    operation: 'upsert',
    baseRevision: 1,
  });
  await queue.defer('A', 'local', token, 'conflict');
  const view = await x.engine.compare('local'),
    write = x.storage.setItem;
  let failed = false;
  x.storage.setItem = async (k, v) => {
    await write(k, v);
    if (k === SYNC_METADATA_KEY && !failed) {
      failed = true;
      throw Error('ack committed then rejected');
    }
  };
  await expect(x.engine.resolve(view, 'cloud')).rejects.toMatchObject({
    kind: 'retryable',
  });
  expect(x.engine.getSnapshot().status).not.toBe('synced');
  x.storage.setItem = write;
  expect(await x.engine.conflicts()).toHaveLength(1);
  await x.engine.request();
  expect(x.engine.getSnapshot().status).toBe('synced');
  expect(reps(x.store.getSnapshot().data.history[0])).toBe('10');
});
it('blocks other-account and active identity collisions before lookup/publication', async () => {
  const x = await conflictFixture();
  x.setCurrent('B');
  await x.engine.setAccount('B', x.server.api('B'));
  await x.engine.enable();
  const calls = x.server.getCalls;
  expect((await x.engine.compare('local')).blocked).toBe('other-account');
  expect(x.server.getCalls).toBe(calls);
  expect(x.server.resolutionCalls).toHaveLength(0);
  x.setCurrent('A');
  await x.engine.setAccount('A', x.server.api('A'));
  const active = { ...savedWorkout('local'), finishedAt: undefined };
  // Deliberate identity collision: the resolver must never replace the active session.
  const data = x.store.getSnapshot().data;
  data.activeWorkout = active;
  expect((await x.engine.compare('local')).blocked).toBe('active');
  expect(x.store.getSnapshot().data.activeWorkout).toBe(active);
});
it('fences a held A reply after switching to B and keeps A copy claims', async () => {
  const x = await conflictFixture(),
    view = await x.engine.compare('local');
  let release!: () => void;
  x.server.hold = new Promise<void>((r) => {
    release = r;
  });
  const operation = x.engine.resolve(view, 'both');
  for (let i = 0; i < 100 && x.server.resolutionCalls.length === 0; i++)
    await new Promise((r) => setTimeout(r, 0));
  expect(x.server.resolutionCalls).toHaveLength(1);
  x.setCurrent('B');
  await x.engine.setAccount('B', x.server.api('B'));
  await x.engine.enable();
  const before = x.values.get(HISTORY_LEDGER_KEY);
  x.server.hold = null;
  release();
  await operation.catch(() => {});
  expect(x.values.get(HISTORY_LEDGER_KEY)).toBe(before);
  expect(x.store.getSnapshot().data.history).toHaveLength(1);
  expect(x.server.rows.get('B')?.size ?? 0).toBe(0);
});
it('quiesces a held choice without waiting and reset stays empty after the late reply', async () => {
  const x = await conflictFixture(),
    view = await x.engine.compare('local');
  let release!: () => void;
  x.server.hold = new Promise<void>((r) => {
    release = r;
  });
  const operation = x.engine.resolve(view, 'both');
  for (let i = 0; i < 100 && x.server.resolutionCalls.length === 0; i++)
    await new Promise((r) => setTimeout(r, 0));
  expect(x.server.resolutionCalls).toHaveLength(1);
  const resume = await x.engine.quiesce(true);
  x.values.delete(STATE_KEY);
  x.values.delete(SYNC_METADATA_KEY);
  x.store.resetAfterLocalDataRemoval();
  x.server.hold = null;
  release();
  await operation.catch(() => {});
  resume();
  await x.engine.request();
  expect(x.store.getSnapshot().data.history).toHaveLength(0);
  expect(x.values.has(STATE_KEY)).toBe(false);
  expect(x.values.has(SYNC_METADATA_KEY)).toBe(false);
  expect(x.engine.getSnapshot().status).toBe('paused');
  await x.engine.enable();
  expect(x.store.getSnapshot().data.history).toHaveLength(2);
  expect(x.server.resolutionCalls).toHaveLength(1);
});
it('handles a legacy empty workout ID without changing it', async () => {
  const x = await conflictFixture('');
  await x.engine.resolve(await x.engine.compare(''), 'local');
  await x.engine.request();
  expect(x.store.getSnapshot().data.history[0].id).toBe('');
  expect(x.engine.getSnapshot().status).toBe('synced');
});

it.each(['version', 'choice', 'hash', 'copy'] as const)(
  'fails closed on corrupt %s resolution metadata',
  async (kind) => {
    const x = await conflictFixture();
    x.server.failAfterCommit = true;
    await x.engine
      .resolve(await x.engine.compare('local'), 'both')
      .catch(() => {});
    const doc = JSON.parse(x.values.get(HISTORY_LEDGER_KEY)!);
    const op = doc.accounts.find((a: { userId: string }) => a.userId === 'A')
      .resolutions[0];
    if (kind === 'version') op.version = 2;
    if (kind === 'choice') op.choice = 'guess';
    if (kind === 'hash') op.localHash = 'invalid';
    if (kind === 'copy') op.copyId = op.workoutId;
    const raw = JSON.stringify(doc);
    x.values.set(HISTORY_LEDGER_KEY, raw);
    x.engine.dispose();
    const next = x.create();
    await next.setAccount('A', x.server.api('A'));
    expect(next.getSnapshot()).toMatchObject({
      status: 'error',
      kind: 'invalid',
    });
    expect(x.server.resolutionCalls).toHaveLength(1);
    expect(x.values.get(HISTORY_LEDGER_KEY)).toBe(raw);
    expect(reps(x.store.getSnapshot().data.history[0])).toBe('8');
  },
);

it('preserves a new local edit made while the confirmed server request is held', async () => {
  const x = await conflictFixture(),
    view = await x.engine.compare('local');
  let release!: () => void;
  x.server.hold = new Promise<void>((r) => {
    release = r;
  });
  const operation = x.engine.resolve(view, 'local');
  for (let i = 0; i < 100 && x.server.resolutionCalls.length === 0; i++)
    await new Promise((r) => setTimeout(r, 0));
  expect(x.server.resolutionCalls).toHaveLength(1);
  const before = x.store.getSnapshot().data.history;
  await x.store.applyCloudHistory(
    before,
    [savedWorkout('local', '6')],
    () => true,
  );
  x.server.hold = null;
  release();
  await expect(operation).rejects.toMatchObject({ kind: 'conflict' });
  expect(reps(x.store.getSnapshot().data.history[0])).toBe('6');
  await x.engine.request();
  expect(x.engine.getSnapshot().kind).toBe('conflict');
  expect(reps(x.store.getSnapshot().data.history[0])).toBe('6');
});

it('temporarily quiesces export then recovers the same choice without duplicate copies', async () => {
  const x = await conflictFixture(),
    view = await x.engine.compare('local');
  let release!: () => void;
  x.server.hold = new Promise<void>((r) => {
    release = r;
  });
  const operation = x.engine.resolve(view, 'both');
  for (let i = 0; i < 100 && x.server.resolutionCalls.length === 0; i++)
    await new Promise((r) => setTimeout(r, 0));
  expect(x.server.resolutionCalls).toHaveLength(1);
  const resume = await x.engine.quiesce();
  resume();
  x.server.hold = null;
  release();
  await operation.catch(() => {});
  await x.engine.request();
  expect(x.engine.getSnapshot().status).toBe('synced');
  expect(x.store.getSnapshot().data.history).toHaveLength(2);
  expect(x.server.rows.get('A')!.size).toBe(2);
  expect(x.server.resolutionCalls[1]).toEqual(x.server.resolutionCalls[0]);
});

it('does not replay a former cloud replacement after import and explicit Resume', async () => {
  const x = await conflictFixture(),
    view = await x.engine.compare('local');
  let release!: () => void;
  x.server.hold = new Promise<void>((r) => {
    release = r;
  });
  const operation = x.engine.resolve(view, 'cloud');
  for (let i = 0; i < 100 && x.server.resolutionCalls.length === 0; i++)
    await new Promise((r) => setTimeout(r, 0));
  expect(x.server.resolutionCalls).toHaveLength(1);
  const resume = await x.engine.quiesce(true);
  x.values.set(
    STATE_KEY,
    JSON.stringify({
      ...x.store.getSnapshot().data,
      history: [savedWorkout('local', '6')],
    }),
  );
  await x.store.load();
  x.server.hold = null;
  release();
  await operation.catch(() => {});
  resume();
  await x.engine.enable();
  expect(reps(x.store.getSnapshot().data.history[0])).toBe('6');
  expect(x.engine.getSnapshot().kind).toBe('conflict');
  expect(x.server.resolutionCalls).toHaveLength(1);
});
