import App from '../../app/index';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSupabaseAuthRepository } from '../supabase-auth';
import type { AuthIdentity, AuthRepository } from '../auth-repository';
import { completeOnboardingForTest } from './onboarding-fixture';
import { STATE_KEY } from '../workout-repository';
import { Dock } from '../../components/Dock';
import { AppButton } from '../../components/AppButton';
import { ProfileSettings } from '../../components/ProfileSettings';
import {
  encodeHistoryWorkout,
  decodeHistoryWorkout,
} from '../sync/history-mapper';
import {
  ResolutionServer,
  savedWorkout,
} from './helpers/history-resolution-fixture';
import type { HistoryRemote, ResolutionChoice } from '../sync/history-rpc';
import { HISTORY_PAUSE_KEY, HISTORY_LEDGER_KEY } from '../sync/history-ledger';
import { ACCOUNT_DELETION_KEY } from '../account-deletion';
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
function conflictAccount() {
  const a = account();
  const server = new ResolutionServer();
  server.seed('A', savedWorkout('local', '10'));
  const wire = (row: HistoryRemote | null) =>
    row
      ? {
          ...row,
          workout: row.workout ? encodeHistoryWorkout(row.workout) : null,
        }
      : null;
  a.repository.historyRpc = async (user, name, args) => {
    const api = server.api(user);
    if (name === 'pull_completed_workouts') {
      const page = await api.pull(
        args.p_after as string,
        args.p_limit as number,
      );
      return {
        data: {
          ...page,
          changes: page.changes.map((row) => ({
            ...wire(row),
            sequence: row.sequence,
          })),
        },
        error: null,
      };
    }
    if (name === 'get_completed_workout')
      return {
        data: wire(await api.get(args.p_workout_id as string)),
        error: null,
      };
    if (name === 'resolve_completed_workout') {
      const result = await api.resolve({
        workoutId: args.p_workout_id as string,
        mutationId: args.p_mutation_id as string,
        deviceId: args.p_device_id as string,
        expectedRevision: args.p_expected_revision as number,
        choice: args.p_choice as ResolutionChoice,
        copyId: args.p_copy_id as string | null,
        workout:
          args.p_workout === null ? null : decodeHistoryWorkout(args.p_workout),
      });
      return {
        data: {
          kind: 'history_resolution',
          original: wire(result.original),
          copy: wire(result.copy),
        },
        error: null,
      };
    }
    throw new Error('Unexpected RPC: ' + name);
  };
  return { ...a, server };
}
it.each(['local', 'cloud', 'both'] as const)(
  'resolves %s through the real App, hook, RPC mapper and persisted Core',
  async (selection) => {
    const a = conflictAccount();
    await AsyncStorage.setItem(
      STATE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        history: [savedWorkout()],
        activeWorkout: null,
        templates: [],
      }),
    );
    let view!: ReturnType<typeof create>;
    const press = async (title: string) =>
      act(async () => {
        expect(button(view, title)).toBeDefined();
        button(view, title)!.props.onPress();
        await tick();
        await tick();
      });
    try {
      await act(async () => {
        view = create(<App />);
        await tick();
      });
      act(() => view.root.findByType(Dock).props.onChange('profile'));
      await press('Account');
      await press('Enable cloud backup');
      await press('Review conflicting workouts');
      await press('Upper Body');
      if (selection === 'both') {
        await press('More options');
        await press('Save both as separate workouts');
      } else
        await act(async () =>
          view.root
            .findAllByType(AppButton)
            .find(
              (node: { props: { accessibilityLabel: string } }) =>
                node.props.accessibilityLabel ===
                `Keep ${selection === 'local' ? 'device' : 'cloud'} version`,
            )!
            .props.onPress(),
        );
      await press(
        selection === 'both'
          ? 'Save both workouts'
          : selection === 'local'
            ? 'Replace cloud version'
            : 'Replace device version',
      );
      const history = JSON.parse((await AsyncStorage.getItem(STATE_KEY))!)
        .history as WorkoutSession[];
      expect(history).toHaveLength(selection === 'both' ? 2 : 1);
      expect(
        history.find((w) => w.id === 'local')!.exercises[0].sets[0].reps,
      ).toBe(selection === 'local' ? '8' : '10');
      expect(a.server.resolutionCalls).toHaveLength(1);
      expect(JSON.stringify(view.toJSON())).toContain('No conflicts to review');
    } finally {
      if (view) await act(async () => view.unmount());
    }
  },
);
it('keeps Sign Out available during a held resolution and fences its late App reply', async () => {
  const a = conflictAccount();
  await AsyncStorage.setItem(
    STATE_KEY,
    JSON.stringify({
      schemaVersion: 1,
      history: [savedWorkout()],
      activeWorkout: null,
      templates: [],
    }),
  );
  let view!: ReturnType<typeof create>;
  let release!: () => void;
  const press = async (title: string) =>
    act(async () => {
      button(view, title)!.props.onPress();
      await tick();
      await tick();
    });
  try {
    await act(async () => {
      view = create(<App />);
      await tick();
    });
    act(() => view.root.findByType(Dock).props.onChange('profile'));
    await press('Account');
    await press('Enable cloud backup');
    await press('Review conflicting workouts');
    await press('Upper Body');
    await press('More options');
    await press('Save both as separate workouts');
    a.server.hold = new Promise<void>((r) => {
      release = r;
    });
    await press('Save both workouts');
    expect(a.server.resolutionCalls).toHaveLength(1);
    expect(button(view, 'Sign Out')!.props.disabled).toBe(false);
    await press('Sign Out');
    expect(JSON.stringify(view.toJSON())).not.toContain('60 kg × 8');
    release();
    await act(async () => {
      await tick();
      await tick();
    });
    const history = JSON.parse((await AsyncStorage.getItem(STATE_KEY))!)
      .history as WorkoutSession[];
    expect(history).toHaveLength(1);
    expect(history[0].exercises[0].sets[0].reps).toBe('8');
    expect(JSON.stringify(view.toJSON())).toContain('Send code');
  } finally {
    release?.();
    if (view) await act(async () => view.unmount());
  }
});
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

it('account deletion drains and pauses cloud, keeps Core and provenance, and fences a late pull', async () => {
  const a = account();
  const deleted: string[] = [];
  a.repository.deleteAccount = async (id) => {
    expect(await AsyncStorage.getItem(HISTORY_PAUSE_KEY)).toBe('1');
    deleted.push(id);
  };
  a.repository.clearDeletedSession = async () => {};
  let view!: ReturnType<typeof create>;
  try {
    await act(async () => {
      view = create(<App />);
      await tick();
    });
    act(() => view.root.findByType(Dock).props.onChange('profile'));
    act(() => button(view, 'Account')!.props.onPress());
    await act(async () => {
      button(view, 'Enable cloud backup')!.props.onPress();
      await tick();
      await tick();
    });
    const before = await AsyncStorage.getItem(STATE_KEY);
    const claims = JSON.parse(
      (await AsyncStorage.getItem(HISTORY_LEDGER_KEY))!,
    ).claims;
    a.hold();
    await act(async () => {
      button(view, 'Sync Now')!.props.onPress();
      await tick();
    });
    await act(async () => {
      await view.root
        .findByType(ProfileSettings)
        .props.account.deleteAccount('A');
      await tick();
    });
    expect(deleted).toEqual(['A']);
    expect(await AsyncStorage.getItem(STATE_KEY)).toBe(before);
    expect(
      JSON.parse((await AsyncStorage.getItem(HISTORY_LEDGER_KEY))!).claims,
    ).toEqual(claims);
    expect(
      JSON.parse((await AsyncStorage.getItem(ACCOUNT_DELETION_KEY))!).records,
    ).toContainEqual({ userId: 'A', status: 'confirmed' });
    const exported = await createLocalBackup(AsyncStorage);
    expect(exported).not.toContain(ACCOUNT_DELETION_KEY);
    await act(async () => {
      a.release();
      await tick();
      await tick();
    });
    expect(await AsyncStorage.getItem(STATE_KEY)).toBe(before);
    await act(async () => view.unmount());
    await act(async () => {
      view = create(<App />);
      await tick();
      await tick();
    });
    expect(
      view.root.findByType(ProfileSettings).props.account.snapshot.status,
    ).toBe('signed_out');
    expect(await AsyncStorage.getItem(STATE_KEY)).toBe(before);
  } finally {
    if (view) await act(async () => view.unmount());
  }
});
