import {
  errorKind,
  identifier,
  parseSyncDocument,
  positiveInteger,
  SyncMetadataError,
  validateInput,
  type IntentToken,
  type StoredIntent,
  type SyncDocument,
  type SyncErrorKind,
  type SyncIntentInput,
  type SyncSnapshot,
  type UserSyncMetadata,
} from './model';
import {
  flushSync,
  serializeSync,
  SYNC_DEVICE_KEY,
  SYNC_METADATA_KEY,
  writeVerified,
  type SyncStorage,
} from './storage';

// The future platform owner supplies a globally unique ID factory and activates
// this repository only after recovery/writer-drain integration is implemented.
export class SyncRepository {
  constructor(
    private readonly storage: SyncStorage,
    private readonly makeId: () => string,
  ) {}

  private newId(): string {
    const id = this.makeId();
    if (!identifier(id)) throw new SyncMetadataError();
    return id;
  }
  private async read(): Promise<SyncDocument | null> {
    const raw = await this.storage.getItem(SYNC_METADATA_KEY);
    return raw === null ? null : parseSyncDocument(raw);
  }
  private save(doc: SyncDocument): Promise<void> {
    const raw = JSON.stringify(doc);
    parseSyncDocument(raw);
    return writeVerified(this.storage, SYNC_METADATA_KEY, raw);
  }
  private user(doc: SyncDocument, userId: string): UserSyncMetadata {
    let user = doc.users.find((u) => u.userId === userId);
    if (!user) {
      user = { userId, generation: this.newId(), cursor: null, intents: [] };
      doc.users.push(user);
    }
    return user;
  }
  private run<T>(userId: string, work: () => Promise<T>): Promise<T> {
    return serializeSync(this.storage, async () => {
      if (!identifier(userId)) throw new SyncMetadataError();
      return work();
    });
  }
  private matches(
    user: UserSyncMetadata | undefined,
    entityId: string,
    token: IntentToken,
  ): boolean {
    return (
      !!user &&
      !!token &&
      token.generation === user.generation &&
      token.entityId === entityId &&
      positiveInteger(token.sequence)
    );
  }
  async getDeviceId(): Promise<string> {
    return serializeSync(this.storage, async () => {
      const raw = await this.storage.getItem(SYNC_DEVICE_KEY);
      if (raw !== null) {
        const value = JSON.parse(raw);
        if (value?.version !== 1 || !identifier(value.id))
          throw new SyncMetadataError();
        return value.id;
      }
      const id = this.newId();
      await writeVerified(
        this.storage,
        SYNC_DEVICE_KEY,
        JSON.stringify({ version: 1, id }),
      );
      return id;
    });
  }
  snapshot(userId: string): Promise<SyncSnapshot> {
    return this.run(userId, async () => {
      const existing = await this.read();
      const doc = existing ?? { version: 1, nextSequence: 1, users: [] };
      const hadUser = doc.users.some((u) => u.userId === userId);
      const user = this.user(doc, userId);
      if (!hadUser) await this.save(doc);
      return {
        generation: user.generation,
        cursor: user.cursor,
        intents: user.intents.map((intent) => ({
          ...intent,
          token: {
            generation: user.generation,
            entityId: intent.entityId,
            sequence: intent.sequence,
          },
        })),
      };
    });
  }
  enqueue(userId: string, input: SyncIntentInput): Promise<IntentToken> {
    return this.run(userId, async () => {
      validateInput(input);
      const doc = (await this.read()) ?? {
        version: 1,
        nextSequence: 1,
        users: [],
      };
      if (doc.nextSequence >= Number.MAX_SAFE_INTEGER)
        throw new SyncMetadataError();
      const user = this.user(doc, userId),
        index = user.intents.findIndex((i) => i.entityId === input.entityId);
      const old = user.intents[index];
      const base = Math.max(old?.baseRevision ?? 0, input.baseRevision ?? 0);
      const intent: StoredIntent = {
        entityType: 'completed_workout',
        entityId: input.entityId,
        operation: input.operation,
        baseRevision: base || null,
        sequence: doc.nextSequence++,
        state: 'pending',
        attempts: 0,
        error: null,
      };
      if (index < 0) user.intents.push(intent);
      else user.intents[index] = intent;
      await this.save(doc);
      return {
        generation: user.generation,
        entityId: intent.entityId,
        sequence: intent.sequence,
      };
    });
  }
  acknowledge(
    userId: string,
    entityId: string,
    token: IntentToken,
    remoteRevision: number,
  ): Promise<boolean> {
    return this.run(userId, async () => {
      if (!positiveInteger(remoteRevision)) throw new SyncMetadataError();
      const doc = await this.read(),
        user = doc?.users.find((u) => u.userId === userId);
      if (!this.matches(user, entityId, token)) return false;
      const intent = user!.intents.find((i) => i.entityId === entityId);
      if (!intent || token.sequence > intent.sequence) return false;
      if (token.sequence === intent.sequence) {
        user!.intents = user!.intents.filter((i) => i !== intent);
        await this.save(doc!);
        return true;
      }
      if (remoteRevision > (intent.baseRevision ?? 0)) {
        intent.baseRevision = remoteRevision;
        await this.save(doc!);
      }
      return false;
    });
  }
  private updateIntent(
    userId: string,
    entityId: string,
    token: IntentToken,
    update: (intent: StoredIntent) => void,
  ): Promise<boolean> {
    return this.run(userId, async () => {
      const doc = await this.read(),
        user = doc?.users.find((u) => u.userId === userId);
      if (!this.matches(user, entityId, token)) return false;
      const intent = user!.intents.find(
        (i) => i.entityId === entityId && i.sequence === token.sequence,
      );
      if (!intent) return false;
      update(intent);
      await this.save(doc!);
      return true;
    });
  }
  defer(
    userId: string,
    entityId: string,
    token: IntentToken,
    reason: SyncErrorKind,
  ): Promise<boolean> {
    return this.updateIntent(userId, entityId, token, (intent) => {
      if (!errorKind(reason) || intent.attempts >= Number.MAX_SAFE_INTEGER)
        throw new SyncMetadataError();
      intent.attempts++;
      intent.error = reason;
      intent.state = reason === 'retryable' ? 'pending' : 'blocked';
    });
  }
  retry(
    userId: string,
    entityId: string,
    token: IntentToken,
  ): Promise<boolean> {
    return this.updateIntent(userId, entityId, token, (intent) => {
      intent.state = 'pending';
      intent.error = null;
    });
  }
  setCursor(
    userId: string,
    cursor: string,
    generation: string,
  ): Promise<boolean> {
    return this.run(userId, async () => {
      if (typeof cursor !== 'string') throw new SyncMetadataError();
      const doc = await this.read(),
        user = doc?.users.find((u) => u.userId === userId);
      if (!user || user.generation !== generation) return false;
      user.cursor = cursor;
      await this.save(doc!);
      return true;
    });
  }
  clearUser(userId: string): Promise<void> {
    return this.run(userId, async () => {
      const doc = await this.read();
      if (!doc || !doc.users.some((u) => u.userId === userId)) return;
      doc.users = doc.users.filter((u) => u.userId !== userId);
      await this.save(doc);
    });
  }
  flush(): Promise<void> {
    return flushSync(this.storage);
  }
}
