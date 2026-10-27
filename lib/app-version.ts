export function displayAppVersion(version: string): string {
  if (!version) return version;
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  return match
    ? `${match[1]}.${match[2]}.${match[3].padStart(2, '0')}`
    : version;
}
