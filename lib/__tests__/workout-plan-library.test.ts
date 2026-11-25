import {
  PlanLibraryCache,
  parseLibrary,
  filterPlans,
} from '../workout-sharing/library';
const origin = {
  publicationId: '550e8400-e29b-41d4-a716-446655440000',
  version: 1,
};
const entry = {
  origin,
  metadata: {
    title: { en: 'Upper', ru: 'Верх', de: 'Oberkörper', fr: 'Haut du corps' },
    description: { en: 'Gym', ru: 'Зал', de: 'Studio', fr: 'Salle' },
    goal: 'build_muscle',
    experience: 'beginner',
    equipment: ['dumbbell'],
  },
};
test('validates all locale metadata, filters and preserves last good offline cache', async () => {
  const data = new Map<string, string>();
  const cache = new PlanLibraryCache({
    getItem: async (k) => data.get(k) ?? null,
    setItem: async (k, v) => {
      data.set(k, v);
    },
  });
  const plans = parseLibrary([entry]);
  await cache.write(plans);
  expect(
    filterPlans(plans, 'верх', 'ru', {
      goal: 'build_muscle',
      equipment: 'dumbbell',
    }),
  ).toHaveLength(1);
  expect(
    filterPlans(plans, '', 'en', { experience: 'experienced' }),
  ).toHaveLength(0);
  await expect(
    cache.write([
      { ...entry, metadata: { ...entry.metadata, title: { en: 'Only' } } },
    ] as never),
  ).rejects.toThrow();
  expect((await cache.read())?.[0].metadata.title.ru).toBe('Верх');
});
test('does not accept incomplete, unknown filter or duplicate library entries', () => {
  expect(() =>
    parseLibrary([
      { ...entry, metadata: { ...entry.metadata, goal: 'invented' } },
    ]),
  ).toThrow();
  expect(() => parseLibrary([entry, entry])).toThrow();
});

test('searches translated Ukrainian publications and preserves legacy English metadata', () => {
  const [legacy] = parseLibrary([entry]);
  expect(filterPlans([legacy], 'upper', 'uk')).toEqual([legacy]);
  const [localized] = parseLibrary([
    {
      ...entry,
      metadata: {
        ...entry.metadata,
        title: { ...entry.metadata.title, uk: 'Верхня частина тіла' },
      },
    },
  ]);
  expect(filterPlans([localized], 'верхня', 'uk')).toEqual([localized]);
  expect(filterPlans([localized], 'gym', 'uk')).toEqual([localized]);
});

test('searches Chinese publication metadata and falls back for older plans', () => {
  const [legacy] = parseLibrary([entry]);
  expect(filterPlans([legacy], 'upper', 'zh-Hans')).toEqual([legacy]);
  const localized = {
    ...entry,
    metadata: {
      ...entry.metadata,
      title: { ...entry.metadata.title, 'zh-Hans': '上肢训练' },
      description: { ...entry.metadata.description, 'zh-Hans': '哑铃健身计划' },
    },
  };
  const [plan] = parseLibrary([localized]);
  expect(filterPlans([plan], '上肢', 'zh-Hans')).toEqual([plan]);
  expect(filterPlans([plan], '哑铃', 'zh-Hans')).toEqual([plan]);
  expect(() =>
    parseLibrary([
      {
        ...localized,
        metadata: {
          ...localized.metadata,
          title: { ...localized.metadata.title, 'zh-Hans': '' },
        },
      },
    ]),
  ).toThrow();
});

test('searches Hindi publication metadata and preserves older English publications', () => {
  const [legacy] = parseLibrary([entry]);
  expect(filterPlans([legacy], 'upper', 'hi')).toEqual([legacy]);
  const localized = {
    ...entry,
    metadata: {
      ...entry.metadata,
      title: { ...entry.metadata.title, hi: 'ऊपरी शरीर' },
      description: { ...entry.metadata.description, hi: 'डंबल का प्लान' },
    },
  };
  const [plan] = parseLibrary([localized]);
  expect(filterPlans([plan], 'ऊपरी', 'hi')).toEqual([plan]);
  expect(filterPlans([plan], 'डंबल', 'hi')).toEqual([plan]);
  expect(() =>
    parseLibrary([
      {
        ...localized,
        metadata: {
          ...localized.metadata,
          title: { ...localized.metadata.title, hi: '' },
        },
      },
    ]),
  ).toThrow();
});

test('accepts Bengali publication metadata with legacy English fallback', () => {
  const [legacy] = parseLibrary([entry]);
  expect(filterPlans([legacy], 'upper', 'bn')).toEqual([legacy]);
  const [localized] = parseLibrary([
    {
      ...entry,
      metadata: {
        ...entry.metadata,
        title: { ...entry.metadata.title, bn: 'শরীরের ওপরের অংশ' },
        description: {
          ...entry.metadata.description,
          bn: 'ডাম্বেল দিয়ে ট্রেনিং',
        },
      },
    },
  ]);
  expect(filterPlans([localized], 'শরীরের', 'bn')).toEqual([localized]);
  expect(filterPlans([localized], 'ডাম্বেল', 'bn')).toEqual([localized]);
});

test('accepts Arabic plan metadata without requiring it in older publications', () => {
  const [legacy] = parseLibrary([entry]);
  expect(filterPlans([legacy], 'upper', 'ar')).toEqual([legacy]);
  const [localized] = parseLibrary([
    {
      ...entry,
      metadata: {
        ...entry.metadata,
        title: { ...entry.metadata.title, ar: 'تمرين الجزء العلوي' },
        description: { ...entry.metadata.description, ar: 'خطة دمبل للنادي' },
      },
    },
  ]);
  expect(filterPlans([localized], 'العلوي', 'ar')).toEqual([localized]);
  expect(filterPlans([localized], 'دمبل', 'ar')).toEqual([localized]);
});

test('accepts Japanese metadata and retains English fallback without accepting malformed translations', () => {
  const [legacy] = parseLibrary([entry]);
  expect(filterPlans([legacy], 'upper', 'ja')).toEqual([legacy]);
  const localized = {
    ...entry,
    metadata: {
      ...entry.metadata,
      title: { ...entry.metadata.title, ja: '上半身トレーニング' },
      description: { ...entry.metadata.description, ja: 'ダンベルのプラン' },
    },
  };
  const [plan] = parseLibrary([localized]);
  expect(filterPlans([plan], '上半身', 'ja')).toEqual([plan]);
  expect(filterPlans([plan], 'ダンベル', 'ja')).toEqual([plan]);
  for (const ja of ['', 42, null])
    expect(() =>
      parseLibrary([
        {
          ...localized,
          metadata: {
            ...localized.metadata,
            title: { ...localized.metadata.title, ja },
          },
        },
      ]),
    ).toThrow();
});

test('accepts Vietnamese plan metadata with legacy English fallback and rejects malformed translations', () => {
  const [legacy] = parseLibrary([entry]);
  expect(filterPlans([legacy], 'upper', 'vi')).toEqual([legacy]);
  const localized = {
    ...entry,
    metadata: {
      ...entry.metadata,
      title: { ...entry.metadata.title, vi: 'Tập thân trên' },
      description: { ...entry.metadata.description, vi: 'Kế hoạch với tạ đơn' },
    },
  };
  const [plan] = parseLibrary([localized]);
  expect(filterPlans([plan], 'thân trên', 'vi')).toEqual([plan]);
  expect(filterPlans([plan], 'tạ đơn', 'vi')).toEqual([plan]);
  for (const vi of ['', 42, null])
    expect(() =>
      parseLibrary([
        {
          ...localized,
          metadata: {
            ...localized.metadata,
            title: { ...localized.metadata.title, vi },
          },
        },
      ]),
    ).toThrow();
});

test('accepts Marathi publication metadata with old English fallback and rejects malformed translations', () => {
  const [legacy] = parseLibrary([entry]);
  expect(filterPlans([legacy], 'upper', 'mr')).toEqual([legacy]);
  const localized = {
    ...entry,
    metadata: {
      ...entry.metadata,
      title: { ...entry.metadata.title, mr: 'वरच्या शरीराचे प्रशिक्षण' },
      description: { ...entry.metadata.description, mr: 'डंबेलचा आराखडा' },
    },
  };
  const [plan] = parseLibrary([localized]);
  expect(filterPlans([plan], 'वरच्या', 'mr')).toEqual([plan]);
  expect(filterPlans([plan], 'डंबेल', 'mr')).toEqual([plan]);
  for (const mr of ['', 42, null])
    expect(() =>
      parseLibrary([
        {
          ...localized,
          metadata: {
            ...localized.metadata,
            title: { ...localized.metadata.title, mr },
          },
        },
      ]),
    ).toThrow();
});

test('accepts Indonesian publication metadata with English fallback and rejects malformed optional text', () => {
  const [legacy] = parseLibrary([entry]);
  expect(filterPlans([legacy], 'upper', 'id')).toEqual([legacy]);
  const localized = {
    ...entry,
    metadata: {
      ...entry.metadata,
      title: { ...entry.metadata.title, id: 'Latihan tubuh bagian atas' },
      description: { ...entry.metadata.description, id: 'Rencana dumbel' },
    },
  };
  const [plan] = parseLibrary([localized]);
  expect(filterPlans([plan], 'bagian atas', 'id')).toEqual([plan]);
  expect(filterPlans([plan], 'dumbel', 'id')).toEqual([plan]);
  for (const id of ['', 42, null])
    expect(() =>
      parseLibrary([
        {
          ...localized,
          metadata: {
            ...localized.metadata,
            title: { ...localized.metadata.title, id },
          },
        },
      ]),
    ).toThrow();
});

test('accepts Korean publication metadata with legacy English fallback and rejects malformed optional text', () => {
  const [legacy] = parseLibrary([entry]);
  expect(filterPlans([legacy], 'upper', 'ko')).toEqual([legacy]);
  const localized = {
    ...entry,
    metadata: {
      ...entry.metadata,
      title: { ...entry.metadata.title, ko: '상체 운동' },
      description: { ...entry.metadata.description, ko: '덤벨 계획' },
    },
  };
  const [plan] = parseLibrary([localized]);
  expect(filterPlans([plan], '상체', 'ko')).toEqual([plan]);
  expect(filterPlans([plan], '덤벨', 'ko')).toEqual([plan]);
  for (const ko of ['', 42, null])
    expect(() =>
      parseLibrary([
        {
          ...localized,
          metadata: {
            ...localized.metadata,
            title: { ...localized.metadata.title, ko },
          },
        },
      ]),
    ).toThrow();
});

test('uses Dutch plan metadata when supplied and preserves legacy publications', () => {
  const [legacy] = parseLibrary([entry]);
  expect(filterPlans([legacy], 'upper', 'nl')).toEqual([legacy]);
  const localized = {
    ...entry,
    metadata: {
      ...entry.metadata,
      title: { ...entry.metadata.title, nl: 'Bovenlichaam' },
      description: {
        ...entry.metadata.description,
        nl: 'Training met dumbbells',
      },
    },
  };
  const [plan] = parseLibrary([localized]);
  expect(filterPlans([plan], 'bovenlichaam', 'nl')).toEqual([plan]);
  expect(filterPlans([plan], 'dumbbells', 'nl')).toEqual([plan]);
  expect(() =>
    parseLibrary([
      {
        ...localized,
        metadata: {
          ...localized.metadata,
          title: { ...localized.metadata.title, nl: ' ' },
        },
      },
    ]),
  ).toThrow();
});
