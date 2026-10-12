import { AppPicker } from './AppPicker';
export function HistoryCountWheel({
  maximum,
  value,
  onChange,
}: {
  maximum: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <AppPicker
      flexible
      columns={[
        Array.from({ length: maximum + 1 }, (_, i) =>
          i === 0 ? 'All' : String(i),
        ),
      ]}
      selected={[Math.min(maximum, Math.max(0, value))]}
      labels={['Number of recent workouts']}
      onChange={(_, row) => onChange(row)}
    />
  );
}
