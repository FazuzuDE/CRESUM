import { catalogLabel, searchLocalizedExercises } from '../i18n/catalog';
import { exerciseLibrary } from '../exercise-library';
import { muscleTaxonomy, equipmentTaxonomy } from '../exercise-taxonomy';
it('finds localized and canonical names/aliases without changing the catalog or filters', () => {
  const before = JSON.stringify(exerciseLibrary);
  expect(
    searchLocalizedExercises(
      { query: 'Bankdrücken', equipment: 'barbell' },
      'de',
    ).map((x) => x.id),
  ).toContain('barbell-bench-press');
  expect(
    searchLocalizedExercises(
      { query: 'Bench Press', muscle: 'chest' },
      'de',
    ).map((x) => x.id),
  ).toContain('barbell-bench-press');
  expect(
    searchLocalizedExercises({ query: 'bench', muscle: 'calves' }, 'ru'),
  ).toEqual([]);
  expect(catalogLabel('ru', 'exercise', 'bench', 'fallback')).toBe(
    'Жим штанги лёжа',
  );
  expect(catalogLabel('fr', 'exercise', 'unknown-id', 'My custom name')).toBe(
    'My custom name',
  );
  expect(JSON.stringify(exerciseLibrary)).toBe(before);
  expect(searchLocalizedExercises({}, 'de')[0]).toBe(exerciseLibrary[0]);
});
it('covers every current exercise, muscle and equipment in all four languages', () => {
  for (const locale of ['en', 'ru', 'de', 'fr'] as const) {
    for (const record of exerciseLibrary)
      expect(
        catalogLabel(locale, 'exercise', record.id, '__missing__'),
      ).not.toBe('__missing__');
    for (const record of muscleTaxonomy)
      expect(catalogLabel(locale, 'muscle', record.id, '__missing__')).not.toBe(
        '__missing__',
      );
    for (const record of equipmentTaxonomy)
      expect(
        catalogLabel(locale, 'equipment', record.id, '__missing__'),
      ).not.toBe('__missing__');
  }
});
