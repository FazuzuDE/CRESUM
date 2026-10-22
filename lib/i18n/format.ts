import type { AppLocale } from './registry';
const decimalSeparators = new Map<AppLocale, string>();
export function formatEntryNumber(locale: AppLocale, raw: string): string {
  const normalized = normalizeDecimalInput(raw);
  if (normalized === null) return raw;
  let separator = decimalSeparators.get(locale);
  if (!separator) {
    separator =
      new Intl.NumberFormat(locale)
        .formatToParts(1.1)
        .find((part) => part.type === 'decimal')?.value ?? '.';
    decimalSeparators.set(locale, separator);
  }
  return normalized.replace('.', separator);
}
export function formatNumber(
  locale: AppLocale,
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}
export function formatDate(
  locale: AppLocale,
  epochMs: number,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(locale, options).format(new Date(epochMs));
}
export function normalizeDecimalInput(raw: string): string | null {
  const value = raw.trim();
  return /^\d+(?:[.,]\d+)?$/.test(value) ? value.replace(',', '.') : null;
}
