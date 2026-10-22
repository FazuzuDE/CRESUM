const { validateCatalogs, compareInventory } = jest.requireActual(
  '../../scripts/check-localization.cjs',
);
const { sourceCandidates } = jest.requireActual(
  '../../scripts/inventory-localization.cjs',
);
it('inventories one-word labels and dynamic message templates, not only JSX text', () => {
  const rows = sourceCandidates(
    'components/New.tsx',
    "const label = 'Save'; const hint = `Hello ${name}`; const view = <Text>Ready</Text>;",
  );
  expect(rows.some((row: { text: string }) => row.text === 'Save')).toBe(true);
  expect(rows.some((row: { text: string }) => row.text.includes('Hello'))).toBe(
    true,
  );
  expect(rows.some((row: { text: string }) => row.text === 'Ready')).toBe(true);
});
it('tracks lowercase JSX expression labels and non-Latin visible copy', () => {
  for (const code of [
    "<Text>{'ready'}</Text>",
    "<Button title={'cancel'} />",
    '<Text>Да</Text>',
    "const label = 'ready'; <Text>{label}</Text>",
  ]) {
    expect(sourceCandidates('components/New.tsx', code).length).toBeGreaterThan(
      0,
    );
  }
});

it('requires locale-specific plural branches and matching named parameters', () => {
  const en = {
    sets: { one: '{{count}} set', other: '{{count}} sets' },
    name: '{{name}}',
  };
  const ru = {
    sets: {
      one: '{{count}} подход',
      few: '{{count}} подхода',
      many: '{{count}} подходов',
      other: '{{count}} подхода',
    },
    name: '{{name}}',
  };
  expect(validateCatalogs({ en, ru })).toEqual([]);
  expect(
    validateCatalogs({
      en,
      ru: { ...ru, sets: { one: '{{count}} подход' } },
    }).join(' '),
  ).toContain('few');
  expect(
    validateCatalogs({ en, ru: { ...ru, name: '{{wrong}}' } }).join(' '),
  ).toContain('parameters');
  expect(validateCatalogs({ en, ru: { ...ru, name: '' } }).join(' ')).toContain(
    'empty',
  );
});

it('rejects new untracked copy and reports remaining source candidates explicitly', () => {
  const old = [
    { file: 'components/Test.tsx', text: 'Existing English', line: 3 },
  ];
  expect(compareInventory(old, old)).toEqual([]);
  expect(
    compareInventory(
      [
        ...old,
        { file: 'components/Test.tsx', text: 'New untranslated copy', line: 9 },
      ],
      old,
    ),
  ).toHaveLength(1);
});
