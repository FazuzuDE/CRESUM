/* eslint-disable @typescript-eslint/no-require-imports -- Native file APIs load only when archive operations are used. */
import { MAX_BACKUP_BYTES } from './local-backup';
import type { ArchiveFiles } from './automatic-backup';
export const supportsAutomaticBackups = true;
export const automaticBackupFiles: ArchiveFiles = {
  async read(slot) {
    const { File, Paths } =
      require('expo-file-system') as typeof import('expo-file-system');
    const file = new File(Paths.document, `cresum-backup-${slot}.json`);
    if (!file.exists) return null;
    if (file.size > MAX_BACKUP_BYTES * 2)
      throw Error('Local backup is too large to read safely.');
    return file.text();
  },
  async write(slot, text) {
    const { File, Paths } =
      require('expo-file-system') as typeof import('expo-file-system');
    const file = new File(Paths.document, `cresum-backup-${slot}.json`);
    try {
      if (file.exists) file.delete();
      file.create();
      await file.write(text);
      if (file.size > MAX_BACKUP_BYTES * 2)
        throw Error('Local backup exceeds the size limit.');
    } catch (error) {
      if (file.exists) file.delete();
      throw error;
    }
  },
};
