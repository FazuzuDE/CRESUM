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
  expect(resolveLocale('system', ['es-ES', 'de-AT'])).toBe('de');
  expect(resolveLocale('system', ['???', 'zh-CN'])).toBe('en');
  expect(resolveLocale('fr', ['ru-RU'])).toBe('fr');
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
