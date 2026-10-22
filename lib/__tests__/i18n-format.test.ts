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
  for (const locale of ['en', 'ru', 'de', 'fr'] as const) {
    expect(formatEntryNumber(locale, '12.1234567890123456789')).toBe(
      locale === 'en' ? '12.1234567890123456789' : '12,1234567890123456789',
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
