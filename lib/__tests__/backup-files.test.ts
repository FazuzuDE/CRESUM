import { pickBackupFile, shareBackupFile } from '../backup-files';
import * as Sharing from 'expo-sharing';
import * as Picker from 'expo-document-picker';
const mockWrite = jest.fn(async () => {}),
  mockDelete = jest.fn(),
  mockText = jest.fn(async () => '{"backup":true}');
jest.mock('expo-file-system', () => ({
  Paths: { cache: 'cache' },
  File: class {
    uri = 'file:///cache/backup.json';
    size = 12;
    exists = true;
    create() {}
    write = mockWrite;
    delete = mockDelete;
    text = mockText;
  },
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => {}),
}));
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(async () => ({ canceled: true })),
}));
beforeEach(() => jest.clearAllMocks());
it('writes JSON and opens the native share sheet, cleaning only the exported cache file', async () => {
  await shareBackupFile('{"backup":true}');
  expect(mockWrite).toHaveBeenCalledWith('{"backup":true}');
  expect(Sharing.shareAsync).toHaveBeenCalledWith(
    'file:///cache/backup.json',
    expect.objectContaining({ mimeType: 'application/json' }),
  );
  expect(mockDelete).toHaveBeenCalledTimes(1);
});
it('does not claim success when native sharing fails', async () => {
  jest
    .mocked(Sharing.shareAsync)
    .mockRejectedValueOnce(Error('sharing failed'));
  await expect(shareBackupFile('{}')).rejects.toThrow('sharing failed');
  expect(mockDelete).toHaveBeenCalled();
});
it('passes the app-provided localized title to the OS without changing backup bytes', async () => {
  await shareBackupFile('{"backup":true}', 'Сохранить резервную копию CRESUM');
  expect(Sharing.shareAsync).toHaveBeenCalledWith(
    'file:///cache/backup.json',
    expect.objectContaining({
      dialogTitle: 'Сохранить резервную копию CRESUM',
    }),
  );
  expect(mockWrite).toHaveBeenCalledWith('{"backup":true}');
});
it('returns picker cancellation silently and rejects oversized files before reading', async () => {
  expect(await pickBackupFile()).toBeNull();
  jest.mocked(Picker.getDocumentAsync).mockResolvedValueOnce({
    canceled: false,
    assets: [
      {
        uri: 'file:///large.json',
        name: 'large.json',
        lastModified: 0,
        size: 30 * 1024 * 1024,
      },
    ],
  });
  await expect(pickBackupFile()).rejects.toThrow('20 MiB');
  expect(mockText).not.toHaveBeenCalled();
});
it('copies a selected native file to cache before reading its text', async () => {
  jest.mocked(Picker.getDocumentAsync).mockResolvedValueOnce({
    canceled: false,
    assets: [
      {
        uri: 'file:///valid.json',
        name: 'valid.json',
        lastModified: 0,
        size: 12,
      },
    ],
  });
  let name = '';
  expect(
    await pickBackupFile((selected) => {
      name = selected;
    }),
  ).toBe('{"backup":true}');
  expect(name).toBe('valid.json');
  expect(Picker.getDocumentAsync).toHaveBeenCalledWith(
    expect.objectContaining({ copyToCacheDirectory: true, multiple: false }),
  );
});
