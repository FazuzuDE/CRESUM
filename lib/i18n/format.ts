import type { AppLocale } from './registry';
const decimalSeparators = new Map<AppLocale, string>();
export function formatEntryNumber(locale: AppLocale, raw: string): string {
  const normalized = normalizeDecimalInput(raw);
  if (normalized === null) return raw;
  let separator = decimalSeparators.get(locale);
  if (!separator) {
    separator =
      new Intl.NumberFormat(
        locale,
        locale === 'ar' ? { numberingSystem: 'arab' } : undefined,
      )
        .format(1.1)
        .match(/[.,\u066b]/)?.[0] ?? '.';
    decimalSeparators.set(locale, separator);
  }
  return normalized.replace('.', separator);
}
export function formatNumber(
  locale: AppLocale,
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale, {
    ...(locale === 'ar' ? { numberingSystem: 'arab' } : {}),
    ...options,
  }).format(value);
}
export function formatDate(
  locale: AppLocale,
  epochMs: number,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(locale, {
    ...(locale === 'ar' ? { numberingSystem: 'arab' } : {}),
    ...options,
  }).format(new Date(epochMs));
}
export function normalizeDecimalInput(raw: string): string | null {
  const value = normalizeInputDigits(raw).trim();
  return /^\d+(?:[.,]\d+)?$/.test(value) ? value.replace(',', '.') : null;
}

// Normalize editable digits without parsing or rounding an unfinished draft.
export function normalizeInputDigits(raw: string): string {
  return raw
    .replace(/[\u09e6-\u09ef]/g, (digit) =>
      String(digit.charCodeAt(0) - 0x09e6),
    )
    .replace(/[\u0966-\u096f]/g, (digit) =>
      String(digit.charCodeAt(0) - 0x0966),
    )
    .replace(/[\uff10-\uff19]/g, (digit) =>
      String(digit.charCodeAt(0) - 0xff10),
    )
    .replace(/\uff0e/g, '.')
    .replace(/\uff0c/g, ',')
    .replace(/[\u0660-\u0669\u06f0-\u06f9]/g, (digit) =>
      String(
        digit.charCodeAt(0) - (digit.charCodeAt(0) >= 0x06f0 ? 0x06f0 : 0x0660),
      ),
    )
    .replace(/\u066b/g, '.');
}
