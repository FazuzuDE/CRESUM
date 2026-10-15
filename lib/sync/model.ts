export type SyncErrorKind = 'retryable' | 'auth' | 'conflict' | 'invalid';
export type SyncIntentInput = {
  entityId: string;
  operation: 'upsert' | 'delete';
  baseRevision: number | null;
};
export type IntentToken = {
  generation: string;
  entityId: string;
  sequence: number;
};
export type StoredIntent = SyncIntentInput & {
  entityType: 'completed_workout';
  sequence: number;
  state: 'pending' | 'blocked';
  attempts: number;
  error: SyncErrorKind | null;
};
export type UserSyncMetadata = {
  userId: string;
  generation: string;
  cursor: string | null;
  intents: StoredIntent[];
};
export type SyncDocument = {
  version: 1;
  nextSequence: number;
  users: UserSyncMetadata[];
};
export type SyncSnapshot = {
  generation: string;
  cursor: string | null;
  intents: (StoredIntent & { token: IntentToken })[];
};

export class SyncMetadataError extends Error {
  constructor() {
    super(
      'Sync metadata could not be read or saved. Local workouts remain available.',
    );
  }
}
export const positiveInteger = (value: unknown): value is number =>
  Number.isSafeInteger(value) && Number(value) > 0;
export const identifier = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;
export const errorKind = (value: unknown): value is SyncErrorKind =>
  value === 'retryable' ||
  value === 'auth' ||
  value === 'conflict' ||
  value === 'invalid';
export function validateInput(value: SyncIntentInput): void {
  if (
    !value ||
    typeof value.entityId !== 'string' ||
    (value.operation !== 'upsert' && value.operation !== 'delete') ||
    (value.baseRevision !== null && !positiveInteger(value.baseRevision))
  )
    throw new SyncMetadataError();
}
const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export function parseSyncDocument(raw: string): SyncDocument {
  let doc: unknown;
  try {
    doc = JSON.parse(raw);
  } catch {
    throw new SyncMetadataError();
  }
  if (
    !object(doc) ||
    doc.version !== 1 ||
    !positiveInteger(doc.nextSequence) ||
    !Array.isArray(doc.users)
  )
    throw new SyncMetadataError();
  const owners = new Set<string>(),
    generations = new Set<string>(),
    sequences = new Set<number>();
  for (const user of doc.users) {
    if (
      !object(user) ||
      !identifier(user.userId) ||
      owners.has(user.userId) ||
      !identifier(user.generation) ||
      generations.has(user.generation) ||
      (user.cursor !== null && typeof user.cursor !== 'string') ||
      !Array.isArray(user.intents)
    )
      throw new SyncMetadataError();
    owners.add(user.userId);
    generations.add(user.generation);
    const entities = new Set<string>();
    for (const intent of user.intents) {
      if (!object(intent)) throw new SyncMetadataError();
      validateInput(intent as unknown as SyncIntentInput);
      if (
        intent.entityType !== 'completed_workout' ||
        entities.has(intent.entityId as string) ||
        !positiveInteger(intent.sequence) ||
        intent.sequence >= doc.nextSequence ||
        sequences.has(intent.sequence) ||
        !Number.isSafeInteger(intent.attempts) ||
        Number(intent.attempts) < 0 ||
        (intent.state !== 'pending' && intent.state !== 'blocked') ||
        (intent.error !== null && !errorKind(intent.error)) ||
        (intent.state === 'blocked' &&
          (intent.error === null || intent.error === 'retryable')) ||
        (intent.state === 'pending' &&
          intent.error !== null &&
          intent.error !== 'retryable')
      )
        throw new SyncMetadataError();
      entities.add(intent.entityId as string);
      sequences.add(intent.sequence);
    }
  }
  return doc as unknown as SyncDocument;
}
