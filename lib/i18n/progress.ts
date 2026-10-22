import type { AppLocale } from './registry';
import type { Translate } from './messages';
import type { ProgressPeriodId } from '../progress-periods';
import { formatDate, formatEntryNumber, formatNumber } from './format';

export const periodLabel = (t: Translate, id: ProgressPeriodId) =>
  t(`progress.period.${id}`);
export const periodDescription = (t: Translate, id: ProgressPeriodId) =>
  t(`progress.long.${id}`);

function numericText(locale: AppLocale, text: string): string {
  return text.replace(/\d+\.\d+/, (value) => formatEntryNumber(locale, value));
}
// Overview records have always used one fixed decimal, including edge values.
export const fixedEstimateNumber = (locale: AppLocale, value: number) =>
  numericText(locale, value.toFixed(1));
export function progressNumber(
  locale: AppLocale,
  value: number,
  estimate = false,
): string {
  if ((value !== 0 && Math.abs(value) < 0.05) || Math.abs(value) >= 1e12)
    return numericText(locale, String(value));
  return estimate
    ? fixedEstimateNumber(locale, value)
    : formatNumber(locale, value, { maximumFractionDigits: 12 });
}
export function volumeNumber(locale: AppLocale, value: number): string {
  return Math.abs(value) < 1e12 && Number.isInteger(value)
    ? formatNumber(locale, value, { maximumFractionDigits: 0 })
    : numericText(locale, String(value));
}
export const progressDate = (locale: AppLocale, epoch: number) =>
  formatDate(locale, epoch, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
