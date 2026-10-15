/* eslint-disable @typescript-eslint/no-require-imports -- Native APIs are loaded only on file actions; web uses a separate adapter. */
import { MAX_BACKUP_BYTES } from './local-backup';

export async function shareBackupFile(text: string): Promise<void> {
  const Sharing = require('expo-sharing') as typeof import('expo-sharing');
  if (!(await Sharing.isAvailableAsync()))
    throw Error('File sharing is unavailable on this device.');
  const { File, Paths } =
    require('expo-file-system') as typeof import('expo-file-system');
  const file = new File(
    Paths.cache,
    `cresum-backup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`,
  );
  try {
    file.create();
    await file.write(text);
    if (file.size > MAX_BACKUP_BYTES)
      throw Error('Backup exceeds the 20 MiB file limit.');
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      UTI: 'public.json',
      dialogTitle: 'Save CRESUM backup',
    });
  } finally {
    if (file.exists) file.delete();
  }
}
export async function pickBackupFile(
  onName?: (name: string) => void,
): Promise<string | null> {
  const { getDocumentAsync } =
    require('expo-document-picker') as typeof import('expo-document-picker');
  const result = await getDocumentAsync({
    type: ['application/json', 'text/plain'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (asset.size !== undefined && asset.size > MAX_BACKUP_BYTES)
    throw Error('Choose a backup smaller than 20 MiB.');
  const { File } =
    require('expo-file-system') as typeof import('expo-file-system');
  const file = new File(asset.uri);
  if (file.size > MAX_BACKUP_BYTES)
    throw Error('Choose a backup smaller than 20 MiB.');
  onName?.(asset.name);
  return file.text();
}
