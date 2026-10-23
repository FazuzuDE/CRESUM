/** @jest-environment node */
import { SharingClient } from '../workout-sharing/client';
const token = 'a'.repeat(64);
const origin = {
  publicationId: '550e8400-e29b-41d4-a716-446655440000',
  version: 1,
};
const plan = {
  schemaVersion: 1 as const,
  title: 'Plan',
  exercises: [{ exerciseId: 'barbell-bench-press', sets: 3 }],
};
test('validates server payload and redacts upstream tokens/errors', async () => {
  const client = new SharingClient(
    'https://api.example.test/functions/v1/shared-plan',
    'key',
    'plans.example.test',
    async () => new Response(JSON.stringify({ origin, plan })),
    async () => ({ origin, token }),
  );
  expect((await client.resolve(token)).plan.title).toBe('Plan');
  expect((await client.publish(plan)).url).toBe(
    `https://plans.example.test/shared?token=${token}`,
  );
  const bad = new SharingClient(
    'https://api.example.test/functions/v1/shared-plan',
    'key',
    'plans.example.test',
    async () => {
      throw Error('private ' + token);
    },
  );
  await expect(bad.resolve(token)).rejects.toThrow('Sharing unavailable');
  try {
    await bad.resolve(token);
  } catch (e) {
    expect(String(e)).not.toContain(token);
  }
});
