import { LocaleStore, LANGUAGE_PREFERENCE_KEY } from '../i18n/preference-store';
it('a read begun during a pending write cannot undo its acknowledged choice', async () => {
  let finishWrite!: () => void;
  let finishRead!: (value: string | null) => void;
  const store = new LocaleStore(
    {
      getItem: () =>
        new Promise((resolve) => {
          finishRead = resolve;
        }),
      setItem: () =>
        new Promise<void>((resolve) => {
          finishWrite = resolve;
        }),
    },
    () => ['ru-RU'],
  );
  const selection = store.select('de');
  await Promise.resolve();
  const reading = store.load();
  finishWrite();
  await selection;
  finishRead(null);
  await reading;
  expect(store.getSnapshot()).toMatchObject({
    preference: 'de',
    locale: 'de',
    error: null,
    loading: false,
  });
});
it('does not expose disabled locales through a stored preference or direct selection', async () => {
  const store = new LocaleStore(
    {
      getItem: async () => JSON.stringify({ version: 1, preference: 'de' }),
      setItem: async () => {},
    },
    () => ['de-DE', 'en-US'],
    ['en'],
  );
  await store.load();
  expect(store.getSnapshot()).toMatchObject({
    preference: 'system',
    locale: 'en',
    error: 'read',
  });
  expect(await store.select('de')).toBe(false);
});

it('a stale read cannot replace the outcome of a newer retry/reset read', async () => {
  let release!: (value: string | null) => void;
  const storage = {
    getItem: jest
      .fn<Promise<string | null>, [string]>()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            release = resolve;
          }),
      )
      .mockResolvedValue(null),
    setItem: async () => {},
  };
  const store = new LocaleStore(storage, () => ['en-US']);
  const oldRead = store.load();
  await store.load();
  release(JSON.stringify({ version: 1, preference: 'de' }));
  await oldRead;
  expect(store.getSnapshot()).toMatchObject({
    preference: 'system',
    locale: 'en',
    error: null,
  });
});
function setup(initial: string | null = null) {
  let value = initial;
  const storage = {
    getItem: jest.fn(async () => value),
    setItem: jest.fn(async (_k: string, v: string) => {
      value = v;
    }),
  };
  let tags = ['ru-RU'];
  const store = new LocaleStore(storage, () => tags);
  return {
    store,
    storage,
    device: (next: string[]) => {
      tags = next;
      store.refreshDeviceLocales();
    },
  };
}
it('uses device order, persists explicit choices and re-resolves System only', async () => {
  const { store, storage, device } = setup();
  await store.load();
  expect(store.getSnapshot().locale).toBe('ru');
  await store.select('de');
  device(['fr-CH']);
  expect(store.getSnapshot().locale).toBe('de');
  expect(storage.setItem).toHaveBeenLastCalledWith(
    LANGUAGE_PREFERENCE_KEY,
    JSON.stringify({ version: 1, preference: 'de' }),
  );
  await store.select('system');
  expect(store.getSnapshot().locale).toBe('fr');
});
it('does not acknowledge failed writes and serializes rapid choices', async () => {
  const { store, storage } = setup();
  await store.load();
  await Promise.all([store.select('de'), store.select('fr')]);
  expect(store.getSnapshot().preference).toBe('fr');
  storage.setItem.mockRejectedValueOnce(Error('disk'));
  expect(await store.select('ru')).toBe(false);
  expect(store.getSnapshot()).toMatchObject({
    preference: 'fr',
    locale: 'fr',
    error: 'save',
  });
});
it('late reads cannot overwrite explicit selection; invalid/read failures remain usable', async () => {
  const { store, storage } = setup();
  let release!: (value: string | null) => void;
  storage.getItem.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  const loading = store.load();
  await store.select('fr');
  release(JSON.stringify({ version: 1, preference: 'de' }));
  await loading;
  expect(store.getSnapshot().locale).toBe('fr');
  const invalid = setup('{bad');
  await invalid.store.load();
  expect(invalid.store.getSnapshot()).toMatchObject({
    loading: false,
    locale: 'ru',
    error: 'read',
  });
  storage.getItem.mockRejectedValueOnce(Error('disk'));
  await store.load();
  expect(store.getSnapshot().preference).toBe('fr');
});
