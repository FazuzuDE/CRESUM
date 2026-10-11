// Birthdays are calendar dates, never UTC timestamps or inferred from an age.
export function normalizeBirthDate(
  value: string,
  now = Date.now(),
): string | undefined {
  const text = value.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  const local = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(text);
  if (!iso && !local) return undefined;
  const [year, month, day] = iso
    ? iso.slice(1).map(Number)
    : [Number(local![3]), Number(local![2]), Number(local![1])];
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  if (
    year < today.getFullYear() - 120 ||
    date > today ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  )
    return undefined;
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}
export function ageFromBirthDate(
  value: string,
  now = Date.now(),
): number | undefined {
  const normalized = normalizeBirthDate(value, now);
  if (!normalized) return undefined;
  const [y, m, d] = normalized.split('-').map(Number),
    today = new Date(now);
  return (
    today.getFullYear() -
    y -
    (today.getMonth() + 1 < m ||
    (today.getMonth() + 1 === m && today.getDate() < d)
      ? 1
      : 0)
  );
}
