import {
  filterHistory,
  defaultHistoryFilter,
  validHistoryRange,
} from '../history-filter';
import type { WorkoutSession } from '../workout-model';
const saved = (id: string, finishedAt: number): WorkoutSession => ({
  id,
  name: id,
  templateId: id,
  startedAt: finishedAt - 1000,
  finishedAt,
  exercises: [],
  currentExerciseIndex: 0,
  restDurationSeconds: 90,
});
const ids = (items: readonly WorkoutSession[]) => items.map((x) => x.id);
it('defaults to three newest snapshots and All retains the complete archive without mutation', () => {
  const history = [saved('1', 1), saved('4', 4), saved('2', 2), saved('3', 3)];
  const original = history.slice();
  const filter = defaultHistoryFilter(new Date(2026, 9, 10).getTime());
  expect(filter.mode).toBe('count');
  expect(filter.count).toBe(3);
  expect(ids(filterHistory(history, filter))).toEqual(['4', '3', '2']);
  expect(ids(filterHistory(history, { ...filter, count: 0 }))).toEqual([
    '4',
    '3',
    '2',
    '1',
  ]);
  expect(history).toEqual(original);
  expect(filterHistory(history, { ...filter, count: 1 })[0]).toBe(history[1]);
});
it('defaults to seven whole local dates, inclusive at both ends', () => {
  const filter = {
    ...defaultHistoryFilter(new Date(2026, 9, 10, 15).getTime()),
    mode: 'range' as const,
  };
  expect(filter.from).toBe(new Date(2026, 9, 4).getTime());
  expect(filter.to).toBe(new Date(2026, 9, 10).getTime());
  const times = [
    new Date(2026, 9, 3, 23, 59, 59, 999),
    new Date(2026, 9, 4),
    new Date(2026, 9, 10, 23, 59, 59, 999),
    new Date(2026, 9, 11),
  ];
  expect(
    ids(
      filterHistory(
        times.map((d, i) => saved(String(i), d.getTime())),
        filter,
      ),
    ),
  ).toEqual(['2', '1']);
});
it('rejects reversed or invalid ranges and supports a single day and an empty archive', () => {
  const filter = defaultHistoryFilter(new Date(2026, 9, 10).getTime());
  expect(validHistoryRange({ ...filter, from: filter.to + 86400000 })).toBe(
    false,
  );
  expect(validHistoryRange({ ...filter, from: NaN })).toBe(false);
  expect(validHistoryRange({ ...filter, from: filter.to })).toBe(true);
  expect(filterHistory([], filter)).toEqual([]);
  expect(
    filterHistory([saved('one', filter.to)], {
      ...filter,
      mode: 'range',
      from: filter.to,
    }),
  ).toHaveLength(1);
});
