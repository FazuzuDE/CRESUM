import {
  normalizeDecimalInput,
  formatNumber,
  formatDate,
  formatEntryNumber,
} from '../i18n/format';
it('localizes exact entry display without rounding manual precision or reparsing drafts', () => {
  expect(formatEntryNumber('ru', '82.1255')).toBe('82,1255');
  expect(formatEntryNumber('de', '1000.25')).toBe('1000,25');
  expect(formatEntryNumber('fr', '12,')).toBe('12,');
  expect(formatEntryNumber('en', 'bad')).toBe('bad');
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
  ] as const) {
    expect(formatEntryNumber(locale, '12.1234567890123456789')).toBe(
      locale === 'en' || locale === 'zh-Hans'
        ? '12.1234567890123456789'
        : '12,1234567890123456789',
    );
  }
});
it('normalizes one decimal separator without accepting grouping or ambiguous input', () => {
  expect(['12,50', '12.50', '1,234', ' 0 '].map(normalizeDecimalInput)).toEqual(
    ['12.50', '12.50', '1.234', '0'],
  );
  expect(
    ['1,234.5', '1 234', '1e3', 'Infinity', '12,', '-1', ''].map(
      normalizeDecimalInput,
    ),
  ).toEqual(Array(7).fill(null));
});
it('formats presentation with explicit locale without altering values or epochs', () => {
  expect(formatNumber('de', 12.5)).toBe('12,5');
  expect(formatNumber('ru', 12.5)).toBe('12,5');
  const epoch = Date.UTC(2026, 9, 22);
  expect(
    formatDate('de', epoch, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC',
    }),
  ).toBe('22.10.2026');
  expect(epoch).toBe(Date.UTC(2026, 9, 22));
});

it('preserves localized entry precision when the runtime lacks formatToParts', () => {
  const proto = Intl.NumberFormat.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(proto, 'formatToParts')!;
  Object.defineProperty(proto, 'formatToParts', {
    ...descriptor,
    value: undefined,
  });
  try {
    jest.isolateModules(() => {
      const { formatEntryNumber } = jest.requireActual('../i18n/format');
      expect(formatEntryNumber('ru', '82.12550')).toBe('82,12550');
      expect(formatEntryNumber('uk', '010.0400')).toBe('010,0400');
      expect(formatEntryNumber('en', '82,12550')).toBe('82.12550');
    });
  } finally {
    Object.defineProperty(proto, 'formatToParts', descriptor);
  }
});

it('formats Chinese dates and numbers without changing stored entry precision', () => {
  expect(formatNumber('zh-Hans', 12.5)).toBe('12.5');
  expect(
    formatDate('zh-Hans', Date.UTC(2026, 10, 17), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }),
  ).toBe('2026年11月17日');
});
