export function createWorkoutSnapshotId(): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Restoring existing data must not require native crypto.
  const crypto = require('expo-crypto') as typeof import('expo-crypto');
  return crypto.randomUUID();
}

// History sync and backups preserve IDs as opaque strings, including this namespace.
const fragmentPrefix = 'fragment:';

export function workoutFragmentId(
  sessionId: string,
  fragmentId: string,
): string {
  return fragmentPrefix + encodeURIComponent(sessionId) + ':' + fragmentId;
}

export function isWorkoutFragment(id: string): boolean {
  return (
    id.startsWith(fragmentPrefix) &&
    id.indexOf(':', fragmentPrefix.length) > fragmentPrefix.length
  );
}
