import type { KeyValueStorage } from './workout-repository';
export const BACKUP_POLICY_KEY = 'cresum_backup_policy_v1';
export type BackupFrequency = 'workout' | 'weekly' | 'monthly';
export type BackupPolicy = {
  version: 1;
  enabled: boolean;
  frequency: BackupFrequency;
};
export const defaultBackupPolicy: BackupPolicy = {
  version: 1,
  enabled: false,
  frequency: 'workout',
};
export function nextBackupDate(
  last: number,
  frequency: BackupFrequency,
): number {
  const date = new Date(last);
  if (frequency === 'monthly') {
    const day = date.getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() + 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    date.setDate(Math.min(day, end));
  } else date.setDate(date.getDate() + 7);
  return date.getTime();
}
export function automaticBackupDue(
  policy: BackupPolicy,
  last: { createdAt: number; workoutIds: readonly string[] } | undefined,
  ids: readonly string[],
  now: number,
): boolean {
  if (!policy.enabled || !ids.length || !Number.isFinite(now)) return false;
  if (!last) return true;
  if (policy.frequency === 'workout') {
    const saved = new Set(last.workoutIds);
    return ids.some((id) => !saved.has(id));
  }
  return now >= nextBackupDate(last.createdAt, policy.frequency);
}
export class BackupPolicyRepository {
  private pending: Promise<unknown> = Promise.resolve();
  constructor(private storage: KeyValueStorage) {}
  async load(): Promise<BackupPolicy> {
    await this.pending.catch(() => {});
    const raw = await this.storage.getItem(BACKUP_POLICY_KEY);
    if (raw === null) return { ...defaultBackupPolicy };
    const value = JSON.parse(raw);
    if (
      value.version !== 1 ||
      typeof value.enabled !== 'boolean' ||
      !['workout', 'weekly', 'monthly'].includes(value.frequency)
    )
      throw Error(
        'Backup settings could not be read. Retry before changing them.',
      );
    return value;
  }
  save(policy: BackupPolicy): Promise<void> {
    const work = this.pending
      .catch(() => {})
      .then(async () => {
        if (
          policy.version !== 1 ||
          typeof policy.enabled !== 'boolean' ||
          !['workout', 'weekly', 'monthly'].includes(policy.frequency)
        )
          throw Error('Invalid backup settings.');
        await this.storage.setItem(BACKUP_POLICY_KEY, JSON.stringify(policy));
      });
    this.pending = work;
    return work;
  }
  async waitForPendingWrites() {
    await this.pending.catch(() => {});
  }
}
