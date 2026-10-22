import type { HistoryFilter } from '../history-filter';
import { formatDate } from './format';
import type { Translate } from './messages';
import type { AppLocale } from './registry';

export function localizedHistoryFilterLabel(
  t: Translate,
  locale: AppLocale,
  filter: HistoryFilter,
): string {
  if (filter.mode === 'count')
    return filter.count === 0
      ? t('history.allWorkouts')
      : t('history.lastCount', { count: filter.count });
  return t('history.range', {
    from: formatDate(locale, filter.from),
    to: formatDate(locale, filter.to),
  });
}
