import { serializeSync, writeVerified } from './sync/storage';

export const ACCOUNT_DELETION_KEY = 'cresum_account_deletion_v1';
export const AUTH_SESSION_KEY = 'cresum_auth_v1';
export type DeletionStatus = 'pending' | 'confirmed';
type Document = {
  version: 1;
  records: { userId: string; status: DeletionStatus }[];
};
type Storage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<unknown>;
  removeItem(key: string): Promise<unknown>;
};
const owner = (raw: string | null): string | undefined => {
  if (raw === null) return undefined;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed?.user?.id === 'string' ? parsed.user.id : undefined;
  } catch {
    return undefined;
  }
};

/** Metadata only, outside Core restore/reset. SDK session access shares this queue. */
export class AccountDeletionRepository {
  private document: Document = { version: 1, records: [] };
  private attempted = new Map<string, DeletionStatus>();
  private ready = false;
  constructor(private readonly storage: Storage) {}

  private exclusive<T>(operation: () => Promise<T>): Promise<T> {
    return serializeSync(this.storage, async () => {
      // Cooperating browser tabs share a lock. Native has one Auth owner and
      // uses the same in-process storage queue. No SDK/network calls hold it.
      const locks = (
        globalThis as unknown as {
          navigator?: {
            locks?: {
              request<T>(name: string, work: () => Promise<T>): Promise<T>;
            };
          };
        }
      ).navigator?.locks;
      return locks
        ? locks.request('cresum-account-state-v1', operation)
        : operation();
    });
  }
  private async read(): Promise<Document> {
    try {
      const raw = await this.storage.getItem(ACCOUNT_DELETION_KEY);
      const doc = raw === null ? { version: 1, records: [] } : JSON.parse(raw);
      if (
        doc?.version !== 1 ||
        !Array.isArray(doc.records) ||
        Object.keys(doc).length !== 2
      )
        throw new Error();
      const ids = new Set<string>();
      for (const row of doc.records) {
        if (
          !row ||
          Object.keys(row).length !== 2 ||
          typeof row.userId !== 'string' ||
          !row.userId ||
          row.userId.length > 256 ||
          ids.has(row.userId) ||
          !['pending', 'confirmed'].includes(row.status)
        )
          throw new Error();
        ids.add(row.userId);
      }
      this.document = doc;
      this.ready = true;
      return doc;
    } catch {
      this.ready = false;
      throw new Error('Account recovery metadata could not be verified.');
    }
  }
  load = () =>
    this.exclusive(async () => {
      const doc = await this.read();
      // Recover acknowledged deletion locally before SDK startup. Never retry a
      // destructive network request on launch or remove an unrelated session.
      for (const key of [AUTH_SESSION_KEY, AUTH_SESSION_KEY + '-user']) {
        const id = owner(await this.storage.getItem(key));
        if (!id || this.state(id) !== 'confirmed') continue;
        await this.storage.removeItem(key);
        if (owner(await this.storage.getItem(key)) === id)
          throw new Error('Session cleanup is incomplete.');
      }
      return doc;
    });
  state = (id: string): DeletionStatus | undefined => {
    const persisted = this.document.records.find(
      (r) => r.userId === id,
    )?.status;
    return persisted === 'confirmed'
      ? persisted
      : (this.attempted.get(id) ?? persisted);
  };
  blocked = (id: string): boolean => !this.ready || !!this.state(id);
  private record(id: string, status: DeletionStatus) {
    return this.exclusive(async () => {
      // Fence this owner before any fallible I/O, without regressing confirmed.
      if (this.state(id) !== 'confirmed') this.attempted.set(id, status);
      const doc = await this.read();
      const previous = doc.records.find((r) => r.userId === id);
      if (previous?.status === 'confirmed') return;
      if (previous) previous.status = status;
      else doc.records.push({ userId: id, status });
      // Retain a conservative in-memory block even if durability is ambiguous.
      // SDK reads must not erase an attempted intent when its write failed.
      this.document = doc;
      await writeVerified(
        this.storage,
        ACCOUNT_DELETION_KEY,
        JSON.stringify(doc),
      );
    });
  }
  pending = (id: string) => this.record(id, 'pending');
  confirmed = (id: string) => this.record(id, 'confirmed');
  clearSession = (id: string) =>
    this.exclusive(async () => {
      await this.read();
      if (this.state(id) !== 'confirmed')
        throw new Error('Deletion is not confirmed.');
      for (const key of [AUTH_SESSION_KEY, AUTH_SESSION_KEY + '-user']) {
        const raw = await this.storage.getItem(key),
          storedOwner = owner(raw);
        if (raw !== null && !storedOwner)
          throw new Error('Stored session owner could not be verified.');
        if (storedOwner !== id) continue;
        await this.storage.removeItem(key);
        if (owner(await this.storage.getItem(key)) === id)
          throw new Error('Session cleanup is incomplete.');
      }
    });
  sessionStorage = {
    getItem: (key: string) =>
      this.exclusive(async () => {
        await this.read();
        const raw = await this.storage.getItem(key);
        if (key === AUTH_SESSION_KEY || key === AUTH_SESSION_KEY + '-user') {
          const id = owner(raw);
          if (id && this.state(id) === 'confirmed') return null;
        }
        return raw;
      }),
    setItem: (key: string, value: string) =>
      this.exclusive(async () => {
        await this.read();
        if (key === AUTH_SESSION_KEY || key === AUTH_SESSION_KEY + '-user') {
          const id = owner(value);
          if (id && this.state(id) === 'confirmed') return;
        }
        await this.storage.setItem(key, value);
      }),
    removeItem: (key: string) =>
      this.exclusive(async () => {
        await this.storage.removeItem(key);
      }),
  };
}
