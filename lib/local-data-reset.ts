import { BACKUP_POLICY_KEY } from './backup-policy';
import { SYNC_METADATA_KEY } from './sync/storage';
import { PROGRAM_KEY } from './training-programs/repository';
import { BODY_WEIGHT_KEY } from './body-weight';
import { HIDDEN_BUILT_INS_KEY } from './hidden-builtins';
import { ONBOARDING_KEY } from './onboarding-repository';
import { LEGACY_KEYS, STATE_KEY } from './workout-repository';
import { LANGUAGE_PREFERENCE_KEY } from './i18n/preference-store';

// Remove the canonical workout document last. If interrupted earlier, it still
// protects the existing workouts from legacy re-import or first-run gating.
export const LOCAL_DATA_KEYS = [
  BODY_WEIGHT_KEY,
  ONBOARDING_KEY,
  PROGRAM_KEY,
  HIDDEN_BUILT_INS_KEY,
  ...LEGACY_KEYS,
  STATE_KEY,
] as const;

const RESET_DATA_KEYS = [
  LANGUAGE_PREFERENCE_KEY,
  SYNC_METADATA_KEY,
  BACKUP_POLICY_KEY,
  ...LOCAL_DATA_KEYS,
] as const;

type Storage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<unknown>;
  removeItem(key: string): Promise<unknown>;
};

export class LocalDataResetError extends Error {
  constructor(readonly recoveryIncomplete: boolean) {
    super(
      recoveryIncomplete
        ? 'Local data could not be reset, and recovery was incomplete. Keep the app open and try again.'
        : 'Local data could not be reset. Your saved data was restored; try again.',
    );
  }
}

export async function resetLocalData(
  storage: Storage,
  waitForPendingWrites: () => Promise<void>,
): Promise<void> {
  let backup: (readonly [string, string | null])[];
  try {
    await waitForPendingWrites();
    backup = await Promise.all(
      RESET_DATA_KEYS.map(
        async (key) => [key, await storage.getItem(key)] as const,
      ),
    );
  } catch {
    throw new Error(
      'Local data could not be reset. No data was removed; try again.',
    );
  }

  try {
    for (const key of RESET_DATA_KEYS) await storage.removeItem(key);
    const remaining = await Promise.all(
      RESET_DATA_KEYS.map((key) => storage.getItem(key)),
    );
    if (remaining.some((value) => value !== null))
      throw new Error('One or more local data keys remain.');
  } catch {
    const restores = await Promise.allSettled(
      backup.map(([key, value]) =>
        value === null ? storage.removeItem(key) : storage.setItem(key, value),
      ),
    );
    let recovered = restores.every((result) => result.status === 'fulfilled');
    if (recovered) {
      try {
        const readback = await Promise.all(
          backup.map(([key]) => storage.getItem(key)),
        );
        recovered = backup.every(
          ([, value], index) => readback[index] === value,
        );
      } catch {
        recovered = false;
      }
    }
    throw new LocalDataResetError(!recovered);
  }
}
