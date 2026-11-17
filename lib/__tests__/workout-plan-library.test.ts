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
