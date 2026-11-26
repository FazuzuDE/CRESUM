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

it.each(['treadmill-walking', 'upright-stationary-bike'] as const)(
  'finds %s by its aliases in every locale',
  (id) => {
    for (const locale of Object.keys(localeRegistry) as AppLocale[]) {
      const aliases = searchAliases[locale].exercise[id];
      for (const alias of aliases) {
        expect(ids(alias, locale)).toContain(id);
      }
    }
  },
);

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

it('matches Marathi gym names and Roman alternatives across languages while retaining meaningful marks', () => {
  expect(normalizeSearch('पोटऱ्या')).toBe(
    normalizeSearch('पोटऱ्या'.normalize('NFD')),
  );
  expect(normalizeSearch('काळे')).not.toBe(normalizeSearch('काले'));
  expect(normalizeSearch('की')).not.toBe(normalizeSearch('क'));
  expect(ids('बटरफ्लाय मशीन', 'de')).toContain('pec-deck-fly');
  expect(ids('eka hatane dumbbell row', 'en')).toContain(
    'one-arm-dumbbell-row',
  );
  expect(ids('व्ही हँडल पुलडाउन', 'mr')).toContain(
    'lat-pulldown-close-neutral-v-handle',
  );
  expect(ids('डंबेल आरडीएल', 'ru')).toContain('dumbbell-romanian-deadlift');
  expect(
    searchLocalizedExercises({ query: 'बारबेल बेंचप्रेस', muscle: 'calves' }, 'mr'),
  ).toEqual([]);
  const goblet = searchLocalizedExercises(
    { query: 'डंबेल गॉब्लेट स्क्वॉट', equipment: 'dumbbell' },
    'mr',
  ).map((x) => x.id);
  expect(goblet).toContain('goblet-squat');
  expect(goblet).not.toContain('kettlebell-goblet-squat');
});

it('finds Indonesian gym terms and abbreviations across languages and preserves exact equipment filters', () => {
  const before = JSON.stringify(exerciseLibrary);
  expect(ids('MESIN KUPU-KUPU DADA', 'de')).toContain('pec-deck-fly');
  expect(ids('dumbel dayung satu tangan', 'ru')).toContain(
    'one-arm-dumbbell-row',
  );
  expect(ids('RDL dumbel', 'id')).toContain('dumbbell-romanian-deadlift');
  expect(ids('tarik lat pegangan V', 'en')).toContain(
    'lat-pulldown-close-neutral-v-handle',
  );
  expect(
    searchLocalizedExercises(
      { query: 'bench press barbel', muscle: 'calves' },
      'id',
    ),
  ).toEqual([]);
  const goblet = searchLocalizedExercises(
    { query: 'goblet squat dumbel', equipment: 'dumbbell' },
    'id',
  ).map((x) => x.id);
  expect(goblet).toContain('goblet-squat');
  expect(goblet).not.toContain('kettlebell-goblet-squat');
  expect(JSON.stringify(exerciseLibrary)).toBe(before);
});

it('matches Korean gym names, slang and composed/decomposed Hangul across interface languages', () => {
  const before = JSON.stringify(exerciseLibrary);
  expect(normalizeSearch('팔굽혀펴기')).toBe(
    normalizeSearch('팔굽혀펴기'.normalize('NFD')),
  );
  expect(normalizeSearch('컬')).not.toBe(normalizeSearch('콜'));
  for (const query of ['팔굽혀펴기', '팔굽혀펴기'.normalize('NFD')])
    expect(ids(query, 'de')).toContain('push-up');
  expect(ids('턱걸이', 'en')).toContain('pull-up');
  expect(ids('사레레', 'ru')).toContain('dumbbell-lateral-raise');
  expect(ids('덤벨 RDL', 'ko')).toContain('dumbbell-romanian-deadlift');
  expect(ids('V바 랫풀다운', 'en')).toContain(
    'lat-pulldown-close-neutral-v-handle',
  );
  expect(
    searchLocalizedExercises({ query: '바벨 벤치', muscle: 'calves' }, 'ko'),
  ).toEqual([]);
  const goblet = searchLocalizedExercises(
    { query: '덤벨 고블릿스쿼트', equipment: 'dumbbell' },
    'ko',
  ).map((x) => x.id);
  expect(goblet).toContain('goblet-squat');
  expect(goblet).not.toContain('kettlebell-goblet-squat');
  expect(JSON.stringify(exerciseLibrary)).toBe(before);
});

it.each(['nl', 'de', 'fr'] as const)(
  'finds Dutch names and gym slang offline with the %s interface',
  (locale) => {
    for (const query of [
      'bankdrukken',
      'bench press',
      'halterstang',
      'barbell',
    ]) {
      expect(ids(query, locale)).toContain('barbell-bench-press');
    }
    for (const query of [
      'lat pulldown',
      'lat pulldown-machine',
      'lat pulldown machine',
    ]) {
      expect(ids(query, locale)).toContain('lat-pulldown');
    }
    expect(ids('kabelmachine', locale)).toContain('cable-lateral-raise');
    expect(ids('cable machine', locale)).toContain('cable-lateral-raise');
    expect(ids('dumbbell', locale)).toContain('dumbbell-lateral-raise');
    expect(ids('halter', locale)).toContain('dumbbell-lateral-raise');
    expect(ids('bilspieren', locale)).toContain('barbell-hip-thrust');
    expect(ids('glutes', locale)).toContain('barbell-hip-thrust');
    expect(ids('pompen', locale)).toContain('push-up');
  },
);

it('uses the exact equipment filter and keeps Dutch grip variants distinct', () => {
  const barbell = searchLocalizedExercises(
    { query: 'bankdrukken', equipment: 'barbell' },
    'nl',
  );
  expect(barbell.map(({ id }) => id)).toContain('barbell-bench-press');
  expect(barbell.every(({ equipment }) => equipment.includes('barbell'))).toBe(
    true,
  );
  const results = ids('lat pulldown V-greep', 'nl');
  expect(results[0]).toBe('lat-pulldown-close-neutral-v-handle');
  expect(ids('lat pulldown ergonomische greep', 'nl')[0]).toBe(
    'lat-pulldown-close-neutral-ergonomic-handle',
  );
});

it('finds Swedish names offline with or without accents, case, spacing and hyphens', () => {
  for (const locale of ['sv', 'en'] as const)
    for (const [query, exercise] of [
      ['bänkpress', 'barbell-bench-press'],
      ['BANKPRESS', 'barbell-bench-press'],
      ['knäböj', 'barbell-back-squat'],
      ['knaboj', 'barbell-back-squat'],
      ['latsdrag', 'lat-pulldown'],
      ['lat pulldown', 'lat-pulldown'],
      ['  SITTANDE   KABELRODD  ', 'seated-cable-row'],
      ['löpband', 'treadmill-walking'],
      ['lopband', 'treadmill-walking'],
      ['motionscykel', 'upright-stationary-bike'],
      ['tricepsrep', 'cable-triceps-pushdown'],
      ['skivstång', 'barbell-bench-press'],
      ['tahavning', 'standing-calf-raise'],
    ])
      expect(ids(query, locale)).toContain(exercise);
  expect(ids('latsdrag v handtag', 'sv')[0]).toBe(
    'lat-pulldown-close-neutral-v-handle',
  );
  expect(ids('latsdrag med bred stång', 'sv')[0]).toBe(
    'lat-pulldown-wide-pronated-bar',
  );
  const bench = searchLocalizedExercises(
    { query: 'bankpress', equipment: 'barbell' },
    'sv',
  );
  expect(bench.map(({ id }) => id)).toContain('barbell-bench-press');
  expect(bench.every(({ equipment }) => equipment.includes('barbell'))).toBe(
    true,
  );
  expect(ids('motionscykel', 'sv')).not.toContain('treadmill-walking');
});

it.each(['th', 'en'] as const)(
  'finds Thai gym vocabulary offline in %s while preserving Thai marks and equipment filters',
  (locale) => {
    for (const [query, exercise] of [
      ['ลู่วิ่ง', 'treadmill-walking'],
      ['จักรยานออกกำลังกาย', 'upright-stationary-bike'],
      ['จักรยาน ออก กำลังกาย', 'upright-stationary-bike'],
      ['ดัมเบล', 'dumbbell-lateral-raise'],
      ['ดัม เบล', 'dumbbell-lateral-raise'],
      ['บาร์เบล', 'barbell-bench-press'],
      ['เลกเพรส', 'leg-press'],
      ['เลก เพรส', 'leg-press'],
      ['  LEG   PRESS ', 'leg-press'],
      ['วิดพื้น', 'push-up'],
      ['แลตพูลดาวน์มือจับวี', 'lat-pulldown-close-neutral-v-handle'],
      ['แลตพูลดาวน์มือจับเข้ารูป', 'lat-pulldown-close-neutral-ergonomic-handle'],
    ]) {
      expect(ids(query, locale)).toContain(exercise);
    }
    expect(normalizeSearch('ไก่')).not.toBe(normalizeSearch('ไก้'));
    const filtered = searchLocalizedExercises(
      { query: 'ดัมเบล', equipment: 'dumbbell' },
      locale,
    );
    expect(filtered.map(({ id }) => id)).toContain('dumbbell-lateral-raise');
    expect(
      filtered.every(({ equipment }) => equipment.includes('dumbbell')),
    ).toBe(true);
    expect(ids('จักรยานออกกำลังกาย', locale)).not.toContain('treadmill-walking');
  },
);

it.each(['ur', 'en'] as const)(
  'finds Urdu, Roman Urdu and gym English aliases offline in %s',
  (locale) => {
    expect(ids('بینچ پریس', locale)[0]).toBe('barbell-bench-press');
    expect(ids('بِينچ   پريس', locale)[0]).toBe('barbell-bench-press');
    expect(ids('BENCH PRESS', locale)[0]).toBe('barbell-bench-press');
    expect(ids('bench par barbell press', locale)[0]).toBe(
      'barbell-bench-press',
    );
    for (const query of [
      'ٹریڈ مل',
      'ٹریڈمل',
      'treadmill',
      'treadmill par walk',
    ])
      expect(ids(query, locale)[0]).toBe('treadmill-walking');
    expect(ids('وی ہینڈل پل ڈاؤن', locale)[0]).toBe(
      'lat-pulldown-close-neutral-v-handle',
    );
    expect(ids('چوڑی گرفت کا لیٹ پل ڈاؤن', locale)[0]).toBe(
      'lat-pulldown-wide-pronated-bar',
    );
  },
);

it.each(['te', 'en'] as const)(
  'finds Telugu and gym aliases offline in %s without merging grip variants',
  (locale) => {
    for (const term of [
      'బెంచ్ ప్రెస్',
      '  బెంచ్   ప్రెస్  ',
      'BENCH PRESS',
      'rod bench press',
    ])
      expect(ids(term, locale)[0]).toBe('barbell-bench-press');
    for (const term of [
      'ట్రెడ్‌మిల్',
      'ట్రెడ్ మిల్',
      'ట్రెడ్‍మిల్',
      'ట్రెడ్​మిల్',
      'treadmill',
      'treadmill nadaka',
    ])
      expect(ids(term.normalize('NFD'), locale)[0]).toBe('treadmill-walking');
    expect(ids('వీ హ్యాండిల్ పుల్‌డౌన్', locale)[0]).toBe(
      'lat-pulldown-close-neutral-v-handle',
    );
    expect(ids('చిన్న ఎర్గో హ్యాండిల్ పుల్‌డౌన్', locale)[0]).toBe(
      'lat-pulldown-close-neutral-ergonomic-handle',
    );
    expect(ids('వెడల్పు పట్టు లాట్ పుల్‌డౌన్', locale)[0]).toBe(
      'lat-pulldown-wide-pronated-bar',
    );
    expect(ids('రైలు బార్‌తో స్క్వాట్', locale)[0]).toBe('smith-machine-squat');
    expect(normalizeSearch('కాలి')).not.toBe(normalizeSearch('కలి'));
  },
);

it.each(['ta', 'en'] as const)(
  'finds Tamil aliases offline in %s across NFC and NFD and retains exact variants',
  (locale) => {
    for (const term of ['பெஞ்ச் பிரஸ்', 'பெஞ்ச்பிரஸ்', 'bench press'])
      expect(ids(term, locale)[0]).toBe('barbell-bench-press');
    for (const term of ['டிரெட்மில்', 'டிரெட் மில்', 'டிரெட்\u200dமில்', 'treadmill'])
      expect(ids(term, locale)[0]).toBe('treadmill-walking');
    const composed = 'கோப்லெட்';
    expect(composed).not.toBe(composed.normalize('NFD'));
    expect(ids(composed, locale)[0]).toBe('goblet-squat');
    expect(ids(composed.normalize('NFD'), locale)).toEqual(
      ids(composed, locale),
    );
    expect(normalizeSearch('கால்')).not.toBe(normalizeSearch('கால'));
    expect(ids('வி கிரிப் புல்டவுன்', locale)[0]).toBe(
      'lat-pulldown-close-neutral-v-handle',
    );
    expect(ids('எர்கோ கைப்பிடி புல்டவுன்', locale)[0]).toBe(
      'lat-pulldown-close-neutral-ergonomic-handle',
    );
    expect(ids('அகலப் பிடி லாட் புல்டவுன்', locale)[0]).toBe(
      'lat-pulldown-wide-pronated-bar',
    );
    expect(ids('ஸ்மித் மெஷின் ஸ்குவாட்', locale)[0]).toBe('smith-machine-squat');
  },
);

it.each(['zh-Hant', 'zh-Hans', 'en'] as const)(
  'preserves exact exercise identity for Traditional and Simplified queries in %s',
  (locale) => {
    const cases = [
      ['槓鈴臥推', 'barbell-bench-press'],
      ['臥推', 'barbell-bench-press'],
      ['杠铃卧推', 'barbell-bench-press'],
      ['滑輪下拉', 'lat-pulldown'],
      ['高位下拉', 'lat-pulldown'],
      ['跑步機', 'treadmill-walking'],
      ['跑步机', 'treadmill-walking'],
      ['寬握正手下拉', 'lat-pulldown-wide-pronated-bar'],
      ['三角握把下拉', 'lat-pulldown-close-neutral-v-handle'],
      ['短型人體工學握把下拉', 'lat-pulldown-close-neutral-ergonomic-handle'],
      ['反手下拉', 'lat-pulldown-reverse-grip'],
      ['胸推機', 'machine-chest-press'],
      ['史密斯深蹲', 'smith-machine-squat'],
    ];
    for (const [query, id] of cases) expect(ids(query, locale)[0]).toBe(id);
  },
);

it('finds exact Bokmål exercise variants with the shared search normalization', () => {
  const queries = [
    ['knebøy', 'barbell-back-squat'],
    ['KNEBØY', 'barbell-back-squat'],
    ['nedtrekk', 'lat-pulldown'],
    ['BEINPRESS', 'leg-press'],
    ['benpress', 'leg-press'],
    ['nedtrekk med V-håndtak', 'lat-pulldown-close-neutral-v-handle'],
    [
      'nedtrekk med ergonomisk grep',
      'lat-pulldown-close-neutral-ergonomic-handle',
    ],
    ['nedtrekk med bred stang', 'lat-pulldown-wide-pronated-bar'],
    ['nedtrekk med omvendt grep', 'lat-pulldown-reverse-grip'],
    ['STÅENDE TÅHEV'.normalize('NFD'), 'standing-calf-raise'],
  ] as const;
  for (const [query, id] of queries) expect(ids(query, 'nb')[0]).toBe(id);
  expect(normalizeSearch('HÆL ØVRE TÅHEV'.normalize('NFD'))).toBe(
    'hæl øvre tahev',
  );
  expect(normalizeSearch('ØVRE')).not.toBe(normalizeSearch('OVRE'));
});

it('finds Finnish names, accent-folded queries and exact pulldown variants', () => {
  const queries = [
    ['jalkaprässi', 'leg-press'],
    ['JALKAPRÄSSI', 'leg-press'],
    ['jalkaprassi', 'leg-press'],
    ['ylätalja', 'lat-pulldown'],
    ['KUNTOPYÖRÄ'.normalize('NFD'), 'upright-stationary-bike'],
    ['kuntopyora', 'upright-stationary-bike'],
    ['ylätaljaveto V-kahvalla', 'lat-pulldown-close-neutral-v-handle'],
    [
      'ylätaljaveto ergonomisella kahvalla',
      'lat-pulldown-close-neutral-ergonomic-handle',
    ],
    ['vastaote ylätaljassa', 'lat-pulldown-reverse-grip'],
    ['leveä ylätaljaveto', 'lat-pulldown-wide-pronated-bar'],
  ] as const;
  for (const [query, id] of queries) expect(ids(query, 'fi')[0]).toBe(id);
  expect(normalizeSearch('Ä Ö')).toBe('a o');
});
