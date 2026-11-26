import { localeRegistry } from '../i18n/registry';
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
it.each([
  ['nl', 'nl'],
  ['sv', 'sv'],
  ['sv-SE', 'sv'],
  ['th', 'th'],
  ['th-TH', 'th'],
  ['nl-NL', 'nl'],
  ['nl-BE', 'nl'],
  ['uk-UA', 'uk'],
  ['es-MX', 'es'],
  ['es-ES', 'es'],
  ['pt-BR', 'pt-BR'],
  ['pt-PT', 'pt-BR'],
  ['it-IT', 'it'],
  ['it-CH', 'it'],
  ['pl-PL', 'pl'],
  ['tr-TR', 'tr'],
  ['hi', 'hi'],
  ['hi-IN', 'hi'],
  ['bn', 'bn'],
  ['bn-BD', 'bn'],
  ['bn-IN', 'bn'],
  ['ko', 'ko'],
  ['ko-KR', 'ko'],
  ['ko-Hang-KR', 'ko'],
  ['id', 'id'],
  ['id-ID', 'id'],
  ['id-Latn-ID', 'id'],
  ['mr', 'mr'],
  ['mr-IN', 'mr'],
  ['mr-Deva-IN', 'mr'],
  ['vi', 'vi'],
  ['vi-VN', 'vi'],
  ['vi-Latn-VN', 'vi'],
  ['ja', 'ja'],
  ['ja-JP', 'ja'],
  ['ja-Jpan-JP', 'ja'],
  ['ar', 'ar'],
  ['ur', 'ur'],
  ['te', 'te'],
  ['te-IN', 'te'],
  ['ta', 'ta'],
  ['ta-IN', 'ta'],
  ['ta-LK', 'ta'],
  ['ur-PK', 'ur'],
  ['ur-IN', 'ur'],
  ['ur-Arab-PK', 'ur'],
  ['ar-SA', 'ar'],
  ['ar-EG', 'ar'],
  ['ar-Arab-AE', 'ar'],
  ['bn-Beng-IN', 'bn'],
  ['hi-Deva-IN', 'hi'],
  ['fi', 'fi'],
  ['fi-FI', 'fi'],
  ['sv-FI', 'sv'],
  ['nb', 'nb'],
  ['nb-NO', 'nb'],
  ['no', 'nb'],
  ['no-NO', 'nb'],
  ['nn', 'en'],
  ['nn-NO', 'en'],
  ['zh', 'zh-Hans'],
  ['zh-CN', 'zh-Hans'],
  ['zh-SG', 'zh-Hans'],
  ['zh-Hans', 'zh-Hans'],
  ['zh-Hans-HK', 'zh-Hans'],
  ['zh-Hans-TW', 'zh-Hans'],
  ['zh-Hant', 'zh-Hant'],
  ['zh-Hant-CN', 'zh-Hant'],
  ['zh-Hant-SG', 'zh-Hant'],
  ['zh-TW', 'zh-Hant'],
  ['zh-HK', 'zh-Hant'],
  ['zh-MO', 'zh-Hant'],
])('selects the system language for %s', async (tag, locale) => {
  const store = new LocaleStore(
    { getItem: async () => null, setItem: async () => {} },
    () => [tag, 'en-US'],
  );
  await store.load();
  expect(store.getSnapshot()).toMatchObject({
    preference: 'system',
    locale,
  });
});
it('uses device order, persists explicit choices and re-resolves System only', async () => {
  const { store, storage, device } = setup();
  await store.load();
  expect(store.getSnapshot().locale).toBe('ru');
  await store.select('de');
  device(['uk-UA']);
  expect(store.getSnapshot().locale).toBe('de');
  expect(storage.setItem).toHaveBeenLastCalledWith(
    LANGUAGE_PREFERENCE_KEY,
    JSON.stringify({ version: 1, preference: 'de' }),
  );
  await store.select('system');
  expect(store.getSnapshot().locale).toBe('uk');
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

it('persists Japanese separately from the device language and restores it on reload', async () => {
  let saved: string | null = null;
  const storage = {
    getItem: async () => saved,
    setItem: async (_key: string, value: string) => {
      saved = value;
    },
  };
  const first = new LocaleStore(storage, () => ['ar-SA']);
  await first.load();
  expect(await first.select('ja')).toBe(true);
  const restored = new LocaleStore(storage, () => ['de-DE']);
  await restored.load();
  expect(restored.getSnapshot()).toMatchObject({
    preference: 'ja',
    locale: 'ja',
  });
});

it('persists Vietnamese independently of device locale and restores it on reload', async () => {
  let saved: string | null = null;
  const storage = {
    getItem: async () => saved,
    setItem: async (_key: string, value: string) => {
      saved = value;
    },
  };
  const first = new LocaleStore(storage, () => ['ar-SA']);
  await first.load();
  expect(await first.select('vi')).toBe(true);
  const restored = new LocaleStore(storage, () => ['de-DE']);
  await restored.load();
  expect(restored.getSnapshot()).toMatchObject({
    preference: 'vi',
    locale: 'vi',
  });
});

it.each(['mr', 'id', 'ko', 'nl', 'sv', 'th', 'ur', 'te'] as const)(
  'persists %s independently of device language and restores it after reload',
  async (locale) => {
    let saved: string | null = null;
    const storage = {
      getItem: async () => saved,
      setItem: async (_key: string, value: string) => {
        saved = value;
      },
    };
    const first = new LocaleStore(storage, () => ['ar-SA']);
    await first.load();
    expect(await first.select(locale)).toBe(true);
    const restored = new LocaleStore(storage, () => ['de-DE']);
    await restored.load();
    expect(restored.getSnapshot()).toMatchObject({
      preference: locale,
      locale,
    });
  },
);

it('exposes every bundled locale regardless of release acceptance', async () => {
  const storage = { getItem: async () => null, setItem: async () => {} };
  const store = new LocaleStore(storage, () => ['nl-BE', 'fr-BE']);

  await store.load();
  expect(store.enabledLocales).toEqual(Object.keys(localeRegistry));
  expect(store.getSnapshot()).toMatchObject({
    preference: 'system',
    locale: 'nl',
  });

  for (const locale of store.enabledLocales) {
    expect(await store.select(locale)).toBe(true);
    expect(store.getSnapshot()).toMatchObject({ preference: locale, locale });
  }
});

it.each([
  ['th-TH', 'th'],
  ['ur-PK', 'ur'],
  ['ur-IN', 'ur'],
  ['te-IN', 'te'],
  ['ta', 'ta'],
  ['ta-IN', 'ta'],
  ['ta-LK', 'ta'],
] as const)(
  'restores system language for %s after manual selection',
  async (device, expected) => {
    const storage = { getItem: async () => null, setItem: async () => {} };
    const store = new LocaleStore(storage, () => [device, 'de-AT']);
    await store.load();
    expect(store.getSnapshot().locale).toBe(expected);
    expect(await store.select('en')).toBe(true);
    expect(store.getSnapshot().locale).toBe('en');
    expect(await store.select('system')).toBe(true);
    expect(store.getSnapshot().locale).toBe(expected);
  },
);

it('restores a manually selected Tamil locale after restart and returns to the device language', async () => {
  const { store, storage } = setup();
  expect(await store.select('ta')).toBe(true);
  const restarted = new LocaleStore(storage, () => ['ur-PK']);
  await restarted.load();
  expect(restarted.getSnapshot()).toMatchObject({
    preference: 'ta',
    locale: 'ta',
  });
  expect(await restarted.select('system')).toBe(true);
  expect(restarted.getSnapshot()).toMatchObject({
    preference: 'system',
    locale: 'ur',
  });
});

it('keeps a saved Simplified Chinese preference on a Traditional Chinese device', async () => {
  const { store, storage } = setup(
    JSON.stringify({ version: 1, preference: 'zh-Hans' }),
  );
  await store.load();
  expect(store.getSnapshot().locale).toBe('zh-Hans');
  const restarted = new LocaleStore(storage, () => ['zh-TW']);
  await restarted.load();
  expect(restarted.getSnapshot()).toMatchObject({
    preference: 'zh-Hans',
    locale: 'zh-Hans',
  });
  expect(await restarted.select('zh-Hant')).toBe(true);
  const restartedAgain = new LocaleStore(storage, () => ['zh-CN']);
  await restartedAgain.load();
  expect(restartedAgain.getSnapshot()).toMatchObject({
    preference: 'zh-Hant',
    locale: 'zh-Hant',
  });
  expect(await restartedAgain.select('system')).toBe(true);
  expect(restartedAgain.getSnapshot()).toMatchObject({
    preference: 'system',
    locale: 'zh-Hans',
  });
});

it('keeps Bokmål as an explicit choice, then follows the supported device locale', async () => {
  const { store, storage } = setup(null);
  await store.load();
  expect(await store.select('nb')).toBe(true);
  const restarted = new LocaleStore(storage, () => ['nn-NO', 'sv-SE']);
  await restarted.load();
  expect(restarted.getSnapshot()).toMatchObject({
    preference: 'nb',
    locale: 'nb',
  });
  expect(await restarted.select('system')).toBe(true);
  expect(restarted.getSnapshot()).toMatchObject({
    preference: 'system',
    locale: 'sv',
  });
});

it('restores a saved Finnish choice and follows Swedish in Finland when asked', async () => {
  const { store, storage } = setup(null);
  await store.load();
  expect(await store.select('fi')).toBe(true);
  const restarted = new LocaleStore(storage, () => ['sv-FI', 'fi-FI']);
  await restarted.load();
  expect(restarted.getSnapshot()).toMatchObject({
    preference: 'fi',
    locale: 'fi',
  });
  expect(await restarted.select('system')).toBe(true);
  expect(restarted.getSnapshot()).toMatchObject({
    preference: 'system',
    locale: 'sv',
  });
});

it('restores Danish after restart and switches between Urdu and the Danish device locale', async () => {
  const { store, storage } = setup(null);
  await store.load();
  expect(await store.select('da')).toBe(true);
  const restarted = new LocaleStore(storage, () => ['ur-PK']);
  await restarted.load();
  expect(restarted.getSnapshot()).toMatchObject({
    preference: 'da',
    locale: 'da',
    direction: 'ltr',
  });
  expect(await restarted.select('system')).toBe(true);
  expect(restarted.getSnapshot()).toMatchObject({
    preference: 'system',
    locale: 'ur',
    direction: 'rtl',
  });
  const danishDevice = new LocaleStore(storage, () => ['da-DK']);
  await danishDevice.load();
  expect(danishDevice.getSnapshot()).toMatchObject({
    preference: 'system',
    locale: 'da',
    direction: 'ltr',
  });
});
