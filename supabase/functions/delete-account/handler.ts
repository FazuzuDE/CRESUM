/** Pure HTTP boundary. Only the Deno entrypoint holds privileged credentials. */
type VerifiedUser = { id: string; isAnonymous: boolean };
type Ports = {
  getUser(token: string): Promise<VerifiedUser | null>;
  deleteUser(userId: string): Promise<void>;
};
const headers = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, apikey, content-type, x-client-info',
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const reply = (status: number, code: string) =>
  new Response(JSON.stringify({ error: code }), { status, headers });

async function readBody(request: Request): Promise<string | null> {
  const reader = request.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 2048) {
        void reader.cancel().catch(() => {});
        return null;
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } finally {
    reader.releaseLock();
  }
}

export function createDeleteAccountHandler(ports: Ports) {
  return async (request: Request): Promise<Response> => {
    if (request.method === 'OPTIONS')
      return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return reply(405, 'method_not_allowed');
    const bearer = /^Bearer ([^\s]{1,8192})$/i.exec(
      request.headers.get('Authorization') ?? '',
    );
    if (!bearer) return reply(401, 'authentication_required');
    if (
      request.headers
        .get('Content-Type')
        ?.split(';')[0]
        .trim()
        .toLowerCase() !== 'application/json'
    )
      return reply(415, 'json_required');
    let expectedUserId: string;
    try {
      const text = await readBody(request);
      if (text === null) return reply(413, 'request_too_large');
      const body: unknown = JSON.parse(text);
      if (!body || typeof body !== 'object' || Array.isArray(body))
        return reply(400, 'confirmation_required');
      const data = body as Record<string, unknown>;
      if (
        Object.keys(data).length !== 2 ||
        data.confirmation !== 'DELETE' ||
        typeof data.expectedUserId !== 'string' ||
        !uuid.test(data.expectedUserId)
      )
        return reply(400, 'confirmation_required');
      expectedUserId = data.expectedUserId;
    } catch {
      return reply(400, 'invalid_request');
    }
    let user: VerifiedUser | null;
    try {
      user = await ports.getUser(bearer[1]);
    } catch {
      return reply(503, 'authentication_unavailable');
    }
    if (!user || user.isAnonymous || !uuid.test(user.id))
      return reply(401, 'authentication_required');
    if (user.id !== expectedUserId) return reply(409, 'account_changed');
    try {
      // The expected ID is only a confirmation guard, never the admin target.
      await ports.deleteUser(user.id);
    } catch {
      return reply(502, 'deletion_not_confirmed');
    }
    return new Response(JSON.stringify({ deletedUserId: user.id }), {
      status: 200,
      headers,
    });
  };
}
