import { useState } from 'react';
import { AppDatePicker } from './AppDatePicker';
import { WheelPickerSheet } from './WheelPickerSheet';

/** Mount on open so Cancel/dismiss discards the entire local date draft. */
export function DatePickerSheet({
  title,
  value,
  maximum,
  minimum,
  onCancel,
  onConfirm,
  onClear,
}: {
  title: string;
  value: number;
  maximum?: number;
  minimum?: number;
  onCancel: () => void;
  onConfirm: (time: number) => void;
  onClear?: () => void;
}) {
  const [draft, setDraft] = useState(value);
  return (
    <WheelPickerSheet
      title={title}
      onCancel={onCancel}
      onConfirm={() => onConfirm(draft)}
      onClear={onClear}
    >
      <AppDatePicker
        value={draft}
        minimum={minimum}
        maximum={maximum}
        onChange={setDraft}
      />
    </WheelPickerSheet>
  );
}
