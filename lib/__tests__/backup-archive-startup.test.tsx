import { useBackupArchive } from '../../components/useBackupArchive';
import { automaticBackupFiles } from '../automatic-backup-files';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKUP_POLICY_KEY } from '../backup-policy';
const { act, create } = jest.requireActual('react-test-renderer');
jest.mock('../automatic-backup-files', () => ({
  supportsAutomaticBackups: true,
  automaticBackupFiles: { read: jest.fn(async () => null), write: jest.fn() },
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock',
  ),
);
it('keeps scheduling disabled until both settings and archive finish loading', async () => {
  await AsyncStorage.clear();
  await AsyncStorage.setItem(
    BACKUP_POLICY_KEY,
    JSON.stringify({ version: 1, enabled: true, frequency: 'weekly' }),
  );
  let release!: (value: null) => void;
  const waiting = new Promise<null>((resolve) => {
    release = resolve;
  });
  jest.mocked(automaticBackupFiles.read).mockImplementationOnce(() => waiting);
  let latest!: ReturnType<typeof useBackupArchive>;
  function Harness() {
    latest = useBackupArchive();
    return null;
  }
  let view: any;
  await act(async () => {
    view = create(<Harness />);
  });
  expect(latest.loaded).toBe(false);
  await act(async () => {
    release(null);
  });
  expect(latest.loaded).toBe(true);
  expect(latest.policy.enabled).toBe(true);
  act(() => view.unmount());
});
