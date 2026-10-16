import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseAuthRepository } from '../supabase-auth';
import { AccountDeletionRepository } from '../account-deletion';
jest.unmock('../supabase-auth');
jest.mock('@supabase/supabase-js', () => ({ createClient: jest.fn() }));
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock',
  ),
);
const A = '11111111-1111-4111-8111-111111111111',
  B = '22222222-2222-4222-8222-222222222222';
const originalFetch = globalThis.fetch;
const deferred = <T>() => {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};
async function setup(enabled = true) {
  const deletion = new AccountDeletionRepository(AsyncStorage);
  await deletion.load();
  const auth = {
    getSession: jest.fn(async () => ({
      data: { session: { user: { id: A }, access_token: 'captured-A' } },
      error: null,
    })),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe() {} } },
    })),
    initialize: async () => ({ error: null }),
    dispose: async () => {},
    startAutoRefresh() {},
    stopAutoRefresh() {},
  };
  jest
    .mocked(createClient)
    .mockReturnValue({ auth } as unknown as ReturnType<typeof createClient>);
  const request = jest.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ deletedUserId: A }),
  }));
  globalThis.fetch = request as unknown as typeof fetch;
  const repository = createSupabaseAuthRepository({
    url: 'https://example.supabase.co',
    publishableKey: 'public-key',
    accountDeletionEnabled: enabled,
    deletionState: deletion,
  })!;
  return { repository, request, auth };
}
beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  jest.useRealTimers();
});
it('keeps deletion unavailable until the reviewed endpoint is explicitly enabled', async () => {
  const f = await setup(false);
  expect(f.repository.deleteAccount).toBeUndefined();
  expect(f.request).not.toHaveBeenCalled();
  f.repository.dispose();
});
it('sends only confirmation and expected owner with the captured matching token', async () => {
  const f = await setup();
  await f.repository.deleteAccount!(A);
  expect(f.request).toHaveBeenCalledWith(
    'https://example.supabase.co/functions/v1/delete-account',
    expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        Authorization: 'Bearer captured-A',
        apikey: 'public-key',
      }),
      body: JSON.stringify({ confirmation: 'DELETE', expectedUserId: A }),
    }),
  );
  f.repository.dispose();
});
it('rejects a changed account before sending any request', async () => {
  const f = await setup();
  f.auth.getSession.mockResolvedValue({
    data: { session: { user: { id: B }, access_token: 'B-token' } },
    error: null,
  });
  await expect(f.repository.deleteAccount!(A)).rejects.toThrow();
  expect(f.request).not.toHaveBeenCalled();
  f.repository.dispose();
});
it('does not treat a mismatched success body or non-success response as deletion', async () => {
  const f = await setup();
  f.request.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ deletedUserId: B }),
  });
  await expect(f.repository.deleteAccount!(A)).rejects.toThrow();
  f.request.mockResolvedValue({
    ok: false,
    status: 503,
    json: async () => ({ deletedUserId: A }),
  });
  await expect(f.repository.deleteAccount!(A)).rejects.toThrow();
  f.repository.dispose();
});
it('bounds an unanswered deletion and aborts the captured request', async () => {
  const f = await setup();
  jest.useFakeTimers();
  const waiting = deferred<never>();
  f.request.mockImplementation(() => waiting.promise);
  const pending = f.repository.deleteAccount!(A);
  const rejected = expect(pending).rejects.toThrow();
  await Promise.resolve();
  await jest.advanceTimersByTimeAsync(15000);
  await rejected;
  expect(
    (f.request.mock.calls[0] as unknown as [string, RequestInit])[1].signal
      ?.aborted,
  ).toBe(true);
  f.repository.dispose();
});
