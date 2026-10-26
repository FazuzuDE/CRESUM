import { createHash } from 'crypto';
import { HistoryCoordinator } from '../sync/history-coordinator';
import { HISTORY_LEDGER_KEY, HISTORY_PAUSE_KEY } from '../sync/history-ledger';
import { SyncRepository } from '../sync/repository';
import { SYNC_METADATA_KEY } from '../sync/storage';
import { HistoryProtocolError, type HistoryPage } from '../sync/history-rpc';
import { WorkoutRepository, STATE_KEY } from '../workout-repository';
import { WorkoutStore } from '../workout-store';
import type { WorkoutSession } from '../workout-model';
const w = (id: string, name = id): WorkoutSession => ({
  id,
  name,
  templateId: 't',
  startedAt: 0,
  finishedAt: 10,
  currentExerciseIndex: 0,
  restDurationSeconds: 90,
  exercises: [],
});
const digest = async (s: string) =>
  createHash('sha256').update(s).digest('hex');
class Server {
  rows = new Map<
    string,
    Map<string, { workout: WorkoutSession | null; revision: number }>
  >();
  events: { user: string; id: string; sequence: string }[] = [];
  receipts = new Map<
    string,
    { request: string; revision: number; changeSequence: string }
  >();
  failAfterCommit = false;
  calls = 0;
  holdPull: Promise<void> | null = null;
  seed(user: string, workout: WorkoutSession | null, id = workout!.id) {
    const rows = this.rows.get(user) ?? new Map();
    const previous = rows.get(id);
    rows.set(id, { workout, revision: (previous?.revision ?? 0) + 1 });
    this.rows.set(user, rows);
    this.events.push({ user, id, sequence: String(this.events.length + 1) });
  }
  api(user: string) {
    return {
      pull: async (after = '0', limit = 50): Promise<HistoryPage> => {
        if (this.holdPull) await this.holdPull;
        const all = this.events.filter(
          (e) => e.user === user && Number(e.sequence) > Number(after),
        );
        const page = all.slice(0, limit);
        return {
          cursor: page.at(-1)?.sequence ?? after,
          hasMore: all.length > limit,
          changes: page.map((e) => {
            const r = this.rows.get(user)!.get(e.id)!;
            return {
              sequence: e.sequence,
              workoutId: e.id,
              revision: r.revision,
              workout: r.workout,
              deletedAt: r.workout ? null : '2026-10-15T12:00:00Z',
            };
          }),
        };
      },
      publish: async (input: {
        workoutId: string;
        mutationId: string;
        deviceId: string;
        expectedRevision: number | null;
        workout: WorkoutSession | null;
      }) => {
        this.calls++;
        const key = user + '|' + input.mutationId,
          request = JSON.stringify(input),
          old = this.receipts.get(key);
        if (old) {
          if (old.request !== request)
            throw new HistoryProtocolError('invalid');
          return { revision: old.revision, changeSequence: old.changeSequence };
        }
        const row = this.rows.get(user)?.get(input.workoutId);
        if ((row?.revision ?? null) !== input.expectedRevision)
          throw new HistoryProtocolError('conflict');
        this.seed(user, input.workout, input.workoutId);
        const result = {
          revision: this.rows.get(user)!.get(input.workoutId)!.revision,
          changeSequence: this.events.at(-1)!.sequence,
        };
        this.receipts.set(key, { ...result, request });
        if (this.failAfterCommit) {
          this.failAfterCommit = false;
          throw new HistoryProtocolError('retryable');
        }
        return result;
      },
    };
  }
}
async function setup(history: WorkoutSession[] = [w('local')]) {
  const values = new Map([
    [
      STATE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        activeWorkout: null,
        history,
        templates: [],
      }),
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
  const store = new WorkoutStore(new WorkoutRepository(storage));
  await store.load();
  let n = 0;
  const makeId = () => `uuid-${++n}`;
  const create = () =>
    new HistoryCoordinator({
      storage,
      store,
      makeId,
      digest,
      isCurrent: () => true,
    });
  return {
    values,
    storage,
    store,
    makeId,
    create,
    engine: create(),
    server: new Server(),
  };
}
it('retains unsupported grouped history locally while syncing the other workouts', async () => {
  const grouped: WorkoutSession = {
    ...w('grouped'),
    exercises: [
      {
        id: 'e',
        libraryId: 'lat-pulldown-close-neutral-ergonomic-handle',
        name: 'Ergonomic',
        muscle: 'Lats',
        exerciseGroup: { id: 'g', familyId: 'lat-pulldown', name: 'Pulldown' },
        sets: [{ id: 's', weight: '45', reps: '12', completedAt: 5 }],
      },
    ],
  };
  const x = await setup([grouped, w('plain')]);
  const api = x.server.api('A');
  const original = api.publish;
  api.publish = async (input) => {
    if (input.workout?.exercises.some((e) => e.exerciseGroup))
      throw new HistoryProtocolError('unsupported');
    return original(input);
  };
  await x.engine.setAccount('A', api);
  await x.engine.enable();
  expect(x.server.rows.get('A')?.has('plain')).toBe(true);
  expect(x.server.rows.get('A')?.has('grouped')).not.toBe(true);
  expect(
    x.store.getSnapshot().data.history.find((w) => w.id === 'grouped')
      ?.exercises[0].exerciseGroup?.id,
  ).toBe('g');
  expect(x.engine.getSnapshot().kind).toBe('unsupported');
});
it('requires explicit enable then merges distinct cloud/local history and survives restart', async () => {
  const x = await setup();
  x.server.seed('A', w('remote'));
  await x.engine.setAccount('A', x.server.api('A'));
  expect(x.engine.getSnapshot().status).toBe('disabled');
  expect(x.server.calls).toBe(0);
  await x.engine.enable();
  expect(x.store.getSnapshot().data.history.map((w) => w.id)).toEqual([
    'local',
    'remote',
  ]);
  expect(x.server.rows.get('A')!.size).toBe(2);
  expect(x.engine.getSnapshot().status).toBe('synced');
  x.engine.dispose();
  const next = x.create();
  await next.setAccount('A', x.server.api('A'));
  await next.request();
  expect(x.server.rows.get('A')!.size).toBe(2);
  expect(next.getSnapshot().status).toBe('synced');
});
it('never uploads known account A history to account B', async () => {
  const x = await setup();
  await x.engine.setAccount('A', x.server.api('A'));
  await x.engine.enable();
  await x.engine.setAccount(null);
  await x.engine.setAccount('B', x.server.api('B'));
  await x.engine.enable();
  expect(x.server.rows.get('B')?.size ?? 0).toBe(0);
  expect(x.store.getSnapshot().data.history).toHaveLength(1);
});
it('recovers server-success/client-timeout on restart without duplicate publication', async () => {
  const x = await setup();
  await x.engine.setAccount('A', x.server.api('A'));
  x.server.failAfterCommit = true;
  await x.engine.enable();
  expect(x.engine.getSnapshot()).toMatchObject({
    status: 'error',
    kind: 'retryable',
  });
  expect(x.server.events).toHaveLength(1);
  x.engine.dispose();
  const next = x.create();
  await next.setAccount('A', x.server.api('A'));
  await next.request();
  expect(next.getSnapshot().status).toBe('synced');
  expect(x.server.events).toHaveLength(1);
  expect(
    (await new SyncRepository(x.storage, x.makeId).snapshot('A')).intents,
  ).toEqual([]);
});
it('retains and exactly replays a pending mutation when the request failed before commit', async () => {
  const x = await setup();
  const api = x.server.api('A');
  let failed = true;
  const attempted: unknown[] = [];
  const publish = api.publish;
  api.publish = async (input) => {
    attempted.push(input);
    if (failed) {
      failed = false;
      throw new HistoryProtocolError('retryable');
    }
    return publish(input);
  };
  await x.engine.setAccount('A', api);
  await x.engine.enable();
  await x.engine.request();
  expect(attempted).toHaveLength(2);
  expect(attempted[0]).toEqual(attempted[1]);
  expect(x.engine.getSnapshot().status).toBe('synced');
});
it('keeps both sides on a same-ID conflict and never reports Synced', async () => {
  const x = await setup();
  x.server.seed('A', w('local', 'different cloud'));
  await x.engine.setAccount('A', x.server.api('A'));
  await x.engine.enable();
  expect(x.engine.getSnapshot()).toMatchObject({
    status: 'error',
    kind: 'conflict',
  });
  expect(x.store.getSnapshot().data.history[0].name).toBe('local');
  expect(x.server.rows.get('A')!.get('local')!.workout!.name).toBe(
    'different cloud',
  );
  await x.engine.request(true);
  expect(x.server.calls).toBe(0);
  expect(x.engine.getSnapshot().status).toBe('error');
});
it('applies remote edits/deletes only when the known local base is unchanged', async () => {
  const x = await setup();
  await x.engine.setAccount('A', x.server.api('A'));
  await x.engine.enable();
  x.server.seed('A', w('local', 'remote edit'));
  await x.engine.request();
  expect(x.store.getSnapshot().data.history[0].name).toBe('remote edit');
  x.server.seed('A', null, 'local');
  await x.engine.request();
  expect(x.store.getSnapshot().data.history).toEqual([]);
  expect(x.engine.getSnapshot().status).toBe('synced');
});
it('does not overwrite divergent local edits when a remote delete arrives', async () => {
  const x = await setup();
  await x.engine.setAccount('A', x.server.api('A'));
  await x.engine.enable();
  const before = x.store.getSnapshot().data.history;
  await x.store.applyCloudHistory(
    before,
    [w('local', 'unsynced edit')],
    () => true,
  );
  x.server.seed('A', null, 'local');
  await x.engine.request();
  expect(x.store.getSnapshot().data.history[0].name).toBe('unsynced edit');
  expect(x.engine.getSnapshot().kind).toBe('conflict');
});
it('fences late pull responses across account changes', async () => {
  const x = await setup([]);
  await x.engine.setAccount('A', x.server.api('A'));
  x.server.seed('A', w('A-only'));
  let release!: () => void;
  x.server.holdPull = new Promise<void>((r) => {
    release = r;
  });
  const pending = x.engine.enable();
  await new Promise((r) => setTimeout(r, 0));
  await x.engine.setAccount('B', x.server.api('B'));
  release();
  x.server.holdPull = null;
  await pending;
  expect(x.store.getSnapshot().data.history).toEqual([]);
  expect(x.engine.getSnapshot().status).toBe('disabled');
});
it('quiesces without waiting on the network and a persisted pause prevents reset repopulation', async () => {
  const x = await setup([]);
  await x.engine.setAccount('A', x.server.api('A'));
  x.server.seed('A', w('remote'));
  let release!: () => void;
  x.server.holdPull = new Promise<void>((r) => {
    release = r;
  });
  const pending = x.engine.enable();
  await new Promise((r) => setTimeout(r, 0));
  const resume = await x.engine.quiesce(true);
  x.values.delete(SYNC_METADATA_KEY);
  resume();
  release();
  x.server.holdPull = null;
  await pending;
  expect(x.values.get(HISTORY_PAUSE_KEY)).toBe('1');
  expect(x.store.getSnapshot().data.history).toEqual([]);
  const next = x.create();
  await next.setAccount('A', x.server.api('A'));
  expect(next.getSnapshot().status).toBe('paused');
  await next.enable();
  expect(x.store.getSnapshot().data.history.map((w) => w.id)).toEqual([
    'remote',
  ]);
});
it('fails cloud closed on corrupt provenance while still allowing reset pause', async () => {
  const x = await setup();
  x.values.set(HISTORY_LEDGER_KEY, 'corrupt future');
  await x.engine.setAccount('A', x.server.api('A'));
  await x.engine.enable();
  expect(x.server.calls).toBe(0);
  expect(x.engine.getSnapshot().status).toBe('error');
  const resume = await x.engine.quiesce(true);
  resume();
  expect(x.values.get(HISTORY_LEDGER_KEY)).toBe('corrupt future');
  expect(x.values.get(HISTORY_PAUSE_KEY)).toBe('1');
});
it('does not advance a cursor or claim success after a silent Core merge write', async () => {
  const x = await setup([]);
  x.server.seed('A', w('remote'));
  const set = x.storage.setItem;
  x.storage.setItem = async (k, v) => {
    if (k !== STATE_KEY) await set(k, v);
  };
  await x.engine.setAccount('A', x.server.api('A'));
  await x.engine.enable();
  expect(x.engine.getSnapshot().status).toBe('error');
  expect(x.store.getSnapshot().data.history).toEqual([]);
  const q = await new SyncRepository(x.storage, x.makeId).snapshot('A');
  expect(q.cursor ?? '0').toBe('0');
  x.storage.setItem = set;
  await x.engine.request();
  expect(x.store.getSnapshot().data.history.map((w) => w.id)).toEqual([
    'remote',
  ]);
});
it('keeps conflicted local history assigned to its enabled account on a later account switch', async () => {
  const x = await setup();
  x.server.seed('A', w('local', 'different cloud'));
  await x.engine.setAccount('A', x.server.api('A'));
  await x.engine.enable();
  await x.engine.setAccount('B', x.server.api('B'));
  await x.engine.enable();
  expect(x.server.rows.get('B')?.size ?? 0).toBe(0);
});
it('rejects regressing remote revisions without replacing newer local history', async () => {
  const x = await setup();
  await x.engine.setAccount('A', x.server.api('A'));
  await x.engine.enable();
  x.server.seed('A', w('local', 'new remote'));
  await x.engine.request();
  const api = x.server.api('A');
  api.pull = async (after = '0') => ({
    cursor: String(Number(after) + 1),
    hasMore: false,
    changes: [
      {
        sequence: String(Number(after) + 1),
        workoutId: 'local',
        revision: 1,
        deletedAt: null,
        workout: w('local', 'stale remote'),
      },
    ],
  });
  await x.engine.setAccount('A', api);
  await x.engine.request();
  expect(x.store.getSnapshot().data.history[0].name).toBe('new remote');
  expect(x.engine.getSnapshot().status).toBe('error');
});

it.each(['first pull', 'later page'])(
  'retains enabled account ownership after %s failure and switching accounts',
  async (failure) => {
    const x = await setup();
    const api = x.server.api('A');
    let calls = 0;
    api.pull = async () => {
      if (failure === 'first pull' || calls++ > 0)
        throw new HistoryProtocolError('retryable');
      return {
        cursor: '1',
        hasMore: true,
        changes: [
          {
            sequence: '1',
            workoutId: 'local',
            revision: 1,
            workout: w('local', 'different cloud'),
            deletedAt: null,
          },
        ],
      };
    };
    await x.engine.setAccount('A', api);
    await x.engine.enable();
    expect(x.engine.getSnapshot()).toMatchObject({
      status: 'error',
      kind: 'retryable',
    });
    await x.engine.setAccount('B', x.server.api('B'));
    await x.engine.enable();
    expect(x.server.rows.get('B')?.size ?? 0).toBe(0);
    expect(x.store.getSnapshot().data.history[0].name).toBe('local');
  },
);
