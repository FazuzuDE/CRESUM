import { parseLocalBackup, type PreparedBackup } from './local-backup';
import { STATE_KEY } from './workout-repository';
import type { WorkoutState } from './workout-model';
export type ArchiveSlot = 'a' | 'b';
export type AutomaticBackup = {
  slot: ArchiveSlot;
  sequence: number;
  backup: PreparedBackup;
  createdAt: number;
  workoutIds: string[];
};
export type ArchiveFiles = {
  read(slot: ArchiveSlot): Promise<string | null>;
  write(slot: ArchiveSlot, text: string): Promise<void>;
};
export class AutomaticBackupRepository {
  private pending: Promise<unknown> = Promise.resolve();
  constructor(private files: ArchiveFiles) {}
  private run<T>(work: () => Promise<T>): Promise<T> {
    const result = this.pending.catch(() => {}).then(work);
    this.pending = result;
    return result;
  }
  private async read(strict = false): Promise<AutomaticBackup | undefined> {
    const copies: AutomaticBackup[] = [];
    let readError: unknown;
    for (const slot of ['a', 'b'] as const) {
      let raw: string | null;
      try {
        raw = await this.files.read(slot);
      } catch (error) {
        readError = error;
        continue;
      }
      if (raw === null) continue;
      try {
        const value = JSON.parse(raw);
        if (
          value.version !== 1 ||
          !Number.isSafeInteger(value.sequence) ||
          value.sequence <= 0 ||
          typeof value.text !== 'string'
        )
          continue;
        const backup = await parseLocalBackup(value.text);
        const state = JSON.parse(backup.values[STATE_KEY]!) as WorkoutState;
        copies.push({
          slot,
          sequence: value.sequence,
          backup,
          createdAt: backup.summary.createdAt,
          workoutIds: state.history.map((w) => w.id),
        });
      } catch {
        /* An interrupted new slot never invalidates the other verified copy. */
      }
    }
    // Reading may recover the healthy alternate. Saving must not overwrite an
    // unreadable slot that could contain the newest copy.
    if (readError && (strict || !copies.length)) throw readError;
    return copies.sort((a, b) => b.sequence - a.sequence)[0];
  }
  load() {
    return this.run(() => this.read());
  }
  save(text: string): Promise<AutomaticBackup> {
    return this.run(async () => {
      await parseLocalBackup(text);
      const previous = await this.read(true);
      const sequence = (previous?.sequence ?? 0) + 1;
      if (!Number.isSafeInteger(sequence))
        throw Error(
          'Backup archive needs attention. Export your data before continuing.',
        );
      const slot = previous?.slot === 'a' ? 'b' : 'a';
      const value = JSON.stringify({ version: 1, sequence, text });
      await this.files.write(slot, value);
      if ((await this.files.read(slot)) !== value)
        throw Error(
          'The backup file could not be verified. Previous copy was kept.',
        );
      const saved = await this.read();
      if (!saved || saved.sequence !== sequence)
        throw Error('Backup could not be verified.');
      return saved;
    });
  }
}
