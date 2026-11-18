import { exerciseLibrary } from '../exercise-library';
import { exerciseEquipmentCatalog } from '../exercise-equipment-catalog';
import { muscleTaxonomy } from '../exercise-taxonomy';
import { searchLocalizedExercises } from '../i18n/catalog';
import { catalogs } from '../i18n/messages';
import { localeRegistry, type AppLocale } from '../i18n/registry';
import { searchAliases } from '../i18n/search/aliases';
import {
  exerciseSearchScore,
  normalizeSearch,
  prepareExerciseQuery,
} from '../i18n/search/engine';

const ids = (query: string, locale: AppLocale = 'en') =>
  searchLocalizedExercises({ query }, locale).map((record) => record.id);
const { validateSearchAliases } = jest.requireActual(
  '../../scripts/check-localization.cjs',
);
const records = {
  exercise: exerciseLibrary,
  equipment: exerciseEquipmentCatalog,
  muscle: muscleTaxonomy,
};

it('preserves meaningful Devanagari marks across all interface languages', () => {
  expect(normalizeSearch('पैलॉफ')).toBe(
    normalizeSearch('पैलॉफ'.normalize('NFD')),
  );
  expect(normalizeSearch('की')).not.toBe(normalizeSearch('क'));
  expect(normalizeSearch('क़')).not.toBe(normalizeSearch('क'));
  expect(ids('बटरफ्लाई मशीन', 'en')).toContain('pec-deck-fly');
  expect(ids('पैलॉफ प्रेस'.normalize('NFD'), 'de')).toContain(
    'standing-cable-anti-rotation-press',
  );
});

it('treats Cyrillic е and ё as equivalent in search and transliteration', () => {
  expect(normalizeSearch('сгибания лёжа')).toBe(
    normalizeSearch('сгибания лежа'),
  );
  const exerciseId = 'hanging-straight-leg-raise';
  const score = (query: string) =>
    exerciseSearchScore(exerciseId, prepareExerciseQuery(query), 'en');
  expect(score('подъём ног на турнике')).toBeGreaterThan(0);
  expect(score('подъем ног на турнике')).toBe(score('подъём ног на турнике'));
  expect(score('podem nog na turnike')).toBe(score('подъём ног на турнике'));
});

it('covers every current identity and every selectable language; omissions block checks', () => {
  expect(
    validateSearchAliases(searchAliases, localeRegistry, catalogs, records),
  ).toEqual([]);
  const broken = JSON.parse(JSON.stringify(searchAliases));
  delete broken.tr.exercise['hammer-curl'];
  broken.ru.equipment.rope = [];
  expect(
    validateSearchAliases(broken, localeRegistry, catalogs, records),
  ).toEqual(
    expect.arrayContaining([
      expect.stringContaining(
        'tr: missing/empty search aliases exercise.hammer-curl',
      ),
      expect.stringContaining(
        'ru: missing/empty search aliases equipment.rope',
      ),
    ]),
  );
  expect(
    validateSearchAliases(
      searchAliases,
      { ...localeRegistry, xx: {} },
      catalogs,
      records,
    ),
  ).toContain('xx: missing message catalog');
  expect(
    validateSearchAliases(searchAliases, localeRegistry, catalogs, {
      ...records,
      exercise: [...exerciseLibrary, { id: 'new-machine' }],
    }),
  ).toHaveLength(Object.keys(localeRegistry).length * 2);
});

it.each(Object.keys(localeRegistry) as AppLocale[])(
  'finds every authored %s synonym in another UI language',
  (locale) => {
    for (const exercise of exerciseLibrary) {
      const expected =
        exercise.id === 'kettlebell-goblet-squat'
          ? 'goblet-squat'
          : exercise.id;
      for (const alias of searchAliases[locale].exercise[exercise.id])
        expect(ids(alias, 'de')).toContain(expected);
      const name = (catalogs[locale] as Record<string, unknown>)[
        `catalog.exercise.${exercise.id}`
      ] as string;
      expect(ids(name, 'fr')).toContain(expected);
    }
  },
);

it.each([
  ['бабочка', 'pec-deck-fly'],
  ['蝴蝶机', 'pec-deck-fly'],
  ['倒蹬', 'leg-press'],
  ['锤举', 'hammer-curl'],
  ['метелик', 'pec-deck-fly'],
  ['Butterfly', 'pec-deck-fly'],
  ['papillon', 'pec-deck-fly'],
  ['mariposa', 'pec-deck-fly'],
  ['voador', 'pec-deck-fly'],
  ['farfalla', 'pec-deck-fly'],
  ['kelebek', 'pec-deck-fly'],
  ['молотки', 'hammer-curl'],
  ['młotki', 'hammer-curl'],
  ['гравитон', 'assisted-pull-up'],
  ['OHP', 'barbell-overhead-press'],
  ['RDL', 'barbell-romanian-deadlift'],
  ['Паллоф', 'standing-cable-anti-rotation-press'],
  ['skull crushers', 'lying-barbell-triceps-extension'],
])('ranks %s as %s', (query, expected) => {
  expect(ids(query)[0]).toBe(expected);
});

it('handles accents, case, punctuation, word order, prefixes, transliteration and limited typos', () => {
  for (const query of ['  МОЛОТКИ  ', 'molotki', 'молотк', 'молоткки'])
    expect(ids(query)[0]).toBe('hammer-curl');
  expect(ids('babochka')[0]).toBe('pec-deck-fly');
  expect(ids('Bankdruecken', 'fr')).toContain('barbell-bench-press');
  expect(ids('GOGUS ITISI', 'en')).toContain('machine-chest-press');
  expect(ids('LAWCE PLASKIEJ', 'tr')).toContain('barbell-bench-press');
  expect(ids('гантелями румынка')[0]).toBe('dumbbell-romanian-deadlift');
  expect(ids('V-BAR PULLDOWN')[0]).toBe('lat-pulldown-close-neutral-v-handle');
  expect(ids('hammmer curl')[0]).toBe('hammer-curl');
  expect(ids('RDX')).toEqual([]);
  expect(ids('zzzzzzzz')).toEqual([]);
});

it('keeps ambiguous equipment queries broad, exact variants first and filters conjunctive', () => {
  const crossover = ids('кроссовер');
  expect(crossover[0]).toBe('cable-chest-fly');
  expect(crossover).toEqual(
    expect.arrayContaining(['cable-lateral-raise', 'cable-glute-kickback']),
  );
  expect(ids('обратная бабочка')[0]).toBe('reverse-pec-deck');
  expect(ids('румынка')).not.toContain('barbell-deadlift');
  expect(ids('становая')[0]).toBe('barbell-deadlift');
  expect(ids('треугольник')).toContain('lat-pulldown-close-neutral-v-handle');
  expect(ids('трицепс канат')).toContain('cable-triceps-pushdown');
  expect(
    searchLocalizedExercises({ query: 'молотки', muscle: 'calves' }, 'ru'),
  ).toEqual([]);
  expect(
    searchLocalizedExercises(
      { query: 'румынка', equipment: 'dumbbell' },
      'en',
    ).map((x) => x.id),
  ).toEqual(['dumbbell-romanian-deadlift']);
});

it('preserves grouped Goblet discovery, original objects and empty-query curated order', () => {
  const before = JSON.stringify(exerciseLibrary);
  expect(ids('гоблет с гирей')).toContain('goblet-squat');
  expect(ids('гоблет с гирей')).not.toContain('kettlebell-goblet-squat');
  const results = searchLocalizedExercises({ query: ' --- ' }, 'pl');
  expect(results).toEqual(
    exerciseLibrary.filter((record) => record.id !== 'kettlebell-goblet-squat'),
  );
  expect(results[0]).toBe(exerciseLibrary[0]);
  expect(JSON.stringify(exerciseLibrary)).toBe(before);
});

it('searches saved performance choices by exact canonical or legacy identity while retaining custom names', () => {
  const query = prepareExerciseQuery('жим лёжа');
  expect(
    exerciseSearchScore('bench', query, 'de', 'My old bench'),
  ).toBeGreaterThan(0);
  expect(exerciseSearchScore('unknown-id', query, 'de', 'My old bench')).toBe(
    0,
  );
  expect(
    exerciseSearchScore(
      'unknown-id',
      prepareExerciseQuery('My old'),
      'ru',
      'My old bench',
    ),
  ).toBeGreaterThan(0);
  expect(
    exerciseSearchScore(
      'kettlebell-goblet-squat',
      prepareExerciseQuery('гоблет с гирей'),
      'de',
    ),
  ).toBeGreaterThan(0);
});

it('preserves Bengali vowel signs, virama and nukta in searches across interface languages', () => {
  expect(normalizeSearch('কি')).not.toBe(normalizeSearch('ক'));
  expect(normalizeSearch('ক্')).not.toBe(normalizeSearch('ক'));
  expect(normalizeSearch('ড়')).not.toBe(normalizeSearch('ড'));
  expect(normalizeSearch('ড়')).toBe(normalizeSearch('ড়'.normalize('NFD')));
  expect(ids('বাটারফ্লাই', 'de')[0]).toBe('pec-deck-fly');
  expect(ids('bukdon', 'fr')[0]).toBe('push-up');
  expect(ids('ডাম্বেল আরডিএল', 'en')).not.toContain('barbell-deadlift');
  expect(
    searchLocalizedExercises(
      { query: 'বাটারফ্লাই', equipment: 'barbell' },
      'bn',
    ),
  ).toEqual([]);
  expect(ids('কেটলবেল গবলেট', 'ru')).toContain('goblet-squat');
  expect(ids('কেটলবেল গবলেট', 'ru')).not.toContain('kettlebell-goblet-squat');
});

it('finds Arabic gym names across interface languages and folds Arabic spelling marks only', () => {
  expect(ids('فراشة', 'de')[0]).toBe('pec-deck-fly');
  expect(ids('فَرَاشَة', 'fr')[0]).toBe('pec-deck-fly');
  expect(ids('فــراشة', 'bn')[0]).toBe('pec-deck-fly');
  expect(ids('روماني دمبل', 'en')[0]).toBe('dumbbell-romanian-deadlift');
  expect(ids('روماني دمبل', 'en')).not.toContain('barbell-deadlift');
  expect(ids('فراشة عكسي', 'ru')[0]).toBe('reverse-pec-deck');
  expect(
    searchLocalizedExercises({ query: 'فراشة', equipment: 'barbell' }, 'ar'),
  ).toEqual([]);
  expect(ids('جوبلت كيتل بيل', 'ar')).toContain('goblet-squat');
  expect(normalizeSearch('أَمَامِيّ')).toBe(normalizeSearch('امامي'));
  expect(normalizeSearch('की')).not.toBe(normalizeSearch('क'));
});

it('matches Japanese kana and width variants across UI languages without erasing voicing', () => {
  for (const query of [
    'ベンチプレス',
    'べんちぷれす',
    'ﾍﾞﾝﾁﾌﾟﾚｽ',
    'ベンチプレス'.normalize('NFD'),
  ]) {
    expect(ids(query, 'de')).toContain('barbell-bench-press');
    expect(normalizeSearch(query)).toBe(normalizeSearch('ベンチプレス'));
  }
  expect(normalizeSearch('ＥＺバーカール')).toBe(
    normalizeSearch('ezばーかーる'),
  );
  expect(normalizeSearch('カール')).not.toBe(normalizeSearch('ガール'));
  expect(normalizeSearch('ハ')).not.toBe(normalizeSearch('パ'));
  expect(ids('ワンハンドロー', 'en')).toContain('one-arm-dumbbell-row');
  expect(ids('Vバープルダウン', 'ru')).toContain(
    'lat-pulldown-close-neutral-v-handle',
  );
  expect(ids('内ももマシン', 'ja')).toContain('machine-hip-adduction');
  expect(
    searchLocalizedExercises({ query: 'べんちぷれす', muscle: 'calves' }, 'ja'),
  ).toEqual([]);
  expect(
    searchLocalizedExercises(
      { query: 'ダンベルゴブレットスクワット', equipment: 'dumbbell' },
      'ja',
    ).map((x) => x.id),
  ).toContain('goblet-squat');
  expect(
    searchLocalizedExercises(
      { query: 'ダンベルゴブレットスクワット', equipment: 'dumbbell' },
      'ja',
    ).map((x) => x.id),
  ).not.toContain('kettlebell-goblet-squat');
});

it('finds Vietnamese names, slang and abbreviations with or without diacritics across UI languages', () => {
  const before = JSON.stringify(exerciseLibrary);
  for (const query of [
    'ĐẨY NGỰC TẠ ĐÒN',
    'day nguc ta don',
    'Đẩy ngực tạ đòn'.normalize('NFD'),
  ]) {
    expect(ids(query, 'de')).toContain('barbell-bench-press');
    expect(normalizeSearch(query)).toBe('day nguc ta don');
  }
  expect(ids('hit dat', 'ru')).toContain('push-up');
  expect(ids('may ep nguc', 'ja')).toContain('pec-deck-fly');
  expect(ids('RDL tạ tay', 'en')).toContain('dumbbell-romanian-deadlift');
  expect(ids('keo xo tay cam chu V', 'vi')).toContain(
    'lat-pulldown-close-neutral-v-handle',
  );
  expect(
    searchLocalizedExercises(
      { query: 'day nguc ta don', muscle: 'calves' },
      'vi',
    ),
  ).toEqual([]);
  expect(
    searchLocalizedExercises(
      { query: 'squat om ta don truoc nguc', equipment: 'dumbbell' },
      'vi',
    ).map((x) => x.id),
  ).toContain('goblet-squat');
  expect(
    searchLocalizedExercises(
      { query: 'squat om ta don truoc nguc', equipment: 'dumbbell' },
      'vi',
    ).map((x) => x.id),
  ).not.toContain('kettlebell-goblet-squat');
  expect(JSON.stringify(exerciseLibrary)).toBe(before);
});
