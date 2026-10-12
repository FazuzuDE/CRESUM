/** Local calendar dates; never use Date's special 1900 offset for years 1–99. */
export function calendarTime(year: number, month: number, day: number) {
  const date = new Date(0);
  date.setFullYear(year, month, day);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}
const minimumDate = calendarTime(1, 0, 1);
const maximumDate = calendarTime(9999, 11, 31);
export function projectDatePicker(
  value: number,
  minimum = minimumDate,
  maximum = maximumDate,
) {
  const date = new Date(Math.min(maximum, Math.max(minimum, value)));
  const year = date.getFullYear(),
    month = date.getMonth(),
    day = date.getDate();
  const firstYear = new Date(minimum).getFullYear();
  const lastYear = new Date(maximum).getFullYear();
  return {
    columns: [
      Array.from(
        { length: new Date(calendarTime(year, month + 1, 0)).getDate() },
        (_, i) => String(i + 1),
      ),
      Array.from({ length: 12 }, (_, i) =>
        new Date(2000, i, 1).toLocaleDateString(undefined, { month: 'long' }),
      ),
      Array.from({ length: lastYear - firstYear + 1 }, (_, i) =>
        String(firstYear + i),
      ),
    ],
    selected: [day - 1, month, year - firstYear],
  };
}
export function changePickerDate(
  value: number,
  component: number,
  row: number,
  minimum = minimumDate,
  maximum = maximumDate,
) {
  const current = new Date(Math.min(maximum, Math.max(minimum, value)));
  const year =
    component === 2
      ? new Date(minimum).getFullYear() + row
      : current.getFullYear();
  const month = component === 1 ? row : current.getMonth();
  const day = component === 0 ? row + 1 : current.getDate();
  const days = new Date(calendarTime(year, month + 1, 0)).getDate();
  return Math.min(
    maximum,
    Math.max(minimum, calendarTime(year, month, Math.min(day, days))),
  );
}
export function formatPickerDate(value: number) {
  const d = new Date(value);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getFullYear()).padStart(4, '0')}`;
}
