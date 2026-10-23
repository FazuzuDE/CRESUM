export const validSharingHost = (host: string) =>
  /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(host) &&
  host.length < 200;
export function createPlanLink(host: string, token: string): string {
  if (!validSharingHost(host) || !/^[a-f0-9]{64}$/.test(token))
    throw Error('Invalid plan link');
  return `https://${host.toLowerCase()}/shared?token=${token}`;
}
export function parsePlanLink(
  value: string,
  allowedHost: string,
): { token: string } | null {
  try {
    const u = new URL(value);
    const token = u.searchParams.get('token');
    return validSharingHost(allowedHost) &&
      u.protocol === 'https:' &&
      u.host === allowedHost.toLowerCase() &&
      u.pathname === '/shared' &&
      !u.hash &&
      !u.username &&
      !u.password &&
      [...u.searchParams.keys()].length === 1 &&
      token &&
      /^[a-f0-9]{64}$/.test(token)
      ? { token }
      : null;
  } catch {
    return null;
  }
}
