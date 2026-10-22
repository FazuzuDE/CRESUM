import { AppError } from './app-error';
import { BodyWeightRepository, BODY_WEIGHT_KEY } from './body-weight';
import { HIDDEN_BUILT_INS_KEY } from './hidden-builtins';
import { LOCAL_DATA_KEYS } from './local-data-reset';
import { OnboardingRepository, ONBOARDING_KEY } from './onboarding-repository';
import { ProgramRepository, PROGRAM_KEY } from './training-programs/repository';
import { STATE_KEY, WorkoutRepository } from './workout-repository';
import { defaultTemplates } from './workout-catalog';

export const RESTORE_JOURNAL_KEY = 'cresum_restore_journal_v1';
export const MAX_BACKUP_CHARACTERS = 10_000_000;
export const MAX_BACKUP_BYTES = 20 * 1024 * 1024;
export type BackupStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<unknown>;
  removeItem(key: string): Promise<unknown>;
};
type Values = Record<string, string | null>;
const documents = {
  workouts: STATE_KEY,
  onboarding: ONBOARDING_KEY,
  program: PROGRAM_KEY,
  bodyWeight: BODY_WEIGHT_KEY,
  hiddenBuiltIns: HIDDEN_BUILT_INS_KEY,
} as const;
export type PreparedBackup = {
  readonly text: string;
  readonly summary: {
    createdAt: number;
    workouts: number;
    routines: number;
    measurements: number;
    activeWorkout: boolean;
  };
  readonly values: Values;
};
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const invalid = () =>
  new AppError(
    'backup_invalid',
    'This is not a valid CRESUM backup. No local data was changed.',
  );
const pending = new WeakSet<object>();
async function readValues(storage: BackupStorage): Promise<Values> {
  return Object.fromEntries(
    await Promise.all(
      LOCAL_DATA_KEYS.map(async (key) => [key, await storage.getItem(key)]),
    ),
  );
}
function memory(values: Values) {
  const snapshot = { ...values };
  return {
    getItem: async (key: string) => snapshot[key] ?? null,
    setItem: async (key: string, value: string) => {
      snapshot[key] = value;
    },
  };
}
function unique(ids: string[]) {
  if (new Set(ids).size !== ids.length) throw invalid();
}
async function validate(values: Values) {
  const reader = memory(values);
  const workouts = await new WorkoutRepository(reader).load();
  unique(workouts.templates.map((t) => t.id));
  unique([
    ...workouts.history.map((w) => w.id),
    ...(workouts.activeWorkout ? [workouts.activeWorkout.id] : []),
  ]);
  for (const w of [
    ...workouts.history,
    ...(workouts.activeWorkout ? [workouts.activeWorkout] : []),
  ]) {
    unique(w.exercises.map((e) => e.id));
    for (const e of w.exercises) unique(e.sets.map((s) => s.id));
  }
  await new OnboardingRepository(reader).load();
  await new ProgramRepository(reader).load();
  const measurements = await new BodyWeightRepository(reader).load();
  if (values[HIDDEN_BUILT_INS_KEY] !== null) {
    const hidden = JSON.parse(values[HIDDEN_BUILT_INS_KEY]!);
    if (
      !object(hidden) ||
      hidden.version !== 1 ||
      !Array.isArray(hidden.ids) ||
      hidden.ids.some(
        (id) =>
          typeof id !== 'string' || !defaultTemplates.some((t) => t.id === id),
      )
    )
      throw invalid();
    unique(hidden.ids);
  }
  return { workouts, measurements };
}
export async function parseLocalBackup(text: string): Promise<PreparedBackup> {
  try {
    if (text.length > MAX_BACKUP_CHARACTERS) throw invalid();
    const envelope = JSON.parse(text);
    if (
      !object(envelope) ||
      envelope.format !== 'cresum-local-backup' ||
      envelope.version !== 1 ||
      typeof envelope.createdAt !== 'number' ||
      !Number.isFinite(envelope.createdAt) ||
      envelope.createdAt < 0 ||
      !Number.isFinite(new Date(envelope.createdAt).getTime()) ||
      !object(envelope.data)
    )
      throw invalid();
    const data = envelope.data;
    if (
      Object.keys(data).length !== Object.keys(documents).length ||
      !object(data.workouts)
    )
      throw invalid();
    const values: Values = Object.fromEntries(
      LOCAL_DATA_KEYS.map((k) => [k, null]),
    );
    for (const [name, key] of Object.entries(documents)) {
      if (
        !Object.hasOwn(data, name) ||
        (data[name] !== null && !object(data[name]))
      )
        throw invalid();
      values[key] = data[name] === null ? null : JSON.stringify(data[name]);
    }
    const { workouts, measurements } = await validate(values);
    return {
      text,
      values,
      summary: {
        createdAt: envelope.createdAt,
        workouts: workouts.history.length,
        routines: workouts.templates.length,
        measurements: measurements.length,
        activeWorkout: !!workouts.activeWorkout,
      },
    };
  } catch {
    throw invalid();
  }
}
export async function createLocalBackup(
  storage: BackupStorage,
  now = Date.now(),
): Promise<string> {
  if ((await storage.getItem(RESTORE_JOURNAL_KEY)) !== null)
    throw new AppError(
      'backup_pending',
      'Finish local data recovery before exporting.',
    );
  const values = await readValues(storage);
  const { workouts } = await validate(values);
  const data = Object.fromEntries(
    Object.entries(documents).map(([name, key]) => [
      name,
      name === 'workouts'
        ? workouts
        : values[key] === null
          ? null
          : JSON.parse(values[key]!),
    ]),
  );
  const text = JSON.stringify({
    format: 'cresum-local-backup',
    version: 1,
    createdAt: now,
    data,
  });
  await parseLocalBackup(text);
  return text;
}
async function writeValues(storage: BackupStorage, values: Values) {
  for (const key of LOCAL_DATA_KEYS) {
    if (values[key] === null) await storage.removeItem(key);
    else await storage.setItem(key, values[key]);
  }
  const actual = await readValues(storage);
  if (LOCAL_DATA_KEYS.some((k) => actual[k] !== values[k]))
    throw Error('Local data verification failed.');
}
async function clearJournal(storage: BackupStorage) {
  await storage.removeItem(RESTORE_JOURNAL_KEY);
  if ((await storage.getItem(RESTORE_JOURNAL_KEY)) !== null)
    throw Error('Restore journal is still present.');
}
async function performRecovery(storage: BackupStorage): Promise<void> {
  try {
    const raw = await storage.getItem(RESTORE_JOURNAL_KEY);
    if (raw === null) return;
    const journal = JSON.parse(raw);
    const before = object(journal) ? journal.before : undefined;
    if (
      !object(journal) ||
      journal.version !== 1 ||
      !object(before) ||
      Object.keys(before).length !== LOCAL_DATA_KEYS.length ||
      LOCAL_DATA_KEYS.some(
        (k) =>
          !Object.hasOwn(before as object, k) ||
          ((before as Values)[k] !== null &&
            typeof (before as Values)[k] !== 'string'),
      )
    )
      throw Error();
    await writeValues(storage, before as Values);
    await clearJournal(storage);
  } catch {
    throw new AppError(
      'local_recovery',
      'Local data recovery is incomplete. Keep the app open and retry recovery before continuing.',
    );
  }
}
export async function restoreLocalBackup(
  storage: BackupStorage,
  prepared: PreparedBackup,
): Promise<void> {
  if (pending.has(storage))
    throw new AppError('backup_busy', 'A restore is already in progress.');
  pending.add(storage);
  try {
    if ((await storage.getItem(RESTORE_JOURNAL_KEY)) !== null)
      throw new AppError(
        'backup_pending',
        'Finish local data recovery before restoring.',
      );
    const checked = await parseLocalBackup(prepared.text);
    const before = await readValues(storage);
    if ((await new WorkoutRepository(memory(before)).load()).activeWorkout)
      throw new AppError(
        'backup_active',
        'Finish or discard the active workout before restoring a backup.',
      );
    const journal = JSON.stringify({ version: 1, before });
    try {
      await storage.setItem(RESTORE_JOURNAL_KEY, journal);
      if ((await storage.getItem(RESTORE_JOURNAL_KEY)) !== journal)
        throw Error('Journal could not be verified.');
      await writeValues(storage, checked.values);
      await clearJournal(storage);
    } catch {
      // A successful journal deletion is the commit point, even if its promise rejected.
      if ((await storage.getItem(RESTORE_JOURNAL_KEY)) === null) {
        const actual = await readValues(storage);
        if (LOCAL_DATA_KEYS.every((k) => actual[k] === checked.values[k]))
          return;
      }
      await recoverLocalRestore(storage);
      throw new AppError(
        'backup_restore',
        'Backup could not be restored. Your previous local data was restored; try again.',
      );
    }
  } finally {
    pending.delete(storage);
  }
}

const recoveries = new WeakMap<object, Promise<void>>();
export function recoverLocalRestore(storage: BackupStorage): Promise<void> {
  const previous = recoveries.get(storage);
  if (previous) return previous;
  const work = performRecovery(storage).finally(() => {
    if (recoveries.get(storage) === work) recoveries.delete(storage);
  });
  recoveries.set(storage, work);
  return work;
}
