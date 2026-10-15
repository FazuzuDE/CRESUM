import { previewHistoryImport, importBackupHistory } from '../history-import';
import { createLocalBackup, parseLocalBackup } from '../local-backup';
import { emptyWorkoutState, STATE_KEY } from '../workout-repository';
import { startWorkout, finishWorkout } from '../workout-engine';
import { defaultTemplates, exerciseLibrary } from '../workout-catalog';
function saved(id: string) {
  const w = startWorkout(defaultTemplates[0], exerciseLibrary, 100);
  w.id = id;
  w.exercises[0].sets[0] = {
    ...w.exercises[0].sets[0],
    weight: '60',
    completedAt: 110,
  };
  return finishWorkout(w, 120);
}
const storage = (history = [saved('a')]) => {
  const values = new Map([
    [STATE_KEY, JSON.stringify({ ...emptyWorkoutState(), history })],
    ['unrelated', 'safe'],
  ]);
  return {
    values,
    getItem: async (k: string) => values.get(k) ?? null,
    setItem: async (k: string, v: string) => {
      values.set(k, v);
    },
    removeItem: async (k: string) => {
      values.delete(k);
    },
  };
};
it('previews and appends only new completed workouts, preserving existing snapshots and sidecars', async () => {
  const source = storage([saved('a'), saved('b')]),
    current = storage();
  const before = JSON.parse(current.values.get(STATE_KEY)!).history[0];
  const backup = await parseLocalBackup(await createLocalBackup(source));
  expect(
    previewHistoryImport(JSON.parse(current.values.get(STATE_KEY)!), backup),
  ).toEqual({ total: 2, added: 1, existing: 1 });
  expect(await importBackupHistory(current, backup)).toBe(1);
  const result = JSON.parse(current.values.get(STATE_KEY)!);
  expect(result.history.map((w: { id: string }) => w.id)).toEqual(['a', 'b']);
  expect(result.history[0]).toEqual(before);
  expect(await importBackupHistory(current, backup)).toBe(0);
  expect(current.values.get('unrelated')).toBe('safe');
});
it('does not overwrite an active session during history import', async () => {
  const s = storage();
  const backup = await parseLocalBackup(await createLocalBackup(s));
  const before = JSON.parse(s.values.get(STATE_KEY)!);
  before.activeWorkout = startWorkout(
    defaultTemplates[0],
    exerciseLibrary,
    100,
  );
  s.values.set(STATE_KEY, JSON.stringify(before));
  await expect(importBackupHistory(s, backup)).rejects.toThrow(
    'active workout',
  );
  expect(JSON.parse(s.values.get(STATE_KEY)!)).toEqual(before);
});
