import { changePickerDate, projectDatePicker } from '../picker-date';

it('uses day/month/year order and clamps January 31 into leap February', () => {
  const date = new Date(2024, 0, 31).getTime();
  const result = changePickerDate(date, 1, 1);
  expect(new Date(result).toDateString()).toBe(
    new Date(2024, 1, 29).toDateString(),
  );
  expect(projectDatePicker(result).selected.slice(0, 2)).toEqual([28, 1]);
  expect(projectDatePicker(result).columns[0]).toHaveLength(29);
});
it('clamps leap day when changing to a non-leap year', () => {
  const value = new Date(2024, 1, 29).getTime();
  expect(new Date(changePickerDate(value, 2, 2023 - 1)).toDateString()).toBe(
    new Date(2023, 1, 28).toDateString(),
  );
});
it('supports years below 100 and clamps birthdates to today', () => {
  const d = new Date(0);
  d.setFullYear(42, 0, 2);
  d.setHours(0, 0, 0, 0);
  expect(projectDatePicker(d.getTime()).selected).toEqual([1, 0, 41]);
  const today = new Date(2026, 9, 11).getTime();
  const future = changePickerDate(today, 1, 11, undefined, today);
  expect(future).toBe(today);
});

it('projects a saved birthday in Taiwan Chinese and selects January 1 independently of locale', () => {
  const december = new Date(2026, 11, 31).getTime();
  const original = projectDatePicker(december, undefined, undefined, 'en');
  const taiwan = projectDatePicker(december, undefined, undefined, 'zh-TW');
  expect(taiwan.selected).toEqual(original.selected);
  expect(taiwan.columns[1][taiwan.selected[1]]).toBe('12月');
  const nextYear = changePickerDate(december, 2, 2027 - 1);
  const january = changePickerDate(changePickerDate(nextYear, 1, 0), 0, 0);
  expect(january).toBe(new Date(2027, 0, 1).getTime());
  const next = projectDatePicker(january, undefined, undefined, 'zh-TW');
  expect(next.selected).toEqual([0, 0, 2027 - 1]);
  expect(next.columns[1][next.selected[1]]).toBe('1月');
});
