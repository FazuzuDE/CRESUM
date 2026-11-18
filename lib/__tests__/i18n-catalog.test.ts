import hindiSearch from '../i18n/search/hi';
import { catalogLabel, searchLocalizedExercises } from '../i18n/catalog';
import { exerciseLibrary } from '../exercise-library';
import { muscleTaxonomy, equipmentTaxonomy } from '../exercise-taxonomy';
const hindiSearchAliases = hindiSearch.exercise;

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
  expect(
    searchLocalizedExercises({ query: 'jalon al pecho' }, 'es').map(
      (x) => x.id,
    ),
  ).toContain('lat-pulldown');
  expect(
    searchLocalizedExercises(
      { query: 'elevacao lateral com halteres' },
      'pt-BR',
    ).map((x) => x.id),
  ).toContain('dumbbell-lateral-raise');
  expect(
    searchLocalizedExercises({ query: 'Panca piana con bilanciere' }, 'it').map(
      (x) => x.id,
    ),
  ).toContain('barbell-bench-press');
  expect(
    searchLocalizedExercises({ query: 'lawce plaskiej' }, 'pl').map(
      (x) => x.id,
    ),
  ).toContain('barbell-bench-press');
  expect(
    searchLocalizedExercises({ query: 'GÖĞÜS İTİŞİ' }, 'tr').map((x) => x.id),
  ).toContain('machine-chest-press');
  expect(
    searchLocalizedExercises({ query: 'AÇIŞ' }, 'tr').map((x) => x.id),
  ).toContain('cable-chest-fly');
  expect(
    searchLocalizedExercises({ query: 'gogus itisi' }, 'tr').map((x) => x.id),
  ).toContain('machine-chest-press');
  expect(
    searchLocalizedExercises(
      { query: '卧推', equipment: 'barbell' },
      'zh-Hans',
    ).map((x) => x.id),
  ).toContain('barbell-bench-press');
  expect(
    searchLocalizedExercises(
      { query: 'Bench Press', muscle: 'chest' },
      'zh-Hans',
    ).map((x) => x.id),
  ).toContain('barbell-bench-press');
  expect(catalogLabel('ru', 'exercise', 'bench', 'fallback')).toBe(
    'Жим штанги лёжа',
  );
  expect(catalogLabel('fr', 'exercise', 'unknown-id', 'My custom name')).toBe(
    'My custom name',
  );
  expect(JSON.stringify(exerciseLibrary)).toBe(before);
  expect(searchLocalizedExercises({}, 'de')[0]).toBe(exerciseLibrary[0]);
});
it('covers every current exercise, muscle and equipment in every supported language', () => {
  for (const locale of [
    'en',
    'ru',
    'de',
    'fr',
    'uk',
    'es',
    'pt-BR',
    'it',
    'pl',
    'tr',
    'zh-Hans',
    'hi',
    'bn',
    'ar',
    'ja',
  ] as const) {
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

it('covers every exact exercise with Hindi aliases and matches slang without changing filters', () => {
  expect(Object.keys(hindiSearchAliases).sort()).toEqual(
    exerciseLibrary.map((x) => x.id).sort(),
  );
  for (const [id, aliases] of Object.entries(hindiSearchAliases)) {
    expect(aliases.length).toBeGreaterThanOrEqual(2);
    for (const alias of aliases) {
      expect(alias.trim()).toBe(alias);
      expect(alias.length).toBeGreaterThan(0);
      // The existing goblet family intentionally presents both variants as one item.
      expect(
        searchLocalizedExercises({ query: alias }, 'hi').map((x) => x.id),
      ).toContain(id === 'kettlebell-goblet-squat' ? 'goblet-squat' : id);
    }
  }
  expect(
    searchLocalizedExercises({ query: 'बटरफ्लाई मशीन' }, 'hi').map((x) => x.id),
  ).toContain('pec-deck-fly');
  expect(
    searchLocalizedExercises({ query: 'butterfly machine' }, 'hi').map(
      (x) => x.id,
    ),
  ).toContain('pec-deck-fly');
  expect(
    searchLocalizedExercises({ query: 'पैलॉफ प्रेस'.normalize('NFD') }, 'hi').map(
      (x) => x.id,
    ),
  ).toContain('standing-cable-anti-rotation-press');
  expect(
    searchLocalizedExercises(
      { query: 'बटरफ्लाई मशीन', equipment: 'barbell' },
      'hi',
    ),
  ).toEqual([]);
  expect(
    searchLocalizedExercises({ query: 'barbel rdl' }, 'hi').map((x) => x.id),
  ).toEqual(['barbell-romanian-deadlift']);
  expect(
    searchLocalizedExercises({ query: 'butterfly machine' }, 'en').map(
      (x) => x.id,
    ),
  ).toContain('pec-deck-fly');
  expect(
    searchLocalizedExercises(
      { query: 'Bench Press', muscle: 'chest' },
      'hi',
    ).map((x) => x.id),
  ).toContain('barbell-bench-press');
});
