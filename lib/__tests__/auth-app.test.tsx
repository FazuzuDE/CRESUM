import { StrictMode } from 'react';
import App from '../../app/index';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSupabaseAuthRepository } from '../supabase-auth';
import type { AuthRepository } from '../auth-repository';
import { completeOnboardingForTest } from './onboarding-fixture';
import { defaultTemplates } from '../workout-catalog';
import { STATE_KEY } from '../workout-repository';
import { Dock } from '../../components/Dock';
import { AppButton } from '../../components/AppButton';
import { createLocalBackup, parseLocalBackup } from '../local-backup';
import { Onboarding } from '../../components/Onboarding';
import { ProfileSettings } from '../../components/ProfileSettings';
import { Confirmation } from '../../components/Confirmation';

const { act, create: render } = jest.requireActual('react-test-renderer');
const mounted: ReturnType<typeof render>[] = [];
const create = (element: React.ReactElement) => {
  const view = render(element);
  mounted.push(view);
  return view;
};
afterEach(async () => {
  await act(async () => {
    mounted.splice(0).forEach((view) => view.unmount());
  });
});
jest.mock('../supabase-auth', () => ({
  createSupabaseAuthRepository: jest.fn(),
}));
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

const factory = jest.mocked(createSupabaseAuthRepository);
const button = (view: ReturnType<typeof create>, title: string) =>
  view.root
    .findAllByType(AppButton)
    .find((node: { props: { title: string } }) => node.props.title === title);

beforeEach(async () => {
  await AsyncStorage.clear();
  factory.mockReset();
  await completeOnboardingForTest();
});

it('unconfiguredAuthDoesNotGateHome', async () => {
  factory.mockReturnValue(null);
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(<App />);
  });
  expect(view.root.findByType(Dock).props.active).toBe('home');
  act(() => view.root.findByType(Dock).props.onChange('profile'));
  expect(
    view.root.findByType(ProfileSettings).props.account.snapshot.configured,
  ).toBe(false);
  act(() => button(view, 'Account')?.props.onPress());
  expect(JSON.stringify(view.toJSON())).toContain(
    'Email sign-in isn’t available yet.',
  );
  await act(async () => view.unmount());
});

it('authFailureDoesNotGateHistory', async () => {
  const repository: AuthRepository = {
    getIdentity: jest.fn(async () => {
      throw new Error('network failure');
    }),
    onAuthChange: jest.fn(() => jest.fn()),
    sendEmailOtp: jest.fn(),
    verifyEmailOtp: jest.fn(),
    signOut: jest.fn(),
    dispose: jest.fn(),
  };
  factory.mockReturnValue(repository);
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(<App />);
  });
  expect(view.root.findByType(Dock).props.active).toBe('home');
  act(() => view.root.findByType(Dock).props.onChange('progress'));
  expect(view.root.findByType(Dock).props.active).toBe('progress');
  await act(async () => view.unmount());
  expect(repository.dispose).toHaveBeenCalledTimes(1);
});

it('signOutPreservesWorkoutState', async () => {
  const savedWorkoutState = JSON.stringify({
    schemaVersion: 1,
    activeWorkout: null,
    history: [],
    templates: defaultTemplates,
  });
  await AsyncStorage.setItem(STATE_KEY, savedWorkoutState);
  const repository: AuthRepository = {
    getIdentity: jest.fn(async () => ({
      id: 'user-1',
      email: 'one@example.com',
    })),
    onAuthChange: jest.fn(() => jest.fn()),
    sendEmailOtp: jest.fn(),
    verifyEmailOtp: jest.fn(),
    signOut: jest.fn(async () => {}),
    dispose: jest.fn(),
  };
  factory.mockReturnValue(repository);
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(<App />);
  });
  act(() => view.root.findByType(Dock).props.onChange('profile'));
  expect(
    view.root.findByType(ProfileSettings).props.account.snapshot.status,
  ).toBe('signed_in');
  act(() => button(view, 'Account')?.props.onPress());
  await act(async () => button(view, 'Sign Out')?.props.onPress());
  expect(
    view.root.findByType(ProfileSettings).props.account.snapshot.status,
  ).toBe('signed_out');
  expect(await AsyncStorage.getItem(STATE_KEY)).toBe(savedWorkoutState);
  await act(async () => view.unmount());
});

it('resetDoesNotSignOutOrRemoveAuthStorage', async () => {
  await AsyncStorage.setItem('cresum_auth_v1', 'persisted-auth-session');
  expect(await createLocalBackup(AsyncStorage)).not.toContain(
    'persisted-auth-session',
  );
  const repository: AuthRepository = {
    getIdentity: jest.fn(async () => ({
      id: 'user-1',
      email: 'one@example.com',
    })),
    onAuthChange: jest.fn(() => jest.fn()),
    sendEmailOtp: jest.fn(),
    verifyEmailOtp: jest.fn(),
    signOut: jest.fn(),
    dispose: jest.fn(),
  };
  factory.mockReturnValue(repository);
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(<App />);
  });
  act(() => view.root.findByType(Dock).props.onChange('profile'));
  act(() => button(view, 'Reset local data')?.props.onPress());
  await act(async () =>
    view.root
      .findAllByType(Confirmation)
      .find(
        (node: { props: { title: string } }) =>
          node.props.title === 'Reset CRESUM?',
      )
      ?.props.onConfirm(),
  );
  expect(repository.signOut).not.toHaveBeenCalled();
  expect(await AsyncStorage.getItem('cresum_auth_v1')).toBe(
    'persisted-auth-session',
  );
  expect(view.root.findAllByType(Dock)).toHaveLength(0);
  expect(view.root.findByType(Onboarding)).toBeDefined();
  await act(async () => view.unmount());
});

it('keeps one auth owner across a full local restore while session loading is pending', async () => {
  let resolve!: (value: { id: string; email: string }) => void;
  const pending = new Promise<{ id: string; email: string }>((done) => {
    resolve = done;
  });
  const repository: AuthRepository = {
    getIdentity: jest.fn(() => pending),
    onAuthChange: jest.fn(() => jest.fn()),
    sendEmailOtp: jest.fn(),
    verifyEmailOtp: jest.fn(),
    signOut: jest.fn(),
    dispose: jest.fn(),
  };
  factory.mockReturnValue(repository);
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(<App />);
  });
  expect(view.root.findByType(Dock).props.active).toBe('home');
  expect(
    view.root.findByType(ProfileSettings).props.account.snapshot.status,
  ).toBe('initializing');
  const backup = await parseLocalBackup(await createLocalBackup(AsyncStorage));
  await act(async () => {
    view.root.findByType(ProfileSettings).props.backup.onRestore(backup);
  });
  expect(factory).toHaveBeenCalledTimes(1);
  expect(repository.dispose).not.toHaveBeenCalled();
  await act(async () => {
    resolve({ id: 'user-1', email: 'one@example.com' });
  });
  expect(
    view.root.findByType(ProfileSettings).props.account.snapshot.status,
  ).toBe('signed_in');
  await act(async () => view.unmount());
  expect(repository.dispose).toHaveBeenCalledTimes(1);
});

it('restores the account after StrictMode effect replay without replacing the client', async () => {
  const repository: AuthRepository = {
    getIdentity: jest.fn(async () => ({
      id: 'user-1',
      email: 'one@example.com',
    })),
    onAuthChange: jest.fn(() => jest.fn()),
    sendEmailOtp: jest.fn(),
    verifyEmailOtp: jest.fn(),
    signOut: jest.fn(),
    dispose: jest.fn(),
  };
  factory.mockReturnValue(repository);
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });
  expect(
    view.root.findByType(ProfileSettings).props.account.snapshot.status,
  ).toBe('signed_in');
  expect(factory).toHaveBeenCalledTimes(1);
  expect(repository.onAuthChange).toHaveBeenCalledTimes(1);
  expect(repository.dispose).not.toHaveBeenCalled();
  await act(async () => view.unmount());
  expect(repository.dispose).toHaveBeenCalledTimes(1);
});
