import { SyncMetadataError } from './model';

export const SYNC_DEVICE_KEY = 'cresum_sync_device_v1';
export const SYNC_METADATA_KEY = 'cresum_sync_metadata_v1';
export type SyncStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<unknown>;
};

const pending = new WeakMap<SyncStorage, Promise<unknown>>();
export function serializeSync<T>(
  storage: SyncStorage,
  operation: () => Promise<T>,
): Promise<T> {
  const next = (pending.get(storage) ?? Promise.resolve())
    .catch(() => {})
    .then(async () => {
      try {
        return await operation();
      } catch {
        throw new SyncMetadataError();
      }
    });
  pending.set(
    storage,
    next.catch(() => {}),
  );
  return next;
}
export async function flushSync(storage: SyncStorage): Promise<void> {
  await pending.get(storage);
}
export async function writeVerified(
  storage: SyncStorage,
  key: string,
  value: string,
): Promise<void> {
  await storage.setItem(key, value);
  if ((await storage.getItem(key)) !== value) throw new SyncMetadataError();
}
