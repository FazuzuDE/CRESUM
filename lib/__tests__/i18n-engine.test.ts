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
  expect(resolveLocale('system', ['nl-NL', 'de-AT'])).toBe('de');
  expect(resolveLocale('system', ['???', 'zh-CN'])).toBe('zh-Hans');
  expect(resolveLocale('system', ['zh-Hant', 'de-AT'])).toBe('de');
  expect(resolveLocale('system', ['zh-TW', 'en-US'])).toBe('en');
  expect(resolveLocale('system', ['zh-HK', 'en-US'])).toBe('en');
  expect(resolveLocale('system', ['zh-MO', 'en-US'])).toBe('en');
  expect(resolveLocale('system', ['zh-Hant-CN', 'de-AT'])).toBe('de');
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
