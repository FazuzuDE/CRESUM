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
