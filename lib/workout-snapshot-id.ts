export function createWorkoutSnapshotId(): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Restoring existing data must not require native crypto.
  const crypto = require('expo-crypto') as typeof import('expo-crypto');
  return crypto.randomUUID();
}
