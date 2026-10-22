import { Text, View } from 'react-native';
import { BrandHeader } from '../../components/BrandHeader';
import { ExerciseArtwork } from '../../components/ExerciseArtwork';
import { LocalizationProvider } from '../../components/LocalizationProvider';
import { LocaleStore } from '../i18n/preference-store';
import { catalogs } from '../i18n/messages';
import { localeRegistry } from '../i18n/registry';
import { conflictFixture } from './helpers/history-resolution-fixture';
import { HistoryConflictReview } from '../../components/HistoryConflictReview';
import { createTranslator } from '../i18n/engine';
import { AppButton } from '../../components/AppButton';
const { act, create } = jest.requireActual('react-test-renderer');
const { releaseEligibility, classifyInventory } = jest.requireActual(
  '../../scripts/check-localization.cjs',
);
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));
it('blocks release for missing messages, parameters, plural forms and catalog labels', () => {
  const approved = {
    sourceCandidates: [],
    classifications: [],
    acceptance: {
      ru: { web: true, native: true },
      de: { web: true, native: true },
      fr: { web: true, native: true },
    },
  };
  expect(
    releaseEligibility(catalogs, localeRegistry, approved).ru.eligible,
  ).toBe(true);
  for (const remove of [
    (copy: any) => delete copy['profile.title'],
    (copy: any) => (copy['profile.version'] = 'Version'),
    (copy: any) => delete copy['common.setCount'].few,
    (copy: any) =>
      delete copy[Object.keys(copy).find((key) => key.startsWith('catalog.'))!],
  ]) {
    const changed = JSON.parse(JSON.stringify(catalogs));
    remove(changed.ru);
    expect(
      releaseEligibility(changed, localeRegistry, approved).ru.eligible,
    ).toBe(false);
  }
});
it('keeps incomplete device acceptance and unclassified source copy out of release', () => {
  const acceptance = { ru: { web: true, native: false } };
  expect(
    releaseEligibility(catalogs, localeRegistry, {
      sourceCandidates: [],
      classifications: [],
      acceptance,
    }).ru.eligible,
  ).toBe(false);
  expect(
    releaseEligibility(catalogs, localeRegistry, {
      sourceCandidates: [
        { file: 'components/New.tsx', text: 'Untranslated', line: 1 },
      ],
      classifications: [],
      acceptance: { ru: { web: true, native: true } },
    }).ru.eligible,
  ).toBe(false);
});
it('does not reuse an internal classification when the same word moves into visible JSX', () => {
  const old = {
    file: 'components/Sample.tsx',
    text: 'profile',
    context: 'StringLiteral:VariableDeclaration',
    kind: 'internal',
    reason: 'Navigation state',
  };
  const visible = { ...old, context: 'JsxText:JsxElement' };
  expect(classifyInventory([visible], [old])).toHaveLength(1);
});
it('rejects unregistered and pseudo languages without persisting them', async () => {
  const storage = {
    getItem: async () => null,
    setItem: jest.fn(async () => {}),
  };
  const store = new LocaleStore(storage, () => ['en']);
  await store.load();
  for (const unknown of ['xx', 'en-XA', 'qps-ploc'])
    expect(await store.select(unknown as never)).toBe(false);
  expect(storage.setItem).not.toHaveBeenCalled();
  expect(Object.keys(catalogs)).toEqual(['en', 'ru', 'de', 'fr']);
});
it('marks only a missing conflict name for translation, preserving a saved English title', async () => {
  const x = await conflictFixture();
  const before = x.store.getSnapshot().data.history;
  const named = before.map((workout) => ({
    ...workout,
    name: 'Saved workout',
  }));
  expect(await x.store.applyCloudHistory(before, named, () => true)).toBe(true);
  expect((await x.engine.conflicts())[0].fallbackName).toBeUndefined();
  expect(await x.store.applyCloudHistory(named, [], () => true)).toBe(true);
  const conflicts = await x.engine.conflicts();
  expect(conflicts[0]).toMatchObject({
    name: 'Saved workout',
    fallbackName: true,
  });
  const store = new LocaleStore(
    {
      getItem: async () => JSON.stringify({ version: 1, preference: 'ru' }),
      setItem: async () => {},
    },
    () => ['en'],
  );
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(
      <LocalizationProvider store={store}>
        <HistoryConflictReview
          actions={{
            conflicts: async () => conflicts,
            compare: jest.fn(),
            resolve: jest.fn(),
            sync: jest.fn(),
          }}
          onClose={() => {}}
          onSignOut={async () => {}}
        />
      </LocalizationProvider>,
    );
  });
  try {
    expect(
      view!.root
        .findAllByType(AppButton)
        .some(
          (n: any) =>
            n.props.title === createTranslator('ru')('conflict.untitled'),
        ),
    ).toBe(true);
  } finally {
    await act(async () => {
      view!.unmount();
    });
  }
});
it('expands test-only pseudo copy while preserving interpolation tokens and plural structure', () => {
  const { pseudoCatalog } = jest.requireActual('./helpers/pseudo-localization');
  const pseudo = pseudoCatalog(catalogs.en);
  expect(pseudo['profile.version']).toContain('{{version}}');
  expect(pseudo['profile.title'].length).toBeGreaterThan(
    catalogs.en['profile.title'].length,
  );
  expect(Object.keys(pseudo['common.setCount'])).toEqual(['one', 'other']);
  expect(localeRegistry).not.toHaveProperty('en-XA');
});
it('does not allow pseudo-localization imports in application source', () => {
  const fs = jest.requireActual('node:fs'),
    path = jest.requireActual('node:path');
  const files = (directory: string): string[] =>
    fs
      .readdirSync(directory, { withFileTypes: true })
      .flatMap((entry: any) =>
        entry.name === '__tests__'
          ? []
          : entry.isDirectory()
            ? files(path.join(directory, entry.name))
            : /\.tsx?$/.test(entry.name)
              ? [path.join(directory, entry.name)]
              : [],
      );
  for (const file of ['app', 'components', 'lib'].flatMap(files))
    expect(fs.readFileSync(file, 'utf8')).not.toContain('pseudo-localization');
});
it('checks the installed plural polyfill with native Intl.PluralRules absent', () => {
  const descriptor = Object.getOwnPropertyDescriptor(Intl, 'PluralRules')!;
  try {
    Object.defineProperty(Intl, 'PluralRules', {
      configurable: true,
      writable: true,
      value: undefined,
    });
    jest.isolateModules(() => {
      jest.requireActual('../i18n/engine');
      const matrix = [0, 1, 2, 5, 11, 21, 22, 25, 1.5];
      expect(
        matrix.map((count) => new Intl.PluralRules('ru').select(count)),
      ).toEqual([
        'many',
        'one',
        'few',
        'many',
        'many',
        'one',
        'few',
        'many',
        'other',
      ]);
      expect(
        matrix.map((count) => new Intl.PluralRules('de').select(count)),
      ).toEqual([
        'other',
        'one',
        'other',
        'other',
        'other',
        'other',
        'other',
        'other',
        'other',
      ]);
      expect(
        matrix.map((count) => new Intl.PluralRules('en').select(count)),
      ).toEqual([
        'other',
        'one',
        'other',
        'other',
        'other',
        'other',
        'other',
        'other',
        'other',
      ]);
      expect(
        [0, 1, 2, 1.5].map((count) => new Intl.PluralRules('fr').select(count)),
      ).toEqual(['one', 'one', 'other', 'one']);
    });
  } finally {
    Object.defineProperty(Intl, 'PluralRules', descriptor);
  }
});
it.each(['ru', 'de', 'fr'] as const)(
  'translates shared tagline and illustration accessibility in %s',
  async (locale) => {
    const store = new LocaleStore(
      {
        getItem: async () => JSON.stringify({ version: 1, preference: locale }),
        setItem: async () => {},
      },
      () => ['en'],
    );
    let view: ReturnType<typeof create>;
    await act(async () => {
      view = create(
        <LocalizationProvider store={store}>
          <BrandHeader />
          <ExerciseArtwork imageKey="barbell-bench-press" />
        </LocalizationProvider>,
      );
    });
    try {
      const text = view!.root
        .findAllByType(Text)
        .map((n: any) => n.props.children)
        .join(' ');
      expect(text).not.toContain('TRAIN. TRACK. GROW.');
      const labels = view!.root
        .findAllByType(View)
        .map((n: any) => n.props.accessibilityLabel || '')
        .join(' ');
      expect(labels).not.toContain('Artwork placeholder');
    } finally {
      await act(async () => {
        view!.unmount();
      });
    }
  },
);
