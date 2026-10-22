import {
  normalizeDecimalInput,
  formatNumber,
  formatDate,
} from '../i18n/format';
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
