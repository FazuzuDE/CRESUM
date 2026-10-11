import { AppPicker } from './AppPicker';
import { changePickerDate, projectDatePicker } from '@/lib/picker-date';

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
  const { columns, selected } = projectDatePicker(value, minimum, maximum);
  return (
    <AppPicker
      flexible={flexible}
      columns={columns}
      selected={selected}
      labels={['Day', 'Month', 'Year']}
      onChange={(component, row) =>
        onChange(changePickerDate(value, component, row, minimum, maximum))
      }
    />
  );
}
