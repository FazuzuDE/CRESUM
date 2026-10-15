import {
  createLocalBackup,
  parseLocalBackup,
  restoreLocalBackup,
  type BackupStorage,
  type PreparedBackup,
} from './local-backup';
import { STATE_KEY } from './workout-repository';
import type { WorkoutState } from './workout-model';
export function previewHistoryImport(
  current: WorkoutState,
  backup: PreparedBackup,
) {
  const incoming = JSON.parse(backup.values[STATE_KEY]!) as WorkoutState;
  const existing = new Set([
    ...current.history.map((w) => w.id),
    ...(current.activeWorkout ? [current.activeWorkout.id] : []),
  ]);
  const added = incoming.history.filter((w) => !existing.has(w.id)).length;
  return {
    total: incoming.history.length,
    added,
    existing: incoming.history.length - added,
  };
}
export async function importBackupHistory(
  storage: BackupStorage,
  prepared: PreparedBackup,
): Promise<number> {
  const incoming = await parseLocalBackup(prepared.text);
  const current = JSON.parse(await createLocalBackup(storage));
  const state = current.data.workouts as WorkoutState;
  if (state.activeWorkout)
    throw Error(
      'Finish or discard the active workout before importing history.',
    );
  const ids = new Set(state.history.map((w) => w.id));
  const history = (
    JSON.parse(incoming.values[STATE_KEY]!) as WorkoutState
  ).history.filter((w) => !ids.has(w.id));
  if (!history.length) return 0;
  state.history = [...state.history, ...history];
  const merged = await parseLocalBackup(JSON.stringify(current));
  await restoreLocalBackup(storage, merged);
  return history.length;
}
