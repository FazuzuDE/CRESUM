import {
  AccountDeletionRepository,
  ACCOUNT_DELETION_KEY,
  AUTH_SESSION_KEY,
} from '../account-deletion';
import { AuthStore } from '../auth-store';
import type { AuthIdentity, AuthRepository } from '../auth-repository';
import { resetLocalData } from '../local-data-reset';

const A = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'a@example.com',
};
const B = {
  id: '22222222-2222-4222-8222-222222222222',
  email: 'b@example.com',
};
const session = (who = A) =>
  JSON.stringify({ user: who, access_token: 'local-test-token' });
function memory() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: async (k: string) => values.get(k) ?? null,
    setItem: async (k: string, v: string) => {
      values.set(k, v);
    },
    removeItem: async (k: string) => {
      values.delete(k);
    },
  };
}
function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}
function fixture() {
  const storage = memory(),
    deletion = new AccountDeletionRepository(storage);
  let listener: (i: AuthIdentity | null) => void = () => {};
  const deleted: string[] = [],
    cleared: string[] = [];
  const repository: AuthRepository = {
    getIdentity: async () => A,
    onAuthChange: (fn) => {
      listener = fn;
      return () => {};
    },
    sendEmailOtp: async () => {},
    verifyEmailOtp: async () => A,
    signOut: async () => {},
    dispose: () => {},
    deleteAccount: async (id) => {
      deleted.push(id);
    },
    clearDeletedSession: async (id) => {
      cleared.push(id);
    },
  };
  const store = new AuthStore(repository, deletion);
  return {
    storage,
    deletion,
    store,
    repository,
    deleted,
    cleared,
    emit: (i: AuthIdentity | null) => listener(i),
  };
}

it('persists pending deletion across restart without touching Core or session', async () => {
  const s = memory();
  s.values.set('workout-data', 'keep');
  s.values.set(AUTH_SESSION_KEY, session());
  const d = new AccountDeletionRepository(s);
  await d.load();
  await d.pending(A.id);
  const restarted = new AccountDeletionRepository(s);
  await restarted.load();
  expect(restarted.state(A.id)).toBe('pending');
  expect(s.values.get('workout-data')).toBe('keep');
  expect(s.values.get(AUTH_SESSION_KEY)).toBe(session());
  await resetLocalData(s, async () => {});
  expect(s.values.has(ACCOUNT_DELETION_KEY)).toBe(true);
});
it('clears only the confirmed owner session and filters late deleted-owner writes', async () => {
  const s = memory(),
    d = new AccountDeletionRepository(s);
  await d.load();
  await d.sessionStorage.setItem(AUTH_SESSION_KEY, session());
  await d.confirmed(A.id);
  await d.clearSession(A.id);
  expect(s.values.has(AUTH_SESSION_KEY)).toBe(false);
  await d.sessionStorage.setItem(AUTH_SESSION_KEY, session());
  expect(await d.sessionStorage.getItem(AUTH_SESSION_KEY)).toBeNull();
  expect(s.values.has(AUTH_SESSION_KEY)).toBe(false);
  await d.sessionStorage.setItem(AUTH_SESSION_KEY, session(B));
  await d.clearSession(A.id);
  expect(s.values.get(AUTH_SESSION_KEY)).toBe(session(B));
});
it('serializes matching cleanup against an account-B storage write', async () => {
  const s = memory(),
    d = new AccountDeletionRepository(s);
  await d.load();
  await d.confirmed(A.id);
  await Promise.all([
    d.clearSession(A.id),
    d.sessionStorage.setItem(AUTH_SESSION_KEY, session(B)),
  ]);
  expect(await d.sessionStorage.getItem(AUTH_SESSION_KEY)).toBe(session(B));
});
it('rejects corrupt recovery metadata instead of silently enabling account traffic', async () => {
  const s = memory();
  s.values.set(ACCOUNT_DELETION_KEY, '{bad');
  const d = new AccountDeletionRepository(s);
  await expect(d.load()).rejects.toThrow();
  expect(d.blocked(A.id)).toBe(true);
});
it('persists intent and drains cloud before sending the account-bound request', async () => {
  const f = fixture();
  await f.store.initialize();
  const gate = deferred<void>();
  let paused = false;
  const run = f.store.deleteAccount(A.id, async () => {
    expect(f.deletion.state(A.id)).toBe('pending');
    await gate.promise;
    paused = true;
    return () => {};
  });
  await Promise.resolve();
  expect(f.store.isCurrentAccount(A.id)).toBe(false);
  expect(f.deleted).toEqual([]);
  gate.resolve();
  await run;
  expect(paused).toBe(true);
  expect(f.deleted).toEqual([A.id]);
  expect(f.cleared).toEqual([A.id]);
  expect(f.store.getSnapshot()).toMatchObject({
    status: 'signed_out',
    identity: null,
  });
  expect(f.store.getSnapshot().notice).toContain('Account deleted');
  expect(f.deletion.state(A.id)).toBe('confirmed');
});
it('keeps an ambiguous failure pending across restart and prevents sync', async () => {
  const f = fixture();
  f.repository.deleteAccount = async () => {
    throw new Error('lost reply');
  };
  await f.store.initialize();
  await expect(
    f.store.deleteAccount(A.id, async () => () => {}),
  ).rejects.toThrow('not confirmed');
  expect(f.store.isCurrentAccount(A.id)).toBe(false);
  expect(f.cleared).toEqual([]);
  const next = new AuthStore(
    f.repository,
    new AccountDeletionRepository(f.storage),
  );
  await next.initialize();
  expect(next.isCurrentAccount(A.id)).toBe(false);
  expect(next.getSnapshot().deletion).toMatchObject({
    userId: A.id,
    status: 'pending',
  });
  expect(f.deleted).toEqual([]);
});
it('never sends deletion after the account changes during preflight', async () => {
  const f = fixture();
  await f.store.initialize();
  await expect(
    f.store.deleteAccount(A.id, async () => {
      f.emit(B);
      return () => {};
    }),
  ).rejects.toThrow();
  expect(f.deleted).toEqual([]);
  expect(f.store.getSnapshot().identity).toEqual(B);
});
it('records a late successful A deletion without signing out or reporting deletion of B', async () => {
  const f = fixture(),
    reply = deferred<void>();
  f.repository.deleteAccount = () => reply.promise;
  await f.store.initialize();
  const run = f.store.deleteAccount(A.id, async () => () => {});
  for (let i = 0; i < 20 && f.deletion.state(A.id) !== 'pending'; i++)
    await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
  f.emit(B);
  reply.resolve();
  await run;
  expect(f.deletion.state(A.id)).toBe('confirmed');
  expect(f.store.getSnapshot()).toMatchObject({
    status: 'signed_in',
    identity: B,
    busy: null,
  });
  expect(f.store.getSnapshot().notice).toBeFalsy();
  expect(f.cleared).toEqual([A.id]);
});
it('retries confirmed local cleanup without repeating cloud deletion', async () => {
  const f = fixture();
  let fail = true;
  f.repository.clearDeletedSession = async () => {
    if (fail) throw new Error('storage');
  };
  await f.store.initialize();
  await expect(
    f.store.deleteAccount(A.id, async () => () => {}),
  ).rejects.toThrow('cleanup');
  expect(f.deleted).toEqual([A.id]);
  fail = false;
  await f.store.deleteAccount(A.id, async () => () => {});
  expect(f.deleted).toEqual([A.id]);
  expect(f.store.getSnapshot().notice).toContain('Account deleted');
});
it('does not call the server if durable intent or cloud pause fails', async () => {
  const f = fixture();
  await f.store.initialize();
  await expect(
    f.store.deleteAccount(A.id, async () => {
      throw new Error('pause failed');
    }),
  ).rejects.toThrow();
  expect(f.deleted).toEqual([]);
  const g = fixture();
  await g.store.initialize();
  g.storage.setItem = async () => {
    throw new Error('disk full');
  };
  await expect(
    g.store.deleteAccount(A.id, async () => () => {}),
  ).rejects.toThrow();
  expect(g.deleted).toEqual([]);
});
it.each(['read', 'write'])(
  'keeps failed intent fenced after a journal %s failure',
  async (failure) => {
    const f = fixture();
    const rpc = jest.fn(async () => ({ data: null, error: null }));
    f.repository.historyRpc = rpc;
    await f.store.initialize();
    const write = f.storage.setItem;
    const read = f.storage.getItem;
    if (failure === 'write')
      f.storage.setItem = async () => {
        throw new Error('disk full');
      };
    else
      f.storage.getItem = async () => {
        throw new Error('read failed');
      };
    await expect(
      f.store.deleteAccount(A.id, async () => () => {}),
    ).rejects.toThrow();
    expect(f.storage.values.has(ACCOUNT_DELETION_KEY)).toBe(false);
    f.storage.getItem = read;
    await f.deletion.sessionStorage.getItem(AUTH_SESSION_KEY);
    f.emit(A);
    expect(f.store.getSnapshot().deletion).toEqual({
      userId: A.id,
      status: 'pending',
    });
    await expect(f.store.historyRpc(A.id, 'test', {})).rejects.toThrow();
    expect(rpc).not.toHaveBeenCalled();
    expect(f.deleted).toEqual([]);
    f.emit(B);
    expect(f.store.isCurrentAccount(B.id)).toBe(true);
    f.emit(A);
    f.storage.setItem = write;
    await f.store.deleteAccount(A.id, async () => () => {});
    expect(f.deleted).toEqual([A.id]);
    expect(f.store.getSnapshot().status).toBe('signed_out');
  },
);
it('does not create an SDK owner after disposal during recovery loading', async () => {
  const s = memory(),
    gate = deferred<void>();
  const read = s.getItem;
  s.getItem = async (key) => {
    await gate.promise;
    return read(key);
  };
  const factory = jest.fn(() => null);
  const store = new AuthStore(factory, new AccountDeletionRepository(s));
  const loading = store.initialize();
  store.dispose();
  gate.resolve();
  await loading;
  expect(factory).not.toHaveBeenCalled();
});
it('ignores a stale deleted-A event while B is signed in', async () => {
  const f = fixture();
  await f.store.initialize();
  await f.store.deleteAccount(A.id, async () => () => {});
  f.emit(B);
  f.emit(A);
  expect(f.store.getSnapshot().identity).toEqual(B);
  expect(f.store.isCurrentAccount(B.id)).toBe(true);
});
it('preserves unknown stored session content but lets the SDK handle malformed JSON normally', async () => {
  const s = memory(),
    d = new AccountDeletionRepository(s);
  await d.load();
  await d.confirmed(A.id);
  s.values.set(AUTH_SESSION_KEY, '{bad-session');
  expect(await d.sessionStorage.getItem(AUTH_SESSION_KEY)).toBe('{bad-session');
  await expect(d.clearSession(A.id)).rejects.toThrow();
  expect(s.values.get(AUTH_SESSION_KEY)).toBe('{bad-session');
});
it('rejects unexpected journal fields rather than retaining payloads or tokens', async () => {
  const s = memory();
  s.values.set(
    ACCOUNT_DELETION_KEY,
    JSON.stringify({
      version: 1,
      records: [{ userId: A.id, status: 'pending', token: 'not-journal-data' }],
    }),
  );
  await expect(new AccountDeletionRepository(s).load()).rejects.toThrow();
});
it('recovers confirmed matching session cleanup on startup without another server deletion', async () => {
  const f = fixture();
  await f.deletion.load();
  await f.deletion.confirmed(A.id);
  f.storage.values.set(AUTH_SESSION_KEY, session());
  const restarted = new AuthStore(
    f.repository,
    new AccountDeletionRepository(f.storage),
  );
  await restarted.initialize();
  expect(restarted.getSnapshot().status).toBe('signed_out');
  expect(f.storage.values.has(AUTH_SESSION_KEY)).toBe(false);
  expect(f.deleted).toEqual([]);
});
