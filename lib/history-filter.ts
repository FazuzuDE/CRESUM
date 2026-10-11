import { newestFirstHistory } from './workout-history';
import type { WorkoutSession } from './workout-model';

export type HistoryFilter = {
  mode: 'count' | 'range';
  count: number;
  from: number;
  to: number;
};
export const localDay = (time: number): number => {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};
export const defaultHistoryFilter = (now: number): HistoryFilter => {
  const from = new Date(localDay(now));
  from.setDate(from.getDate() - 6);
  return { mode: 'count', count: 3, from: from.getTime(), to: localDay(now) };
};
export const validHistoryRange = (filter: HistoryFilter): boolean =>
  Number.isFinite(filter.from) &&
  Number.isFinite(filter.to) &&
  localDay(filter.from) <= localDay(filter.to);
export const filterHistory = (
  history: readonly WorkoutSession[],
  filter: HistoryFilter,
): WorkoutSession[] => {
  const ordered = newestFirstHistory(history);
  if (filter.mode === 'count')
    return filter.count === 0
      ? ordered
      : ordered.slice(0, Math.max(1, Math.floor(filter.count)));
  if (!validHistoryRange(filter)) return [];
  const from = localDay(filter.from);
  const end = new Date(localDay(filter.to));
  end.setDate(end.getDate() + 1);
  return ordered.filter((workout) => {
    const completed = workout.finishedAt ?? workout.startedAt;
    return completed >= from && completed < end.getTime();
  });
};
export const historyFilterLabel = (filter: HistoryFilter): string =>
  filter.mode === 'count'
    ? filter.count === 0
      ? 'All workouts'
      : `Last ${filter.count} workouts`
    : `${new Date(filter.from).toLocaleDateString()} – ${new Date(filter.to).toLocaleDateString()}`;
