import App from '../../app/index';
import { ProfileSettings } from '../../components/ProfileSettings';
import { Onboarding } from '../../components/Onboarding';
import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { completeOnboardingForTest } from './onboarding-fixture';
import {
  createLocalBackup,
  parseLocalBackup,
  RESTORE_JOURNAL_KEY,
} from '../local-backup';
import { ONBOARDING_KEY } from '../onboarding-repository';
import { shareBackupFile } from '../backup-files';
const { act, create } = jest.requireActual('react-test-renderer');
jest.mock('../backup-files', () => ({
  shareBackupFile: jest.fn(async () => {}),
  pickBackupFile: jest.fn(),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));
jest.mock('expo-blur', () => ({
  BlurView: jest.requireActual('react-native').View,
}));
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(async () => {}),
  NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock',
  ),
);
beforeEach(async () => {
  await AsyncStorage.clear();
  await completeOnboardingForTest();
});
it('exports a validated file through actual App/Profile without changing saved data', async () => {
  let view: any;
  await act(async () => {
    view = create(<App />);
  });
  const before = await AsyncStorage.getItem('fitflow_state_v1');
  await act(async () => {
    view.root.findByType(ProfileSettings).props.backup.onExport();
  });
  const mock = jest.mocked(shareBackupFile);
  expect(mock).toHaveBeenCalled();
  expect(
    (await parseLocalBackup(mock.mock.calls.at(-1)![0])).summary.routines,
  ).toBe(3);
  expect(await AsyncStorage.getItem('fitflow_state_v1')).toBe(before);
  act(() => view.unmount());
});
it('does not replace data when personalization fails while waiting for pending writes', async () => {
  let view: any;
  await act(async () => {
    view = create(<App />);
  });
  const backup = await parseLocalBackup(await createLocalBackup(AsyncStorage));
  const setter = jest.mocked(AsyncStorage.setItem);
  const original = setter.getMockImplementation()!;
  let reject!: (reason: Error) => void;
  const pending = new Promise<void>((_, r) => {
    reject = r;
  });
  let once = true;
  setter.mockImplementation(async (k, v) => {
    if (k === ONBOARDING_KEY && once) {
      once = false;
      await pending;
    }
    return original(k, v);
  });
  act(() => view.root.findByType(ProfileSettings).props.onPersonalize());
  act(() => {
    const onboarding = view.root.findByType(Onboarding);
    onboarding.props.onChange({
      ...onboarding.props.state,
      answers: {
        ...onboarding.props.state.answers,
        displayName: 'Unsaved name',
      },
    });
    onboarding.props.onExit();
  });
  await act(async () => {
    await Promise.resolve();
  });
  const beforeJournal = setter.mock.calls.filter(
    ([k]) => k === RESTORE_JOURNAL_KEY,
  ).length;
  act(() =>
    view.root.findByType(ProfileSettings).props.backup.onRestore(backup),
  );
  await act(async () => {
    reject(Error('disk full'));
    await Promise.resolve();
  });
  expect(
    setter.mock.calls.filter(([k]) => k === RESTORE_JOURNAL_KEY),
  ).toHaveLength(beforeJournal);
  expect(
    view.root
      .findAllByType(Text)
      .map((n: any) => n.props.children)
      .flat()
      .join(' '),
  ).toContain('Save or retry');
  setter.mockImplementation(original);
  act(() => view.unmount());
});
