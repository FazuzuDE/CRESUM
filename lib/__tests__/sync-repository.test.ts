import { SyncRepository } from '../sync/repository';
import { SYNC_DEVICE_KEY, SYNC_METADATA_KEY } from '../sync/storage';

function memory() {
  const values = new Map<string, string>([
    ['fitflow_state_v1', 'core-untouched'],
  ]);
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
function ids() {
  let n = 0;
  return () => `unique-${++n}`;
}
const input = (entityId = 'legacy-id', baseRevision: number | null = null) => ({
  entityId,
  operation: 'upsert' as const,
  baseRevision,
});

it('persists one device identity across repository instances and concurrent initialization', async () => {
  const storage = memory(),
    makeId = ids();
  const a = new SyncRepository(storage, makeId),
    b = new SyncRepository(storage, makeId);
  const values = await Promise.all([
    a.getDeviceId(),
    b.getDeviceId(),
    a.getDeviceId(),
  ]);
  expect(new Set(values).size).toBe(1);
  expect(await new SyncRepository(storage, makeId).getDeviceId()).toBe(
    values[0],
  );
  expect(storage.values.has(SYNC_DEVICE_KEY)).toBe(true);
});

it('survives restart and isolates owners even when entity IDs are identical', async () => {
  const storage = memory(),
    makeId = ids();
  const repo = new SyncRepository(storage, makeId);
  const token = await repo.enqueue('owner-a', input());
  await repo.enqueue('owner-b', input());
  const reopened = new SyncRepository(storage, makeId);
  expect((await reopened.snapshot('owner-a')).intents).toEqual([
    expect.objectContaining({
      entityType: 'completed_workout',
      entityId: 'legacy-id',
      state: 'pending',
      attempts: 0,
      error: null,
      token,
    }),
  ]);
  expect((await reopened.snapshot('owner-b')).generation).not.toBe(
    token.generation,
  );
  expect(storage.values.get('fitflow_state_v1')).toBe('core-untouched');
});

it('coalesces newer entity intent and preserves the exact legacy ID', async () => {
  const storage = memory(),
    repo = new SyncRepository(storage, ids());
  const before = await repo.enqueue('a', input(''));
  const after = await repo.enqueue('a', {
    entityId: '',
    operation: 'delete',
    baseRevision: 3,
  });
  expect(after.sequence).toBeGreaterThan(before.sequence);
  expect((await repo.snapshot('a')).intents).toEqual([
    expect.objectContaining({
      entityId: '',
      operation: 'delete',
      baseRevision: 3,
      token: after,
    }),
  ]);
});

it('retains newer work after an old success and advances its base without regressing it', async () => {
  const repo = new SyncRepository(memory(), ids());
  const old = await repo.enqueue('a', input());
  const newer = await repo.enqueue('a', input());
  expect(await repo.acknowledge('a', 'legacy-id', old, 5)).toBe(false);
  expect(await repo.acknowledge('a', 'legacy-id', old, 2)).toBe(false);
  expect((await repo.snapshot('a')).intents).toEqual([
    expect.objectContaining({ token: newer, baseRevision: 5 }),
  ]);
  expect(await repo.acknowledge('a', 'legacy-id', newer, 6)).toBe(true);
  expect((await repo.snapshot('a')).intents).toHaveLength(0);
});

it('never acknowledges another account using a same-ID intent token', async () => {
  const repo = new SyncRepository(memory(), ids());
  const a = await repo.enqueue('a', input());
  await repo.enqueue('b', input());
  expect(await repo.acknowledge('b', 'legacy-id', a, 1)).toBe(false);
  expect((await repo.snapshot('b')).intents).toHaveLength(1);
});

it('does not apply an older token from a different entity to a newer intent', async () => {
  const repo = new SyncRepository(memory(), ids());
  const first = await repo.enqueue('a', input('first'));
  await repo.enqueue('a', input('second'));
  expect(await repo.acknowledge('a', 'second', first, 99)).toBe(false);
  expect((await repo.snapshot('a')).intents[1].baseRevision).toBeNull();
});

it('does not lower a known base revision when coalescing newer local edits', async () => {
  const repo = new SyncRepository(memory(), ids());
  await repo.enqueue('a', input('x', 7));
  await repo.enqueue('a', input('x', 2));
  expect((await repo.snapshot('a')).intents[0].baseRevision).toBe(7);
});

it('keeps transient errors pending, blocks actionable errors and supports explicit retry', async () => {
  const repo = new SyncRepository(memory(), ids());
  const token = await repo.enqueue('a', input());
  expect(await repo.defer('a', 'legacy-id', token, 'retryable')).toBe(true);
  expect((await repo.snapshot('a')).intents[0]).toMatchObject({
    state: 'pending',
    attempts: 1,
    error: 'retryable',
  });
  await repo.defer('a', 'legacy-id', token, 'conflict');
  expect((await repo.snapshot('a')).intents[0]).toMatchObject({
    state: 'blocked',
    attempts: 2,
    error: 'conflict',
  });
  expect(await repo.retry('a', 'legacy-id', token)).toBe(true);
  expect((await repo.snapshot('a')).intents[0]).toMatchObject({
    state: 'pending',
    attempts: 2,
    error: null,
  });
  const next = await repo.enqueue('a', input());
  expect(await repo.defer('a', 'legacy-id', token, 'auth')).toBe(false);
  expect((await repo.snapshot('a')).intents[0]).toMatchObject({
    token: next,
    state: 'pending',
  });
});

it('rejects old acknowledgements and cursors after account clear without disturbing another owner', async () => {
  const repo = new SyncRepository(memory(), ids());
  const old = await repo.enqueue('a', input());
  const b = await repo.enqueue('b', input());
  await repo.clearUser('a');
  expect(await repo.setCursor('a', 'late', old.generation)).toBe(false);
  const current = await repo.enqueue('a', input());
  expect(current.generation).not.toBe(old.generation);
  expect(await repo.acknowledge('a', 'legacy-id', old, 1)).toBe(false);
  expect(await repo.setCursor('a', 'late', old.generation)).toBe(false);
  expect(await repo.setCursor('a', 'cursor-2', current.generation)).toBe(true);
  expect((await repo.snapshot('a')).cursor).toBe('cursor-2');
  expect((await repo.snapshot('b')).intents[0].token).toEqual(b);
});

it('uses a new generation after local metadata removal even if the sequence restarts', async () => {
  const storage = memory(),
    makeId = ids(),
    repo = new SyncRepository(storage, makeId);
  const old = await repo.enqueue('a', input());
  await storage.removeItem(SYNC_METADATA_KEY);
  const next = await new SyncRepository(storage, makeId).enqueue('a', input());
  expect(next.sequence).toBe(old.sequence);
  expect(next.generation).not.toBe(old.generation);
  expect(await repo.acknowledge('a', 'legacy-id', old, 1)).toBe(false);
  expect((await repo.snapshot('a')).intents).toHaveLength(1);
});

it('serializes writes across two owners and repository instances', async () => {
  const storage = memory(),
    makeId = ids();
  const a = new SyncRepository(storage, makeId),
    b = new SyncRepository(storage, makeId);
  await Promise.all(
    Array.from({ length: 20 }, (_, i) =>
      (i % 2 ? a : b).enqueue(i % 2 ? 'a' : 'b', input(`workout-${i}`)),
    ),
  );
  await a.flush();
  expect((await a.snapshot('a')).intents).toHaveLength(10);
  expect((await b.snapshot('b')).intents).toHaveLength(10);
});

it.each([
  'bad json',
  '{"version":2}',
  '{"version":1,"nextSequence":1,"users":null}',
])('preserves corrupt/future metadata: %s', async (raw) => {
  const storage = memory();
  storage.values.set(SYNC_METADATA_KEY, raw);
  const repo = new SyncRepository(storage, ids());
  await expect(repo.enqueue('a', input())).rejects.toThrow('Sync metadata');
  expect(storage.values.get(SYNC_METADATA_KEY)).toBe(raw);
  expect(storage.values.get('fitflow_state_v1')).toBe('core-untouched');
});

it('detects silent storage failures without claiming queued durability', async () => {
  const storage = memory(),
    repo = new SyncRepository(storage, ids());
  await repo.snapshot('a');
  const before = storage.values.get(SYNC_METADATA_KEY);
  storage.setItem = async () => {};
  await expect(repo.enqueue('a', input())).rejects.toThrow('Sync metadata');
  expect(storage.values.get(SYNC_METADATA_KEY)).toBe(before);
});

it('recovers serialization after a rejected write and rereads a committed-but-rejected write', async () => {
  const storage = memory(),
    repo = new SyncRepository(storage, ids());
  await repo.snapshot('a');
  const write = storage.setItem;
  storage.setItem = async () => {
    throw Error('disk');
  };
  await expect(repo.enqueue('a', input('not-written'))).rejects.toThrow(
    'Sync metadata',
  );
  storage.setItem = async (key, value) => {
    await write(key, value);
    throw Error('commit then reject');
  };
  await expect(repo.enqueue('a', input('written'))).rejects.toThrow(
    'Sync metadata',
  );
  storage.setItem = write;
  await repo.enqueue('a', input('after'));
  expect((await repo.snapshot('a')).intents.map((i) => i.entityId)).toEqual([
    'written',
    'after',
  ]);
});

it('returns detached snapshots and rejects exhausted local sequence numbers', async () => {
  const storage = memory(),
    repo = new SyncRepository(storage, ids());
  await repo.enqueue('a', input());
  const snapshot = await repo.snapshot('a');
  snapshot.intents[0].entityId = 'mutated';
  expect((await repo.snapshot('a')).intents[0].entityId).toBe('legacy-id');
  const raw = JSON.parse(storage.values.get(SYNC_METADATA_KEY)!);
  raw.nextSequence = Number.MAX_SAFE_INTEGER;
  storage.values.set(SYNC_METADATA_KEY, JSON.stringify(raw));
  await expect(repo.enqueue('a', input('overflow'))).rejects.toThrow(
    'Sync metadata',
  );
  expect((await repo.snapshot('a')).intents).toHaveLength(1);
});

it.each(['not-json', '{"version":2,"id":"future"}', '{"version":1,"id":""}'])(
  'preserves invalid device identity: %s',
  async (raw) => {
    const storage = memory();
    storage.values.set(SYNC_DEVICE_KEY, raw);
    await expect(
      new SyncRepository(storage, ids()).getDeviceId(),
    ).rejects.toThrow('Sync metadata');
    expect(storage.values.get(SYNC_DEVICE_KEY)).toBe(raw);
  },
);

it('rejects invalid persisted intents and duplicate account generations without resetting the document', async () => {
  const storage = memory(),
    repo = new SyncRepository(storage, ids());
  await repo.enqueue('a', input());
  const valid = storage.values.get(SYNC_METADATA_KEY)!;
  for (const mutate of [
    (doc: {
      users: { userId: string; intents: Record<string, unknown>[] }[];
    }) => {
      doc.users[0].intents[0].error = { rawProviderError: 'private' };
    },
    (doc: {
      users: { userId: string; intents: Record<string, unknown>[] }[];
    }) => {
      doc.users.push({ ...doc.users[0], userId: 'b' });
    },
    (doc: {
      users: { userId: string; intents: Record<string, unknown>[] }[];
    }) => {
      doc.users[0].intents.push({
        ...doc.users[0].intents[0],
        entityId: 'different',
      });
    },
  ]) {
    const doc = JSON.parse(valid);
    mutate(doc);
    const raw = JSON.stringify(doc);
    storage.values.set(SYNC_METADATA_KEY, raw);
    await expect(repo.snapshot('a')).rejects.toThrow('Sync metadata');
    expect(storage.values.get(SYNC_METADATA_KEY)).toBe(raw);
  }
});

it('flush waits for a pending persisted operation', async () => {
  const storage = memory(),
    repo = new SyncRepository(storage, ids());
  await repo.snapshot('a');
  const write = storage.setItem;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  storage.setItem = async (key, value) => {
    await gate;
    await write(key, value);
  };
  const enqueue = repo.enqueue('a', input());
  let flushed = false;
  const flush = repo.flush().then(() => {
    flushed = true;
  });
  await Promise.resolve();
  expect(flushed).toBe(false);
  release();
  await Promise.all([enqueue, flush]);
  expect((await repo.snapshot('a')).intents).toHaveLength(1);
});
