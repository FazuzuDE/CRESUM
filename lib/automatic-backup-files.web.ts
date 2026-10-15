import type { ArchiveFiles } from './automatic-backup';
export const supportsAutomaticBackups = false;
export const automaticBackupFiles: ArchiveFiles = {
  read: async () => null,
  write: async () => {
    throw Error(
      'Automatic file copies are available in the iOS and Android app.',
    );
  },
};
