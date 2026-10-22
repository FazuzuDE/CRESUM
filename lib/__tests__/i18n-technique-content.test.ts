import { localizedTechnique } from '../i18n/technique';
import { techniqueCatalog, findTechnique } from '../exercise-technique';
it('translates all authored guides while preserving revision, source IDs and canonical instructions', () => {
  const before = JSON.stringify(techniqueCatalog);
  for (const [id, source] of Object.entries(techniqueCatalog))
    for (const locale of ['en', 'ru', 'de', 'fr'] as const) {
      const translated = localizedTechnique(locale, id)!;
      expect(translated.revision).toBe(source.revision);
      expect(translated.sources).toEqual(source.sources);
      for (const field of [
        'setup',
        'movement',
        'checks',
        'mistakes',
      ] as const) {
        expect(translated[field]).toHaveLength(source[field].length);
        if (locale !== 'en')
          expect(translated[field]).not.toEqual(source[field]);
      }
      if (locale === 'en') expect(translated).toEqual(source);
    }
  expect(localizedTechnique('ru', 'bench')).toEqual(
    localizedTechnique('ru', 'barbell-bench-press'),
  );
  expect(localizedTechnique('fr', 'unknown')).toBeUndefined();
  expect(findTechnique('barbell-bench-press')!.scope).toBe(
    'Flat bench; barbell.',
  );
  expect(JSON.stringify(techniqueCatalog)).toBe(before);
});
