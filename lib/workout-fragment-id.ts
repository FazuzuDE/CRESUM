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
