import { AppPicker } from './AppPicker';
import { changePickerDate, projectDatePicker } from '@/lib/picker-date';
import { useLocalization } from './LocalizationProvider';

export function AppDatePicker({
  value,
  onChange,
  minimum,
  maximum,
  flexible,
}: {
  value: number;
  onChange: (time: number) => void;
  minimum?: number;
  maximum?: number;
  flexible?: boolean;
}) {
  const { t, locale } = useLocalization();
  const { columns, selected } = projectDatePicker(
    value,
    minimum,
    maximum,
    locale,
  );
  return (
    <AppPicker
      flexible={flexible}
      columns={columns}
      selected={selected}
      labels={[t('date.day'), t('date.month'), t('date.year')]}
      onChange={(component, row) =>
        onChange(changePickerDate(value, component, row, minimum, maximum))
      }
    />
  );
}
