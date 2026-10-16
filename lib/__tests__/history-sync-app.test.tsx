import App from '../../app/index';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSupabaseAuthRepository } from '../supabase-auth';
import type { AuthIdentity, AuthRepository } from '../auth-repository';
import { completeOnboardingForTest } from './onboarding-fixture';
import { STATE_KEY } from '../workout-repository';
import { Dock } from '../../components/Dock';
import { AppButton } from '../../components/AppButton';
import { ProfileSettings } from '../../components/ProfileSettings';
import { encodeHistoryWorkout } from '../sync/history-mapper';
import { HISTORY_PAUSE_KEY } from '../sync/history-ledger';
import { createLocalBackup, parseLocalBackup } from '../local-backup';
import type { WorkoutSession } from '../workout-model';
const { act, create } = jest.requireActual('react-test-renderer');
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock',
  ),
);
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
jest.mock('expo-crypto', () => {
  let n = 0;
  return {
    randomUUID: () => `test-uuid-${++n}`,
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    digestStringAsync: async (_: string, value: string) =>
      jest
        .requireActual('crypto')
        .createHash('sha256')
        .update(value)
        .digest('hex'),
  };
});
const factory = jest.mocked(createSupabaseAuthRepository);
const workout = (id: string): WorkoutSession => ({
  id,
  name: id,
  templateId: 't',
  startedAt: 0,
  finishedAt: 10,
  currentExerciseIndex: 0,
  restDurationSeconds: 90,
  exercises: [],
});
const button = (view: ReturnType<typeof create>, title: string) =>
  view.root
    .findAllByType(AppButton)
    .find((n: { props: { title: string } }) => n.props.title === title);
const tick = () => new Promise((r) => setTimeout(r, 0));
beforeEach(async () => {
  await AsyncStorage.clear();
  factory.mockReset();
  await completeOnboardingForTest();
  await AsyncStorage.setItem(
    STATE_KEY,
    JSON.stringify({
      schemaVersion: 1,
      history: [workout('local')],
      activeWorkout: null,
      templates: [],
    }),
  );
});
function account() {
  let listener!: (identity: AuthIdentity | null) => void;
  const sent: { userId: string; workoutId: string }[] = [];
  let hold: Promise<void> | null = null;
  let release!: () => void;
  const repository: AuthRepository = {
    getIdentity: async () => ({ id: 'A', email: 'a@example.com' }),
    onAuthChange: (l) => {
      listener = l;
      return () => {};
    },
    sendEmailOtp: async () => {},
    verifyEmailOtp: async () => ({ id: 'A', email: 'a@example.com' }),
    signOut: async () => {
      listener(null);
    },
    dispose: jest.fn(),
    historyRpc: async (userId, name, args) => {
      if (name === 'publish_completed_workout') {
        sent.push({ userId, workoutId: args.p_workout_id as string });
        return { data: { revision: 1, changeSequence: '2' }, error: null };
      }
      if (hold) await hold;
      const remote =
        userId === 'A' && args.p_after === '0'
          ? [
              {
                sequence: '1',
                workoutId: 'remote',
                revision: 1,
                deletedAt: null,
                workout: encodeHistoryWorkout(workout('remote')),
              },
            ]
          : [];
      return {
        data: {
          cursor: remote.length ? '1' : args.p_after,
          hasMore: false,
          changes: remote,
        },
        error: null,
      };
    },
  };
  factory.mockReturnValue(repository);
  return {
    repository,
    sent,
    switchTo: (id: string) => listener({ id, email: id + '@example.com' }),
    hold: () => {
      hold = new Promise<void>((r) => {
        release = r;
      });
    },
    release: () => {
      hold = null;
      release();
    },
  };
}
it('enables actual Account & Sync, merges history and keeps A history out of B uploads', async () => {
  const a = account();
  let view!: ReturnType<typeof create>;
  try {
    await act(async () => {
      view = create(<App />);
      await tick();
    });
    act(() => view.root.findByType(Dock).props.onChange('profile'));
    act(() => button(view, 'Account')!.props.onPress());
    expect(JSON.stringify(view.toJSON())).toContain('Cloud backup is off');
    await act(async () => {
      button(view, 'Enable cloud backup')!.props.onPress();
      await tick();
      await tick();
    });
    expect(JSON.stringify(view.toJSON())).toContain('Synced');
    expect(
      JSON.parse((await AsyncStorage.getItem(STATE_KEY))!).history.map(
        (w: WorkoutSession) => w.id,
      ),
    ).toEqual(['local', 'remote']);
    expect(a.sent).toEqual([{ userId: 'A', workoutId: 'local' }]);
    await act(async () => {
      a.switchTo('B');
      await tick();
    });
    await act(async () => {
      button(view, 'Enable cloud backup')!.props.onPress();
      await tick();
      await tick();
    });
    expect(a.sent.every((r) => r.userId === 'A')).toBe(true);
  } finally {
    if (view) await act(async () => view.unmount());
  }
});
it('full restore pauses pending sync without waiting on its network reply or replacing the auth owner', async () => {
  const a = account();
  let view!: ReturnType<typeof create>;
  try {
    await act(async () => {
      view = create(<App />);
      await tick();
    });
    const backup = await parseLocalBackup(
      await createLocalBackup(AsyncStorage),
    );
    act(() => view.root.findByType(Dock).props.onChange('profile'));
    act(() => button(view, 'Account')!.props.onPress());
    a.hold();
    await act(async () => {
      button(view, 'Enable cloud backup')!.props.onPress();
      await tick();
    });
    await act(async () => {
      view.root.findByType(ProfileSettings).props.backup.onRestore(backup);
      await tick();
      await tick();
    });
    expect(await AsyncStorage.getItem(HISTORY_PAUSE_KEY)).toBe('1');
    expect(factory).toHaveBeenCalledTimes(1);
    expect(a.repository.dispose).not.toHaveBeenCalled();
    await act(async () => {
      a.release();
      await tick();
      await tick();
    });
    expect(
      JSON.parse((await AsyncStorage.getItem(STATE_KEY))!).history.map(
        (w: WorkoutSession) => w.id,
      ),
    ).toEqual(['local']);
    expect(a.sent).toEqual([]);
  } finally {
    if (view) await act(async () => view.unmount());
  }
});
