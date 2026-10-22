import type { AppLocale } from './registry';
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
