/** @jest-environment node */
import { createDeleteAccountHandler } from '../../supabase/functions/delete-account/handler';

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
function fixture() {
  const deleted: string[] = [];
  const seen: string[] = [];
  const handler = createDeleteAccountHandler({
    getUser: async (token: string) => {
      seen.push(token);
      if (token === 'down') throw new Error('private upstream error');
      if (token === 'expired') return null;
      return { id: token === 'B' ? B : A, isAnonymous: token === 'anonymous' };
    },
    deleteUser: async (id: string) => {
      deleted.push(id);
    },
  });
  return { handler, deleted, seen };
}
function request(
  token = 'A',
  body: unknown = { confirmation: 'DELETE', expectedUserId: A },
) {
  return new Request('https://example.test/delete-account', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}
it('hard-deletes only the verified confirmed owner and acknowledges that ID', async () => {
  const f = fixture(),
    r = await f.handler(request());
  expect(r.status).toBe(200);
  expect(await r.json()).toEqual({ deletedUserId: A });
  expect(f.deleted).toEqual([A]);
  expect(f.seen).toEqual(['A']);
  expect(r.headers.get('cache-control')).toBe('no-store');
});
it('rejects the account-change case instead of deleting B for confirmation of A', async () => {
  const f = fixture(),
    r = await f.handler(request('B'));
  expect(r.status).toBe(409);
  expect(f.deleted).toEqual([]);
});
it.each(['expired', 'anonymous'])(
  'rejects %s credentials without deletion',
  async (token) => {
    const f = fixture(),
      r = await f.handler(request(token));
    expect(r.status).toBe(401);
    expect(f.deleted).toEqual([]);
  },
);
it('does not call admin deletion when auth is unavailable or disclose upstream errors', async () => {
  const f = fixture(),
    r = await f.handler(request('down'));
  expect(r.status).toBe(503);
  expect(await r.text()).not.toContain('private');
  expect(f.deleted).toEqual([]);
});
it('does not report success when hard deletion fails', async () => {
  const handler = createDeleteAccountHandler({
    getUser: async () => ({ id: A, isAnonymous: false }),
    deleteUser: async () => {
      throw new Error('secret database detail');
    },
  });
  const r = await handler(request());
  expect(r.status).toBe(502);
  expect(await r.text()).not.toContain('secret');
});
it.each([
  { confirmation: 'delete', expectedUserId: A },
  { confirmation: 'DELETE', expectedUserId: 'bad' },
  { confirmation: 'DELETE', expectedUserId: A, userId: B },
  {},
])('rejects unconfirmed or malformed input %j', async (body) => {
  const f = fixture(),
    r = await f.handler(request('A', body));
  expect(r.status).toBe(400);
  expect(f.deleted).toEqual([]);
});
it('rejects missing authorization and non-JSON requests', async () => {
  const f = fixture();
  expect(
    (await f.handler(new Request('https://example.test', { method: 'POST' })))
      .status,
  ).toBe(401);
  const r = request();
  r.headers.set('Content-Type', 'text/plain');
  expect((await f.handler(r)).status).toBe(415);
  expect(f.deleted).toEqual([]);
});
it('rejects malformed JSON', async () => {
  const f = fixture();
  const r = new Request('https://example.test', {
    method: 'POST',
    headers: { Authorization: 'Bearer A', 'Content-Type': 'application/json' },
    body: '{',
  });
  expect((await f.handler(r)).status).toBe(400);
  expect(f.deleted).toEqual([]);
});
it('bounds streamed input by bytes even without Content-Length', async () => {
  const f = fixture();
  const payload =
    JSON.stringify({ confirmation: 'DELETE', expectedUserId: A }) +
    ' '.repeat(2048);
  const r = new Request('https://example.test', {
    method: 'POST',
    headers: { Authorization: 'Bearer A', 'Content-Type': 'application/json' },
    body: payload,
  });
  expect((await f.handler(r)).status).toBe(413);
  expect(f.deleted).toEqual([]);
});
it('handles preflight and unsupported methods without resolving or deleting a user', async () => {
  const f = fixture();
  const r = await f.handler(
    new Request('https://example.test', { method: 'OPTIONS' }),
  );
  expect(r.status).toBe(204);
  expect(r.headers.get('access-control-allow-headers')).toContain(
    'authorization',
  );
  expect((await f.handler(new Request('https://example.test'))).status).toBe(
    405,
  );
  expect(f.seen).toEqual([]);
  expect(f.deleted).toEqual([]);
});
it('wires the deployed entrypoint to verified Auth and hard deletion without exposing the server key', async () => {
  const deleted: [string, boolean][] = [];
  let handler: (req: Request) => Promise<Response>;
  const user = { id: B, is_anonymous: false };
  const createClient = jest.fn(() => ({
    auth: {
      getUser: async () => ({ data: { user }, error: null }),
      admin: {
        deleteUser: async (id: string, soft: boolean) => {
          deleted.push([id, soft]);
          return { error: null };
        },
      },
    },
  }));
  jest.doMock('npm:@supabase/supabase-js@2.117.2', () => ({ createClient }), {
    virtual: true,
  });
  const runtime = globalThis as unknown as { Deno?: unknown };
  runtime.Deno = {
    env: {
      get: (key: string) =>
        key === 'SUPABASE_URL' ? 'https://project.test' : 'server-only-secret',
    },
    serve: (fn: typeof handler) => {
      handler = fn;
    },
  };
  try {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- Execute the real Deno entrypoint within the isolated SDK/runtime boundary.
      require('../../supabase/functions/delete-account/index.js');
    });
    expect((await handler!(request('B'))).status).toBe(409);
    expect(deleted).toEqual([]);
    const r = await handler!(
      request('B', { confirmation: 'DELETE', expectedUserId: B }),
    );
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ deletedUserId: B });
    expect(deleted).toEqual([[B, false]]);
    expect(createClient).toHaveBeenCalledWith(
      'https://project.test',
      'server-only-secret',
      expect.objectContaining({
        auth: expect.objectContaining({
          persistSession: false,
          autoRefreshToken: false,
        }),
      }),
    );
  } finally {
    delete runtime.Deno;
  }
});

it('accepts exactly 2048 bytes and rejects oversized multibyte chunked input', async () => {
  const f = fixture();
  const json = JSON.stringify({ confirmation: 'DELETE', expectedUserId: A });
  const exact = new Request('https://example.test', {
    method: 'POST',
    headers: { Authorization: 'Bearer A', 'Content-Type': 'application/json' },
    body: json.padEnd(2048, ' '),
  });
  expect((await f.handler(exact)).status).toBe(200);
  const chunks = [
    new TextEncoder().encode(json),
    new TextEncoder().encode('é'.repeat(1024)),
  ];
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(chunk));
      controller.close();
    },
  });
  const streamed = new Request('https://example.test', {
    method: 'POST',
    headers: { Authorization: 'Bearer A', 'Content-Type': 'application/json' },
    body: stream,
    duplex: 'half',
  } as RequestInit & { duplex: string });
  expect((await f.handler(streamed)).status).toBe(413);
  expect(f.deleted).toEqual([A]);
});
it('declares a discoverable JavaScript Edge entrypoint with gateway JWT verification', () => {
  const fs = jest.requireActual<typeof import('node:fs')>('node:fs');
  const path = jest.requireActual<typeof import('node:path')>('node:path');
  const root = path.join(__dirname, '../../supabase');
  const config = fs.readFileSync(path.join(root, 'config.toml'), 'utf8');
  const section = config
    .split('[functions.delete-account]')[1]
    ?.split('\n[')[0];
  expect(section).toBeDefined();
  expect(section).toMatch(/verify_jwt\s*=\s*true/);
  const entrypoint = /entrypoint\s*=\s*"([^"]+)"/.exec(section!);
  expect(entrypoint).not.toBeNull();
  expect(fs.existsSync(path.join(root, entrypoint![1]))).toBe(true);
});

it.each([
  ['auth-denied', 401],
  ['auth-unavailable', 503],
  ['auth-throw', 503],
  ['admin-error', 502],
  ['admin-throw', 502],
  ['anonymous-user', 401],
] as const)(
  'keeps the deployed SDK boundary fail-closed for %s',
  async (scenario, status) => {
    const tokens: string[] = [],
      attempts: [string, boolean][] = [];
    let handler!: (request: Request) => Promise<Response>;
    const createClient = () => ({
      auth: {
        getUser: async (token: string) => {
          tokens.push(token);
          if (scenario === 'auth-throw')
            throw new Error('private upstream detail');
          return {
            data: {
              user: { id: A, is_anonymous: scenario === 'anonymous-user' },
            },
            error:
              scenario === 'auth-denied'
                ? { status: 401 }
                : scenario === 'auth-unavailable'
                  ? { status: 500 }
                  : null,
          };
        },
        admin: {
          deleteUser: async (id: string, soft: boolean) => {
            attempts.push([id, soft]);
            if (scenario === 'admin-throw')
              throw new Error('private upstream detail');
            return {
              error:
                scenario === 'admin-error'
                  ? { status: 500, message: 'private upstream detail' }
                  : null,
            };
          },
        },
      },
    });
    jest.doMock('npm:@supabase/supabase-js@2.117.2', () => ({ createClient }), {
      virtual: true,
    });
    const runtime = globalThis as unknown as { Deno?: unknown };
    runtime.Deno = {
      env: {
        get: (name: string) =>
          name === 'SUPABASE_URL'
            ? 'https://project.test'
            : 'server-only-secret',
      },
      serve: (fn: typeof handler) => {
        handler = fn;
      },
    };
    try {
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- Exercise the real Edge entrypoint with SDK failure replies.
        require('../../supabase/functions/delete-account/index.js');
      });
      const response = await handler(request());
      expect(response.status).toBe(status);
      expect(await response.text()).not.toMatch(
        /private upstream detail|server-only-secret|deletedUserId/,
      );
      expect(tokens).toEqual(['A']);
      expect(attempts).toEqual(
        scenario.startsWith('admin-') ? [[A, false]] : [],
      );
    } finally {
      delete runtime.Deno;
    }
  },
);
