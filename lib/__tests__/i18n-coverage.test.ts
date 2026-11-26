const { validateCatalogs, validateNbSource, compareInventory } =
  jest.requireActual('../../scripts/check-localization.cjs');
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

const {
  validateLocalizedCopy,
  validateProgramLocalization,
  validateSearchAliases,
} = jest.requireActual('../../scripts/check-localization.cjs');

it('requires Dutch for newly introduced messages and rejects English copies', () => {
  const field = 'newScreen.deleteTitle';
  const en = { [field]: 'Delete this plan?' };
  expect(validateCatalogs({ en, nl: {} })).toContain('nl: missing ' + field);
  expect(validateCatalogs({ en, nl: { [field]: '  ' } })).toContain(
    'nl.' + field + ': empty text',
  );
  expect(validateLocalizedCopy({ en, nl: en }, 'nl', {})).toContain(
    'nl: unchanged English copy ' + field,
  );
  const catalogs = { en, nl: { [field]: 'Dit plan verwijderen?' } };
  expect(validateCatalogs(catalogs)).toEqual([]);
  expect(validateLocalizedCopy(catalogs, 'nl', {})).toEqual([]);
});

it('requires separate Dutch names and aliases for new searchable records', () => {
  const id = 'new-attachment';
  const key = 'equipment.newAttachment';
  const records = { equipment: [{ id, messageKey: key }] };
  const registry = { nl: {} };
  const catalogs = { nl: { [key]: 'Dubbele handgreep' } };
  const aliases = { nl: { equipment: { [id]: ['dubbel handvat'] } } };
  expect(validateSearchAliases(aliases, registry, { nl: {} }, records)).toEqual(
    ['nl: missing catalog translation ' + key],
  );
  expect(
    validateSearchAliases(
      { nl: { equipment: {} } },
      registry,
      catalogs,
      records,
    ),
  ).toEqual(['nl: missing/empty search aliases equipment.' + id]);
  expect(validateSearchAliases(aliases, registry, catalogs, records)).toEqual(
    [],
  );
});

it('requires built-in program titles, days and resolvable exercise labels', () => {
  const programs = [
    {
      id: 'new-plan',
      days: [{ key: 'A', movements: [{ exerciseId: 'new-exercise' }] }],
      cardio: [],
    },
  ];
  const keys = {
    programTitleKey: () => 'catalog.program.new-plan',
    programDayKey: () => 'program.day.A',
  };
  const resolve = (id: string) => id;
  expect(
    validateProgramLocalization({ nl: {} }, programs, keys, resolve),
  ).toEqual([
    'nl: missing program title new-plan (catalog.program.new-plan)',
    'nl: missing program day new-plan/A (program.day.A)',
    'nl: missing program exercise new-exercise in new-plan/A',
  ]);
  const catalogs = {
    nl: {
      'catalog.program.new-plan': 'Volledig lichaam',
      'program.day.A': 'Dag A',
      'catalog.exercise.new-exercise': 'Knielen en draaien',
    },
  };
  expect(
    validateProgramLocalization(catalogs, programs, keys, resolve),
  ).toEqual([]);
});

it('requires a technique guide and the Dutch instructions for a new exercise ID', () => {
  const { validateTechniqueLinks } = jest.requireActual(
    '../../scripts/check-localization.cjs',
  );
  const id = 'new-exercise';
  const exercises = [{ id }];
  expect(validateTechniqueLinks({ nl: {} }, 'nl', exercises, {})).toEqual([
    'nl: missing linked technique guide ' + id,
  ]);
  const guides = {
    [id]: {
      scope: 'Scope',
      setup: ['Setup'],
      movement: ['Movement'],
      checks: ['Checks'],
      mistakes: ['Mistake'],
    },
  };
  const nl = {
    'guide.new-exercise.scope': 'Beschrijving',
    'guide.new-exercise.setup.0': 'Startpositie',
    'guide.new-exercise.movement.0': 'Beweging',
    'guide.new-exercise.checks.0': 'Aandachtspunt',
  };
  expect(validateTechniqueLinks({ nl }, 'nl', exercises, guides)).toEqual([
    'nl: missing technique translation guide.new-exercise.mistakes.0',
  ]);
  expect(
    validateTechniqueLinks(
      {
        nl: { ...nl, 'guide.new-exercise.mistakes.0': 'Veelgemaakte fout' },
      },
      'nl',
      exercises,
      guides,
    ),
  ).toEqual([]);
});

it.each([
  [
    'sv',
    'Om övningen',
    'Utgångsläge',
    'Rörelse',
    'Att tänka på',
    'Ny övning',
    'Vanligt fel',
    'övningsnamn',
  ],
  [
    'ta',
    'பயிற்சியின் விளக்கம்',
    'தொடக்க நிலை',
    'இயக்கம்',
    'கவனிக்க வேண்டியவை',
    'புதிய பயிற்சி',
    'பொதுவான தவறு',
    'பயிற்சியின் பெயர்',
  ],
  [
    'th',
    'เกี่ยวกับท่านี้',
    'ท่าเตรียม',
    'การเคลื่อนไหว',
    'จุดสำคัญ',
    'ท่าออกกำลังกายใหม่',
    'ข้อผิดพลาดที่พบบ่อย',
    'ชื่อท่าฝึก',
  ],
])(
  'blocks %s omissions in copy, guide instructions and search aliases',
  (locale, scope, setup, move, checks, label, mistake, alias) => {
    const { validateTechniqueLinks } = jest.requireActual(
      '../../scripts/check-localization.cjs',
    );
    const field = 'new.title';
    const en = { [field]: 'New title' };
    expect(validateCatalogs({ en, [locale]: {} })).toContain(
      locale + ': missing ' + field,
    );
    expect(validateLocalizedCopy({ en, [locale]: en }, locale, {})).toContain(
      locale + ': unchanged English copy ' + field,
    );
    expect(validateCatalogs({ en, [locale]: { [field]: label } })).toEqual([]);

    const id = 'new-exercise';
    const exercises = [{ id, messageKey: 'catalog.exercise.' + id }];
    const guides = {
      [id]: {
        scope: 'Scope',
        setup: ['Setup'],
        movement: ['Movement'],
        checks: ['Checks'],
        mistakes: ['Mistake'],
      },
    };
    const messages = {
      'guide.new-exercise.scope': scope,
      'guide.new-exercise.setup.0': setup,
      'guide.new-exercise.movement.0': move,
      'guide.new-exercise.checks.0': checks,
      'catalog.exercise.new-exercise': label,
    };
    const mistakeKey = 'guide.new-exercise.mistakes.0';
    expect(
      validateTechniqueLinks({ [locale]: messages }, locale, exercises, guides),
    ).toEqual([locale + ': missing technique translation ' + mistakeKey]);
    expect(
      validateTechniqueLinks(
        { [locale]: { ...messages, [mistakeKey]: mistake } },
        locale,
        exercises,
        guides,
      ),
    ).toEqual([]);
    const verifyAlias = (values: string[]) =>
      validateSearchAliases(
        { [locale]: { exercise: { [id]: values } } },
        { [locale]: {} },
        { [locale]: messages },
        { exercise: exercises },
      );
    for (const values of [[], [' ']])
      expect(verifyAlias(values)).toEqual([
        locale + ': missing/empty search aliases exercise.' + id,
      ]);
    if (locale === 'th')
      expect(verifyAlias(['new exercise'])).toEqual([
        'th: missing Thai search alias exercise.' + id,
      ]);
    if (locale === 'ta')
      expect(verifyAlias(['new exercise', '௧'])).toEqual([
        'ta: missing Tamil search alias exercise.' + id,
      ]);
    expect(verifyAlias([alias])).toEqual([]);
  },
);

it('rejects an omitted Urdu message, a copied fallback, broken placeholders and English-only aliases', () => {
  const en = { set: 'Set {{index}}', 'catalog.exercise.test': 'Test exercise' };
  const ur = { set: 'سیٹ {{index}}', 'catalog.exercise.test': 'آزمائشی ورزش' };
  expect(validateCatalogs({ en, ur: {} })).toContain('ur: missing set');
  expect(validateCatalogs({ en, ur: { ...ur, set: 'سیٹ' } })).toContain(
    'ur.set: parameters differ',
  );
  expect(validateCatalogs({ en, ur })).toEqual([]);
  expect(validateLocalizedCopy({ en, ur: en }, 'ur', {})).toContain(
    'ur: unchanged English copy set',
  );
  const errorsFor = (values: string[]) =>
    validateSearchAliases(
      { ur: { exercise: { test: values } } },
      { ur: {} },
      { ur },
      { exercise: [{ id: 'test' }] },
    );
  expect(errorsFor(['test exercise'])).toEqual([
    'ur: missing Urdu search alias exercise.test',
  ]);
  expect(errorsFor(['آزمائشی ورزش', 'azmaishi warzish'])).toEqual([]);
});

it('rejects non-Tamil fallback paraphrases and mismatched Tamil parameters', () => {
  const en = { label: 'Select {{name}}' };
  const ta = { label: 'Choose {{name}}' };
  expect(validateLocalizedCopy({ en, ta }, 'ta', {})).toEqual([
    'ta: missing Tamil copy label',
  ]);
  expect(validateCatalogs({ en, ta: { label: 'தேர்ந்தெடு {{id}}' } })).toEqual([
    'ta.label: parameters differ',
  ]);
});

it('rejects missing Traditional Chinese copy, Simplified fallback, placeholders and local aliases', () => {
  const en = { edit: 'Edit workout {{name}}' };
  const zhHant = { edit: '編輯訓練 {{name}}' };
  expect(validateCatalogs({ en, 'zh-Hant': {} })).toContain(
    'zh-Hant: missing edit',
  );
  expect(
    validateLocalizedCopy(
      { en, 'zh-Hant': { edit: '编辑训练 {{name}}' } },
      'zh-Hant',
      {},
    ),
  ).toContain('zh-Hant: missing Taiwan Traditional Chinese copy edit');
  expect(validateCatalogs({ en, 'zh-Hant': { edit: '編輯訓練' } })).toContain(
    'zh-Hant.edit: parameters differ',
  );
  expect(
    validateLocalizedCopy({ en, 'zh-Hant': zhHant }, 'zh-Hant', {}),
  ).toEqual([]);
  expect(
    validateSearchAliases(
      { 'zh-Hant': { exercise: { lift: ['杠铃卧推', 'bench press'] } } },
      { 'zh-Hant': {} },
      { 'zh-Hant': { 'catalog.exercise.lift': '槓鈴臥推' } },
      { exercise: [{ id: 'lift' }] },
    ),
  ).toEqual(['zh-Hant: missing Taiwan search alias exercise.lift']);
});

it('rejects missing Bokmål fields and translations reviewed against older English copy', () => {
  const en = { existing: 'Stored', required: 'New field {{name}}' };
  const nb = { existing: 'Lagret' };
  expect(validateCatalogs({ en, nb })).toContain('nb: missing required');
  expect(
    validateCatalogs({ en, nb: { ...nb, required: 'Nytt felt' } }),
  ).toContain('nb.required: parameters differ');
  const file = 'lib/i18n/locales/en/workout.ts';
  expect(
    validateNbSource({ [file]: 'changed' }, { [file]: 'reviewed' }),
  ).toEqual(['nb: review translation after English source change in ' + file]);
  expect(
    validateNbSource({ [file]: 'changed' }, { [file]: 'changed' }),
  ).toEqual([]);
});
