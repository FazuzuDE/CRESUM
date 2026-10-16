import {
  identifier,
  positiveInteger,
  SyncMetadataError,
  type IntentToken,
} from './model';
import { serializeSync, writeVerified, type SyncStorage } from './storage';
export const HISTORY_LEDGER_KEY = 'cresum_history_sync_v1';
export const HISTORY_PAUSE_KEY = 'cresum_history_sync_pause_v1';
export type HistoryFact = {
  id: string;
  revision: number;
  hash: string | null;
  deleted: boolean;
  conflict: boolean;
};
export type PendingHistoryRequest = {
  id: string;
  token: IntentToken;
  hash: string;
  expectedRevision: number | null;
};
export type HistoryAccount = {
  userId: string;
  enabled: boolean;
  facts: HistoryFact[];
  requests: PendingHistoryRequest[];
};
export type HistoryLedgerDocument = {
  version: 1;
  claims: { id: string; userId: string }[];
  accounts: HistoryAccount[];
};
export const validHash = (v: unknown): v is string =>
  typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
function parse(raw: string): HistoryLedgerDocument {
  const v: unknown = JSON.parse(raw);
  if (
    !object(v) ||
    v.version !== 1 ||
    !Array.isArray(v.claims) ||
    !Array.isArray(v.accounts)
  )
    throw new SyncMetadataError();
  const claims = new Set<string>(),
    users = new Set<string>();
  for (const c of v.claims) {
    if (
      !object(c) ||
      typeof c.id !== 'string' ||
      !identifier(c.userId) ||
      claims.has(c.id)
    )
      throw new SyncMetadataError();
    claims.add(c.id);
  }
  for (const a of v.accounts) {
    if (
      !object(a) ||
      !identifier(a.userId) ||
      users.has(a.userId) ||
      typeof a.enabled !== 'boolean' ||
      !Array.isArray(a.facts) ||
      !Array.isArray(a.requests)
    )
      throw new SyncMetadataError();
    users.add(a.userId);
    const facts = new Set<string>(),
      requests = new Set<string>();
    for (const f of a.facts) {
      if (
        !object(f) ||
        typeof f.id !== 'string' ||
        facts.has(f.id) ||
        !positiveInteger(f.revision) ||
        typeof f.deleted !== 'boolean' ||
        typeof f.conflict !== 'boolean' ||
        (f.deleted ? f.hash !== null : !validHash(f.hash))
      )
        throw new SyncMetadataError();
      facts.add(f.id);
    }
    for (const r of a.requests) {
      if (
        !object(r) ||
        typeof r.id !== 'string' ||
        requests.has(r.id) ||
        !validHash(r.hash) ||
        !object(r.token) ||
        !identifier(r.token.generation) ||
        r.token.entityId !== r.id ||
        !positiveInteger(r.token.sequence) ||
        (r.expectedRevision !== null && !positiveInteger(r.expectedRevision))
      )
        throw new SyncMetadataError();
      requests.add(r.id);
    }
  }
  return v as HistoryLedgerDocument;
}
export function historyAccount(
  doc: HistoryLedgerDocument,
  userId: string,
): HistoryAccount {
  let a = doc.accounts.find((a) => a.userId === userId);
  if (!a) {
    a = { userId, enabled: false, facts: [], requests: [] };
    doc.accounts.push(a);
  }
  return a;
}
export class HistoryLedger {
  constructor(private readonly storage: SyncStorage) {}
  private async load() {
    const raw = await this.storage.getItem(HISTORY_LEDGER_KEY);
    return raw === null
      ? { version: 1 as const, claims: [], accounts: [] }
      : parse(raw);
  }
  read(): Promise<HistoryLedgerDocument> {
    return serializeSync(this.storage, () => this.load());
  }
  change(
    work: (doc: HistoryLedgerDocument) => void,
    allowed: () => boolean = () => true,
  ): Promise<void> {
    return serializeSync(this.storage, async () => {
      if (!allowed()) throw new SyncMetadataError();
      const doc = await this.load();
      if (!allowed()) throw new SyncMetadataError();
      work(doc);
      const raw = JSON.stringify(doc);
      parse(raw);
      await writeVerified(this.storage, HISTORY_LEDGER_KEY, raw);
    });
  }
  paused(): Promise<boolean> {
    return serializeSync(this.storage, async () => {
      const v = await this.storage.getItem(HISTORY_PAUSE_KEY);
      if (v !== null && v !== '0' && v !== '1') throw new SyncMetadataError();
      return v === '1';
    });
  }
  setPaused(paused: boolean): Promise<void> {
    return serializeSync(this.storage, () =>
      writeVerified(this.storage, HISTORY_PAUSE_KEY, paused ? '1' : '0'),
    );
  }
}
export function canonicalHistoryJson(value: unknown): string {
  return JSON.stringify(value, (_key, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, v[k]]),
        )
      : v,
  );
}
