import { AppError } from './app-error';
import { getDocumentAsync } from 'expo-document-picker';
import { MAX_BACKUP_BYTES } from './local-backup';
export async function shareBackupFile(
  text: string,
  _dialogTitle?: string,
): Promise<void> {
  const blob = new Blob([text], { type: 'application/json' });
  if (blob.size > MAX_BACKUP_BYTES)
    throw new AppError(
      'backup_too_large',
      'Backup exceeds the 20 MiB file limit.',
    );
  const url = URL.createObjectURL(blob),
    link = document.createElement('a');
  link.href = url;
  link.download = `cresum-backup-${Date.now()}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function pickBackupFile(
  onName?: (name: string) => void,
): Promise<string | null> {
  const result = await getDocumentAsync({
    type: ['application/json', 'text/plain'],
    multiple: false,
    base64: false,
  });
  if (result.canceled) return null;
  const file = result.assets[0].file;
  if (!file)
    throw new AppError('backup_read', 'The selected file could not be read.');
  if (file.size > MAX_BACKUP_BYTES)
    throw new AppError(
      'backup_too_large',
      'Choose a backup smaller than 20 MiB.',
    );
  onName?.(file.name);
  return file.text();
}
