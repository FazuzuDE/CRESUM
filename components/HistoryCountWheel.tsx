import { AppPicker } from './AppPicker';
import { useLocalization } from './LocalizationProvider';
import { formatNumber } from '@/lib/i18n/format';
export function HistoryCountWheel({
  maximum,
  value,
  onChange,
}: {
  maximum: number;
  value: number;
  onChange: (value: number) => void;
}) {
  const { t, locale } = useLocalization();
  return (
    <AppPicker
      flexible
      columns={[
        Array.from({ length: maximum + 1 }, (_, i) =>
          i === 0
            ? t('filter.all')
            : formatNumber(locale, i, { useGrouping: false }),
        ),
      ]}
      selected={[Math.min(maximum, Math.max(0, value))]}
      labels={[t('filter.countLabel')]}
      onChange={(_, row) => onChange(row)}
    />
  );
}
