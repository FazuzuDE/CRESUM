import { LocalDataResetError, resetLocalData } from '../local-data-reset';
import { WorkoutRepository } from '../workout-repository';
import { defaultTemplates } from '../workout-catalog';
import { SyncRepository } from '../sync/repository';
import { SYNC_DEVICE_KEY, SYNC_METADATA_KEY } from '../sync/storage';

const original = new Map([
  [
    'cresum_backup_policy_v1',
    '{"version":1,"enabled":true,"frequency":"monthly"}',
  ],
  [
    'cresum_body_weight_v1',
    '{"version":1,"entries":[{"id":"initial","recordedAt":1000,"kg":80}]}',
  ],
  ['cresum_training_program_v1', '{"version":1}'],
  ['cresum_onboarding_v1', '{"version":1}'],
  ['cresum_hidden_builtins_v1', '{"version":1,"ids":["upper"]}'],
  ['fitflow_history', '[{"id":"legacy"}]'],
  ['fitflow_active', '{"id":"active"}'],
  ['fitflow_templates', '[{"id":"custom"}]'],
  ['fitflow_state_v1', '{"schemaVersion":1}'],
  ['unrelated_app_key', 'keep me'],
]);

function memoryStorage() {
  const values = new Map(original);
  return {
    values,
    getItem: jest.fn(async (key: string) => values.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      values.delete(key);
    }),
  };
}

it('waits for pending writes, then deletes all CRESUM storage keys including hidden built-ins', async () => {
  const storage = memoryStorage();
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const reset = resetLocalData(storage, () => pending);
  await Promise.resolve();
  expect(storage.removeItem).not.toHaveBeenCalled();
  release();
  await reset;
  expect([...storage.values.entries()]).toEqual([
    ['unrelated_app_key', 'keep me'],
  ]);
});

it('restores the original values after a partial remove failure', async () => {
  const storage = memoryStorage();
  const remove = storage.removeItem.getMockImplementation()!;
  storage.removeItem.mockImplementation(async (key: string) => {
    if (key === 'fitflow_active') throw new Error('disk failure');
    return remove(key);
  });
  await expect(resetLocalData(storage, async () => {})).rejects.toThrow(
    'Local data could not be reset',
  );
  expect(storage.values).toEqual(original);
});

it('does not remove anything when the backup cannot be read', async () => {
  const storage = memoryStorage();
  storage.getItem.mockRejectedValueOnce(new Error('read failure'));
  await expect(resetLocalData(storage, async () => {})).rejects.toThrow(
    'No data was removed',
  );
  expect(storage.removeItem).not.toHaveBeenCalled();
  expect(storage.values).toEqual(original);
});

it('reports incomplete recovery rather than claiming saved data was restored', async () => {
  const storage = memoryStorage();
  storage.removeItem.mockImplementation(async (key: string) => {
    storage.values.delete(key);
    if (key === 'fitflow_active') throw new Error('remove failure');
  });
  storage.setItem.mockRejectedValueOnce(new Error('restore failure'));
  await expect(resetLocalData(storage, async () => {})).rejects.toMatchObject({
    recoveryIncomplete: true,
    message: expect.stringContaining('recovery was incomplete'),
  } satisfies Partial<LocalDataResetError>);
});

it('rejects a silent incomplete deletion and rolls back rather than reporting success', async () => {
  const storage = memoryStorage();
  const remove = storage.removeItem.getMockImplementation()!;
  storage.removeItem.mockImplementation(async (key: string) => {
    if (key === 'fitflow_state_v1') return;
    return remove(key);
  });
  await expect(resetLocalData(storage, async () => {})).rejects.toThrow(
    'Local data could not be reset',
  );
  expect(storage.values).toEqual(original);
});

it('cannot reimport old legacy workouts on the next launch after reset', async () => {
  const storage = memoryStorage();
  await resetLocalData(storage, async () => {});
  const workout = await new WorkoutRepository(storage).load();
  expect(workout.activeWorkout).toBeNull();
  expect(workout.history).toEqual([]);
  expect(workout.templates).toEqual(defaultTemplates);
});

it('clears queued sync intent on local reset while retaining device identity and auth', async () => {
  const storage = memoryStorage();
  let n = 0;
  const sync = new SyncRepository(storage, () => `sync-${++n}`);
  const deviceId = await sync.getDeviceId();
  const old = await sync.enqueue('a', {
    entityId: 'queued-only',
    operation: 'upsert',
    baseRevision: null,
  });
  storage.values.set('cresum_auth_v1', 'session-kept');
  await resetLocalData(storage, () => sync.flush());
  expect(storage.values.has(SYNC_METADATA_KEY)).toBe(false);
  expect(storage.values.has(SYNC_DEVICE_KEY)).toBe(true);
  expect(await sync.getDeviceId()).toBe(deviceId);
  expect(storage.values.get('cresum_auth_v1')).toBe('session-kept');
  expect(await sync.acknowledge('a', 'queued-only', old, 1)).toBe(false);
});

it('restores queued metadata if a later Core reset removal fails', async () => {
  const storage = memoryStorage();
  const sync = new SyncRepository(storage, () => 'unique-generation');
  await sync.enqueue('a', {
    entityId: 'queued-only',
    operation: 'delete',
    baseRevision: 2,
  });
  const before = new Map(storage.values);
  const remove = storage.removeItem.getMockImplementation()!;
  storage.removeItem.mockImplementation(async (key) => {
    if (key === 'fitflow_active') throw Error('disk');
    await remove(key);
  });
  await expect(resetLocalData(storage, () => sync.flush())).rejects.toThrow(
    'saved data was restored',
  );
  expect(storage.values).toEqual(before);
});
