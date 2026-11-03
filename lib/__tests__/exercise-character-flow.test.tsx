import { startWorkout, updateSet, toggleSet } from '../workout-engine';
import { defaultTemplates, exerciseLibrary } from '../workout-catalog';
import { ExerciseLibrary } from '../../components/ExerciseLibrary';
import { Confirmation } from '../../components/Confirmation';
import { PROGRAM_KEY } from '../training-programs/repository';
import App from '../../app/index';
import { AppButton } from '../../components/AppButton';
import { Dock } from '../../components/Dock';
import { Onboarding } from '../../components/Onboarding';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { completeOnboardingForTest } from './onboarding-fixture';
import { ONBOARDING_KEY } from '../onboarding-repository';
import { STATE_KEY } from '../workout-repository';
import { TextInput } from 'react-native';
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

const button = (view: ReturnType<typeof create>, title: string) =>
  view.root.findAllByType(AppButton).find((n: any) => n.props.title === title);
const mount = async () => {
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(<App />);
  });
  return view;
};
beforeEach(async () => {
  await AsyncStorage.clear();
});

it('chooses female during welcome, keeps it through back and relaunch', async () => {
  const view = await mount();
  await act(async () =>
    view.root.findByType(TextInput).props.onChangeText('Ihor'),
  );
  await act(async () => button(view, 'Continue').props.onPress());
  expect(button(view, 'Female')).toBeDefined();
  expect(button(view, 'Continue').props.disabled).toBe(true);
  await act(async () => button(view, 'Female').props.onPress());
  expect(
    JSON.parse((await AsyncStorage.getItem(ONBOARDING_KEY))!).answers
      .artworkModel,
  ).toBe('female');
  await act(async () => button(view, 'Continue').props.onPress());
  expect(view.root.findByType(Onboarding).props.state.step).toBe('profile');
  await act(async () => button(view, 'Back').props.onPress());
  expect(button(view, 'Female').props.selected).toBe(true);
  await act(async () => view.unmount());
  const reopened = await mount();
  expect(button(reopened, 'Female').props.selected).toBe(true);
  await act(async () => reopened.unmount());
});

it('changes the Profile preference without modifying workouts and restores it on restart', async () => {
  await completeOnboardingForTest();
  const active = toggleSet(
    updateSet(startWorkout(defaultTemplates[0], exerciseLibrary, 1000), 0, 0, {
      weight: '32.5',
      reps: '8',
    }),
    0,
    0,
    1500,
  ).session;
  await AsyncStorage.setItem(
    STATE_KEY,
    JSON.stringify({
      schemaVersion: 1,
      activeWorkout: active,
      history: [],
      templates: defaultTemplates,
    }),
  );
  const view = await mount();
  act(() => view.root.findByType(Dock).props.onChange('profile'));
  const workouts = await AsyncStorage.getItem(STATE_KEY);
  expect(button(view, 'Male').props.selected).toBe(true);
  await act(async () => button(view, 'Female').props.onPress());
  expect(button(view, 'Female').props.selected).toBe(true);
  expect(await AsyncStorage.getItem(STATE_KEY)).toBe(workouts);
  await act(async () => view.unmount());
  const reopened = await mount();
  act(() => reopened.root.findByType(Dock).props.onChange('profile'));
  expect(button(reopened, 'Female').props.selected).toBe(true);
  await act(async () => button(reopened, 'Male').props.onPress());
  expect(
    JSON.parse((await AsyncStorage.getItem(ONBOARDING_KEY))!).answers
      .artworkModel,
  ).toBe('male');
  await act(async () => reopened.unmount());
});

it('retains the previous character when saving fails and can retry', async () => {
  await completeOnboardingForTest();
  const view = await mount();
  act(() => view.root.findByType(Dock).props.onChange('profile'));
  const original = (AsyncStorage.setItem as jest.Mock).getMockImplementation()!;
  const write = jest.spyOn(AsyncStorage, 'setItem');
  write.mockImplementation(async (key: string, value: string) => {
    if (key === ONBOARDING_KEY) throw new Error('disk full');
    return original(key, value);
  });
  try {
    await act(async () => button(view, 'Female').props.onPress());
    expect(button(view, 'Male').props.selected).toBe(true);
    expect(JSON.stringify(view.toJSON())).toContain(
      'Could not save your character',
    );
    await act(async () => button(view, 'EXERCISE LIBRARY').props.onPress());
    await act(async () =>
      view.root.findByType(ExerciseLibrary).props.onClose(),
    );
    expect(button(view, 'Retry character selection').props.disabled).toBe(
      false,
    );
    write.mockImplementation(original);
    await act(async () =>
      button(view, 'Retry character selection').props.onPress(),
    );
    expect(button(view, 'Female').props.selected).toBe(true);
  } finally {
    write.mockImplementation(original);
    await act(async () => view.unmount());
  }
});

it('serializes character changes and keeps personalization closed until saving finishes', async () => {
  await completeOnboardingForTest();
  const view = await mount();
  act(() => view.root.findByType(Dock).props.onChange('profile'));
  const original = (AsyncStorage.setItem as jest.Mock).getMockImplementation()!;
  let release!: () => void;
  const blocked = new Promise<void>((resolve) => {
    release = resolve;
  });
  const write = jest.spyOn(AsyncStorage, 'setItem');
  write.mockImplementation(async (key: string, value: string) => {
    if (key === ONBOARDING_KEY) await blocked;
    return original(key, value);
  });
  try {
    await act(async () => {
      button(view, 'Female').props.onPress();
    });
    expect(button(view, 'Male').props.disabled).toBe(true);
    expect(button(view, 'Reset local data').props.disabled).toBe(true);
    await act(async () => button(view, 'Reset local data').props.onPress());
    const reset = view.root
      .findAllByType(Confirmation)
      .find((node: any) => node.props.confirmLabel === 'Reset local data');
    await act(async () => reset.props.onConfirm());
    expect(await AsyncStorage.getItem(ONBOARDING_KEY)).not.toBeNull();
    await act(async () => {
      button(view, 'Male').props.onPress();
    });
    await act(async () => {
      button(view, 'Personalization').props.onPress();
    });
    expect(view.root.findAllByType(Onboarding)).toHaveLength(0);
    await act(async () => {
      release();
      await blocked;
    });
    expect(button(view, 'Female').props.selected).toBe(true);
    expect(
      JSON.parse((await AsyncStorage.getItem(ONBOARDING_KEY))!).answers
        .artworkModel,
    ).toBe('female');
  } finally {
    release();
    write.mockImplementation(original);
    await act(async () => view.unmount());
  }
});

it('keeps character selection in Profile when editing personalization', async () => {
  await completeOnboardingForTest();
  const view = await mount();
  act(() => view.root.findByType(Dock).props.onChange('profile'));
  await act(async () => button(view, 'Personalization').props.onPress());
  const name = view.root
    .findAllByType(TextInput)
    .find((n: any) => n.props.accessibilityLabel === 'Your name');
  await act(async () => name.props.onChangeText('Ihor'));
  await act(async () => button(view, 'Continue').props.onPress());
  expect(button(view, 'Female')).toBeUndefined();
  expect(button(view, 'Continue without body details')).toBeDefined();
  await act(async () => button(view, 'Back').props.onPress());
  expect(view.root.findByType(Onboarding).props.state.step).toBe('welcome');
  await act(async () => view.unmount());
});

it('blocks character changes while initial program recovery is still outstanding', async () => {
  await completeOnboardingForTest();
  const original = (AsyncStorage.getItem as jest.Mock).getMockImplementation()!;
  let release!: () => void;
  const blocked = new Promise<void>((resolve) => {
    release = resolve;
  });
  const read = jest.spyOn(AsyncStorage, 'getItem');
  read.mockImplementation(async (key: string) => {
    if (key === PROGRAM_KEY) await blocked;
    return original(key);
  });
  const view = await mount();
  try {
    act(() => view.root.findByType(Dock).props.onChange('profile'));
    expect(button(view, 'Female').props.disabled).toBe(true);
    await act(async () => button(view, 'Female').props.onPress());
    expect(
      JSON.parse((await AsyncStorage.getItem(ONBOARDING_KEY))!).answers
        .artworkModel,
    ).toBeUndefined();
    await act(async () => {
      release();
      await blocked;
    });
    expect(button(view, 'Female').props.disabled).toBe(false);
  } finally {
    release();
    read.mockImplementation(original);
    await act(async () => view.unmount());
  }
});
