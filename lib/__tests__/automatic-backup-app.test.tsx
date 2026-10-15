import App from '../../app/index';
import { AppState } from 'react-native';
import { ProfileSettings } from '../../components/ProfileSettings';
import { BACKUP_POLICY_KEY } from '../backup-policy';
import { automaticBackupFiles } from '../automatic-backup-files';
import { emptyWorkoutState, STATE_KEY } from '../workout-repository';
import { startWorkout, finishWorkout } from '../workout-engine';
import { defaultTemplates, exerciseLibrary } from '../workout-catalog';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { completeOnboardingForTest } from './onboarding-fixture';
import { parseLocalBackup } from '../local-backup';
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
const mockFiles = new Map<string, string>();
jest.mock('../automatic-backup-files', () => ({
  supportsAutomaticBackups: true,
  automaticBackupFiles: {
    read: jest.fn(async (slot: string) => mockFiles.get(slot) ?? null),
    write: jest.fn(async (slot: string, text: string) => {
      mockFiles.set(slot, text);
    }),
  },
}));
beforeEach(async () => {
  jest.useFakeTimers();
  Object.defineProperty(AppState, 'currentState', {
    value: 'active',
    configurable: true,
  });
  mockFiles.clear();
  jest.mocked(automaticBackupFiles.write).mockClear();
  await AsyncStorage.clear();
  await completeOnboardingForTest();
});

afterEach(() => jest.useRealTimers());
async function mountWithHistory(frequency: 'workout' | 'weekly' = 'workout') {
  const workout = startWorkout(defaultTemplates[0], exerciseLibrary, 100);
  workout.exercises[0].sets[0].completedAt = 110;
  const history = [finishWorkout(workout, 120)];
  await AsyncStorage.setItem(
    STATE_KEY,
    JSON.stringify({ ...emptyWorkoutState(), history }),
  );
  await AsyncStorage.setItem(
    BACKUP_POLICY_KEY,
    JSON.stringify({ version: 1, enabled: true, frequency }),
  );
  let view: any;
  await act(async () => {
    view = create(<App />);
  });
  await act(async () => {
    await jest.advanceTimersByTimeAsync(1);
  });
  await act(async () => {
    await jest.advanceTimersByTimeAsync(1);
  });
  return view;
}
it('creates a verified copy through App scheduling and skips the same durable workout on later checks', async () => {
  const view = await mountWithHistory();
  expect(mockFiles.size).toBe(1);
  const stored = JSON.parse([...mockFiles.values()][0]);
  expect((await parseLocalBackup(stored.text)).summary.workouts).toBe(1);
  await act(async () => {
    await jest.advanceTimersByTimeAsync(60_000);
  });
  expect(automaticBackupFiles.write).toHaveBeenCalledTimes(1);
  act(() => view.unmount());
});
it('loads the current weekly copy on reopen without writing another copy', async () => {
  let view = await mountWithHistory('weekly');
  expect(automaticBackupFiles.write).toHaveBeenCalledTimes(1);
  act(() => view.unmount());
  await act(async () => {
    view = create(<App />);
  });
  await act(async () => {
    await jest.advanceTimersByTimeAsync(1);
  });
  expect(automaticBackupFiles.write).toHaveBeenCalledTimes(1);
  expect(
    view.root.findByType(ProfileSettings).props.backup.lastCopy.workouts,
  ).toBe(1);
  act(() => view.unmount());
});
