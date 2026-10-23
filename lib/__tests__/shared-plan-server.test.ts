/** @jest-environment node */
import { createSharedPlanHandler } from '../../supabase/functions/shared-plan/handler';
const plan = {
  schemaVersion: 1,
  title: 'Day A',
  exercises: [{ exerciseId: 'barbell-bench-press', sets: 2 }],
};
const id = '550e8400-e29b-41d4-a716-446655440000';
function fixture() {
  const owned: string[] = [];
  let revoked = false;
  const handler = createSharedPlanHandler({
    getUser: async (token: string) =>
      token === 'owner' ? { id, isAnonymous: false } : null,
    resolveExercise: (v: string) => (v === 'barbell-bench-press' ? v : null),
    limit: async () => true,
    publish: async (owner: string, p: unknown) => {
      owned.push(owner);
      return {
        origin: { publicationId: id, version: 1 },
        token: 'a'.repeat(64),
        plan: p,
      };
    },
    read: async (token: string) =>
      !revoked && token === 'a'.repeat(64)
        ? { origin: { publicationId: id, version: 1 }, plan }
        : null,
    revoke: async (owner: string) => {
      owned.push(owner);
      revoked = true;
    },
    library: async () => [],
    owned: async () => [],
  });
  return { handler, owned };
}
const req = (method: string, body?: unknown, token?: string) =>
  new Request('https://example.test/shared-plan', {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
test('public callers cannot publish, revoke or enumerate private plans', async () => {
  const { handler, owned } = fixture();
  expect((await handler(req('POST', plan))).status).toBe(401);
  expect((await handler(req('DELETE', { publicationId: id }))).status).toBe(
    401,
  );
  expect((await handler(req('GET'))).status).toBe(404);
  expect(owned).toEqual([]);
});
test('validated author publishes and anonymous token read returns only snapshot', async () => {
  const { handler } = fixture();
  const response = await handler(req('POST', plan, 'owner'));
  expect(response.status).toBe(200);
  const read = await handler(
    new Request('https://example.test/shared-plan?token=' + 'a'.repeat(64)),
  );
  expect(await read.json()).toEqual({
    origin: { publicationId: id, version: 1 },
    plan,
  });
  expect(read.headers.get('cache-control')).toBe('no-store');
});
test('revoked and missing tokens are indistinguishable and no raw errors escape', async () => {
  const { handler } = fixture();
  await handler(req('DELETE', { publicationId: id }, 'owner'));
  const a = await handler(
    new Request('https://example.test/shared-plan?token=' + 'a'.repeat(64)),
  );
  const b = await handler(
    new Request('https://example.test/shared-plan?token=' + 'b'.repeat(64)),
  );
  expect(a.status).toBe(404);
  expect(await a.text()).toBe(await b.text());
});
test('oversize/malformed/unknown plans cannot publish', async () => {
  const { handler, owned } = fixture();
  expect(
    (await handler(req('POST', { ...plan, title: 'x'.repeat(65537) }, 'owner')))
      .status,
  ).toBe(400);
  expect(
    (
      await handler(
        req(
          'POST',
          { ...plan, exercises: [{ exerciseId: 'invented', sets: 1 }] },
          'owner',
        ),
      )
    ).status,
  ).toBe(400);
  expect(owned).toEqual([]);
});

test('CORS preflight succeeds without a response body', async () => {
  const { handler } = fixture();
  const res = await handler(req('OPTIONS'));
  expect(res.status).toBe(204);
  expect(await res.text()).toBe('');
});

test('author listing requires identity and never enumerates for unsigned callers', async () => {
  const { handler } = fixture();
  expect((await handler(req('POST', { action: 'list' }))).status).toBe(401);
  expect((await handler(req('POST', { action: 'list' }, 'owner'))).status).toBe(
    200,
  );
});
