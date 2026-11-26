import { resolveLocale } from '../i18n/registry';
import { createTranslator } from '../i18n/engine';
import type { Translate } from '../i18n/messages';

export function compileTimeContract(t: Translate) {
  // @ts-expect-error Unknown messages must not enter UI code.
  t('not.a.real.key');
  // @ts-expect-error The plural message requires a numeric count.
  t('common.setCount');
  // @ts-expect-error Counts are numbers, not formatted strings.
  t('common.setCount', { count: '1' });
}

it('supports Russian plurals when the runtime has no native Intl.PluralRules', () => {
  const descriptor = Object.getOwnPropertyDescriptor(Intl, 'PluralRules')!;
  try {
    Object.defineProperty(Intl, 'PluralRules', {
      configurable: true,
      writable: true,
      value: undefined,
    });
    jest.isolateModules(() => {
      const { createTranslator: create } = jest.requireActual('../i18n/engine');
      expect(
        [0, 1, 2, 1.5].map((count) =>
          create('zh-Hans')('common.setCount', { count }),
        ),
      ).toEqual(['0 组', '1 组', '2 组', '1.5 组']);
      expect(create('hi')('history.completedSets', { count: 1 })).toBe(
        '1 पूरा किया सेट',
      );
      expect(create('hi')('history.completedSets', { count: 2 })).toBe(
        '2 पूरे किए सेट',
      );
      expect(
        [0, 1, 2, 1.5].map((count) =>
          create('ja')('common.setCount', { count }),
        ),
      ).toEqual(['0セット', '1セット', '2セット', '1.5セット']);
      expect(
        [0, 1, 2, 1.5].map((count) =>
          create('vi')('common.setCount', { count }),
        ),
      ).toEqual(['0 hiệp', '1 hiệp', '2 hiệp', '1,5 hiệp']);
      expect(
        [0, 1, 2, 1.5].map((count) =>
          create('mr')('common.setCount', { count }),
        ),
      ).toEqual(['० सेट', '१ सेट', '२ सेट', '१.५ सेट']);
      expect(
        [0, 1, 2, 1.5].map((count) =>
          create('id')('common.setCount', { count }),
        ),
      ).toEqual(['0 set', '1 set', '2 set', '1,5 set']);
      expect(
        [0, 1, 2, 1.5].map((count) =>
          create('ko')('common.setCount', { count }),
        ),
      ).toEqual(['0세트', '1세트', '2세트', '1.5세트']);
      expect(
        [0, 1, 2, 1.5].map((count) =>
          create('ta')('common.setCount', { count }),
        ),
      ).toEqual(['௦ செட்கள்', '௧ செட்', '௨ செட்கள்', '௧.௫ செட்கள்']);
      const arabic = create('ar', {
        'common.setCount': {
          zero: 'zero {{count}}',
          one: 'one {{count}}',
          two: 'two {{count}}',
          few: 'few {{count}}',
          many: 'many {{count}}',
          other: 'other {{count}}',
        },
      });
      expect(
        [0, 1, 2, 3, 11, 1.5].map((count) =>
          arabic('common.setCount', { count }),
        ),
      ).toEqual(['zero 0', 'one 1', 'two 2', 'few 3', 'many 11', 'other 1.5']);
      const t = create('ru');
      expect(
        [0, 1, 2, 5, 11, 21, 22, 25, 1.5].map((count) =>
          t('common.setCount', { count }),
        ),
      ).toEqual([
        '0 подходов',
        '1 подход',
        '2 подхода',
        '5 подходов',
        '11 подходов',
        '21 подход',
        '22 подхода',
        '25 подходов',
        '1,5 подхода',
      ]);
    });
  } finally {
    Object.defineProperty(Intl, 'PluralRules', descriptor);
  }
});

it('resolves ordered device locales safely and respects manual choice', () => {
  expect(resolveLocale('system', ['es-ES', 'de-AT'])).toBe('es');
  expect(resolveLocale('system', ['it-IT', 'de-AT'])).toBe('it');
  expect(resolveLocale('system', ['nl-NL', 'de-AT'])).toBe('nl');
  expect(resolveLocale('system', ['da-DK', 'de-AT'])).toBe('da');
  expect(resolveLocale('system', ['da', 'de-AT'])).toBe('da');
  expect(resolveLocale('system', ['is-IS', 'de-AT'])).toBe('de');
  expect(resolveLocale('system', ['???', 'zh-CN'])).toBe('zh-Hans');
  expect(resolveLocale('system', ['zh-Hant', 'de-AT'])).toBe('zh-Hant');
  expect(resolveLocale('system', ['zh-TW', 'en-US'])).toBe('zh-Hant');
  expect(resolveLocale('system', ['zh-HK', 'en-US'])).toBe('zh-Hant');
  expect(resolveLocale('system', ['zh-MO', 'en-US'])).toBe('zh-Hant');
  expect(resolveLocale('system', ['zh-Hant-CN', 'de-AT'])).toBe('zh-Hant');
  expect(resolveLocale('zh-Hans', ['zh-Hant'])).toBe('zh-Hans');
  expect(resolveLocale('fr', ['ru-RU'])).toBe('fr');
});

it('uses Brazilian Portuguese for zero, singular and plural workout sets', () => {
  const t = createTranslator('pt-BR');
  expect([0, 1, 2].map((count) => t('common.setCount', { count }))).toEqual([
    '0 séries',
    '1 série',
    '2 séries',
  ]);
});

it('uses Italian singular and plural forms for completed sets', () => {
  const t = createTranslator('it');
  expect(t('history.completedSets', { count: 1 })).toBe('1 serie completata');
  expect(t('history.completedSets', { count: 2 })).toBe('2 serie completate');
});

it('selects Polish forms for zero, singular, few, many and fractional sets', () => {
  const t = createTranslator('pl');
  expect(
    [0, 1, 2, 5, 12, 22, 1.5].map((count) => t('common.setCount', { count })),
  ).toEqual([
    '0 serii',
    '1 seria',
    '2 serie',
    '5 serii',
    '12 serii',
    '22 serie',
    '1,5 serii',
  ]);
});

it('formats Turkish set counts and preserves interpolated names', () => {
  const t = createTranslator('tr');
  expect(
    [0, 1, 2, 1.5].map((count) => t('common.setCount', { count })),
  ).toEqual(['0 set', '1 set', '2 set', '1,5 set']);
  expect(t('common.named', { name: 'Işık İpek' })).toBe('Işık İpek');
});

it('uses Russian plural categories and preserves literal interpolation', () => {
  const t = createTranslator('ru');
  expect(
    [0, 1, 2, 5, 11, 21, 22, 25, 1.5].map((count) =>
      t('common.setCount', { count }),
    ),
  ).toEqual([
    '0 подходов',
    '1 подход',
    '2 подхода',
    '5 подходов',
    '11 подходов',
    '21 подход',
    '22 подхода',
    '25 подходов',
    '1,5 подхода',
  ]);
  expect(t('common.named', { name: '<test>{{count}}' })).toBe(
    '<test>{{count}}',
  );
});

it('falls back to English without sharing mutable locale state', () => {
  const ru = createTranslator('ru');
  const de = createTranslator('de');
  expect(de('common.retry')).toBe('Erneut versuchen');
  expect(ru('common.retry')).toBe('Повторить');
  // Empty/missing target resources use the complete English catalog.
  expect(createTranslator('fr', { 'common.retry': '' })('common.retry')).toBe(
    'Retry',
  );
});

it('reuses immutable locale translators across screen mounts while isolating overrides', () => {
  const ru = createTranslator('ru');
  expect(createTranslator('ru')).toBe(ru);
  const de = createTranslator('de');
  expect(createTranslator('de')).toBe(de);
  expect(de).not.toBe(ru);
  const custom = createTranslator('ru', { 'common.retry': 'Custom retry' });
  expect(custom('common.retry')).toBe('Custom retry');
  expect(ru('common.retry')).toBe('Повторить');
  expect(de('common.retry')).toBe('Erneut versuchen');
  expect(createTranslator('ru')).toBe(ru);
});

it('uses the Chinese other form for zero, whole and fractional counts', () => {
  const t = createTranslator('zh-Hans');
  expect(
    [0, 1, 2, 1.5].map((count) => t('common.setCount', { count })),
  ).toEqual(['0 组', '1 组', '2 组', '1.5 组']);
  expect(
    t('workout.summary', { completed: 1, count: 3, volume: '125.5' }),
  ).toBe('1/3 组 · 125.5 千克');
  expect(t('common.named', { name: '小林' })).toBe('小林');
});

it('uses Hindi count forms and preserves names and interpolated set values', () => {
  const t = createTranslator('hi');
  expect(
    [0, 1, 2, 1.5].map((count) => t('common.setCount', { count })),
  ).toEqual(['0 सेट', '1 सेट', '2 सेट', '1.5 सेट']);
  expect(t('history.completedSets', { count: 1 })).toBe('1 पूरा किया सेट');
  expect(t('history.completedSets', { count: 2 })).toBe('2 पूरे किए सेट');
  expect(
    t('workout.summary', { completed: 1, count: 3, volume: '125.5' }),
  ).toBe('1/3 सेट · 125.5 किग्रा');
  expect(t('common.named', { name: 'आदित्य' })).toBe('आदित्य');
});

it('renders Bengali count forms with native presentation digits', () => {
  const t = createTranslator('bn');
  expect(t('history.completedSets', { count: 0 })).toBe('০ সম্পন্ন সেট');
  expect(t('history.completedSets', { count: 1 })).toBe('১ সম্পন্ন সেট');
  expect(t('history.completedSets', { count: 2 })).toBe('২ সম্পন্ন সেট');
});

it('selects all six Arabic count categories and isolates mixed-direction parameters only in presentation', () => {
  const samples = { zero: 0, one: 1, two: 2, few: 3, many: 11, other: 1.5 };
  const forms = Object.fromEntries(
    Object.keys(samples).map((c) => [c, `${c}: {{count}}`]),
  );
  const custom = createTranslator('ar', { 'common.setCount': forms });
  for (const [category, count] of Object.entries(samples))
    expect(custom('common.setCount', { count })).toBe(`${category}: ${count}`);
  const t = createTranslator('ar');
  expect(t('common.setCount', { count: 2 })).toBe(
    'عدد المجموعات: \u2068٢\u2069',
  );
  const name = 'My Plan 12';
  expect(t('common.named', { name })).toBe(`\u2068${name}\u2069`);
  expect(name).toBe('My Plan 12');
});

it('uses Japanese other forms and preserves literal personal names', () => {
  const t = createTranslator('ja');
  expect(
    [0, 1, 2, 1.5].map((count) => t('common.setCount', { count })),
  ).toEqual(['0セット', '1セット', '2セット', '1.5セット']);
  expect(t('common.named', { name: 'ﾀﾅｶ Ａ１２' })).toBe('ﾀﾅｶ Ａ１２');
});

it('uses Vietnamese other forms with decimal commas while preserving personal text', () => {
  const t = createTranslator('vi');
  expect(
    [0, 1, 2, 1.5].map((count) => t('common.setCount', { count })),
  ).toEqual(['0 hiệp', '1 hiệp', '2 hiệp', '1,5 hiệp']);
  expect(t('common.named', { name: 'Đặng Thị Ánh' })).toBe('Đặng Thị Ánh');
});

it('uses Marathi one/other categories and leaves personal names unchanged', () => {
  const t = createTranslator('mr');
  expect(
    [0, 1, 2, 1.5].map((count) => t('common.setCount', { count })),
  ).toEqual(['० सेट', '१ सेट', '२ सेट', '१.५ सेट']);
  expect(t('profile.saved', { count: 1 })).toBe('1 जतन केलेले सत्र');
  expect(t('profile.saved', { count: 2 })).toBe('2 जतन केलेली सत्रे');
  expect(t('common.named', { name: 'श्रद्धा काळे' })).toBe('श्रद्धा काळे');
});

it('uses Korean other forms and preserves personal text verbatim', () => {
  const t = createTranslator('ko');
  expect(
    [0, 1, 2, 1.5].map((count) => t('common.setCount', { count })),
  ).toEqual(['0세트', '1세트', '2세트', '1.5세트']);
  const name = '김민수'.normalize('NFD');
  expect(t('common.named', { name })).toBe(name);
});

it('uses Swedish singular and plural branches for workout summaries', () => {
  const t = createTranslator('sv');
  expect(t('history.completedSets', { count: 1 })).toBe('1 slutfört set');
  expect(t('history.completedSets', { count: 8 })).toBe('8 slutförda set');
});

it('selects Bokmål singular and plural phrases', () => {
  const t = createTranslator('nb');
  expect(t('history.lastCount', { count: 1 })).toBe('Siste 1 økt');
  expect(t('history.lastCount', { count: 2 })).toBe('Siste 2 økter');
});

it('uses Finnish singular and plural forms', () => {
  const t = createTranslator('fi');
  expect(t('common.setCount', { count: 1 })).toBe('1 sarja');
  expect(t('common.setCount', { count: 2 })).toBe('2 sarjaa');
});

it('selects Danish singular and plural phrases', () => {
  const t = createTranslator('da');
  expect(t('history.lastCount', { count: 1 })).toBe('Seneste 1 træning');
  expect(t('history.lastCount', { count: 2 })).toBe('Seneste 2 træninger');
});
