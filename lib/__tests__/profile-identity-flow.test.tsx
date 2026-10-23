import AsyncStorage from '@react-native-async-storage/async-storage';
import { Modal, TextInput } from 'react-native';
import { SharingHub } from '../../components/workout-sharing/SharingHub';
import App from '../../app/index';
import { AppButton } from '../../components/AppButton';
import { Dock } from '../../components/Dock';
import { isPressable } from './pressable';
import { ExerciseLibrary } from '../../components/ExerciseLibrary';
import { WorkoutTemplates } from '../../components/WorkoutTemplates';
import { ONBOARDING_KEY } from '../onboarding-repository';
import { BODY_WEIGHT_KEY } from '../body-weight';
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
const button = (v: ReturnType<typeof create>, title: string) =>
  v.root
    .findAllByType(AppButton)
    .find((b: { props: { title: string } }) => b.props.title === title);
beforeEach(async () => AsyncStorage.clear());
it('collects name, then body details, then goal; preserves the name through reload and Home', async () => {
  let v!: ReturnType<typeof create>;
  await act(async () => {
    v = create(<App />);
  });
  const name = v.root
    .findAllByType(TextInput)
    .find(
      (n: { props: { accessibilityLabel: string } }) =>
        n.props.accessibilityLabel === 'Your name',
    );
  expect(name).toBeDefined();
  await act(async () => name.props.onChangeText('Ігор'));
  await act(async () => button(v, 'Continue').props.onPress());
  expect(JSON.stringify(v.toJSON())).toContain('Body details');
  expect(
    v.root
      .findAllByType(AppButton)
      .some((n: any) => n.props.accessibilityLabel === 'Date of birth'),
  ).toBe(true);
  const weight = v.root
    .findAllByType(TextInput)
    .find(
      (n: { props: { accessibilityLabel: string } }) =>
        n.props.accessibilityLabel === 'Body weight (kg)',
    );
  await act(async () => weight.props.onChangeText('85,5'));
  await act(async () => button(v, 'Continue').props.onPress());
  await act(async () => button(v, 'Build muscle').props.onPress());
  await act(async () => button(v, 'Beginner').props.onPress());
  await act(async () => button(v, 'START!').props.onPress());
  expect(JSON.stringify(v.toJSON())).toContain('Welcome back, Ігор!');
  expect(
    JSON.parse((await AsyncStorage.getItem(ONBOARDING_KEY))!).answers
      .displayName,
  ).toBe('Ігор');
  expect(
    JSON.parse((await AsyncStorage.getItem(BODY_WEIGHT_KEY))!).entries.map(
      (p: { kg: number }) => p.kg,
    ),
  ).toEqual([85.5]);
  await act(async () => v.unmount());
  await act(async () => {
    v = create(<App />);
  });
  expect(JSON.stringify(v.toJSON())).toContain('Welcome back, Ігор!');
  await act(async () => v.unmount());
});
it('saves a new body measurement and retains both measurements after reopening', async () => {
  await AsyncStorage.setItem(
    ONBOARDING_KEY,
    JSON.stringify({
      version: 1,
      status: 'completed',
      step: 'complete',
      answers: { displayName: 'Ihor' },
    }),
  );
  await AsyncStorage.setItem(
    BODY_WEIGHT_KEY,
    JSON.stringify({
      version: 1,
      entries: [{ id: 'initial', recordedAt: Date.now() - 86400000, kg: 85.5 }],
    }),
  );
  let v!: ReturnType<typeof create>;
  await act(async () => {
    v = create(<App />);
  });
  act(() => v.root.findByType(Dock).props.onChange('progress'));
  await act(async () => button(v, 'Add measurement').props.onPress());
  const field = v.root
    .findAllByType(TextInput)
    .find(
      (n: { props: { accessibilityLabel: string } }) =>
        n.props.accessibilityLabel === 'Current body weight (kg)',
    );
  await act(async () => field.props.onChangeText('85,2'));
  await act(async () => button(v, 'Save measurement').props.onPress());
  expect(
    JSON.parse((await AsyncStorage.getItem(BODY_WEIGHT_KEY))!).entries.map(
      (p: { kg: number }) => p.kg,
    ),
  ).toEqual([85.5, 85.2]);
  await act(async () => v.unmount());
  await act(async () => {
    v = create(<App />);
  });
  act(() => v.root.findByType(Dock).props.onChange('progress'));
  expect(JSON.stringify(v.toJSON())).toContain('85.2');
  expect(JSON.stringify(v.toJSON())).toContain('85.5');
  await act(async () => v.unmount());
});
it('keeps Profile compact and opens the saved workouts only through WORKOUTS', async () => {
  await AsyncStorage.setItem(
    ONBOARDING_KEY,
    JSON.stringify({
      version: 1,
      status: 'completed',
      step: 'complete',
      answers: { displayName: 'Ihor' },
    }),
  );
  let v!: ReturnType<typeof create>;
  await act(async () => {
    v = create(<App />);
  });
  act(() => v.root.findByType(Dock).props.onChange('profile'));
  expect(v.root.findAllByType(WorkoutTemplates)).toHaveLength(0);
  await act(async () => button(v, 'WORKOUTS').props.onPress());
  expect(v.root.findByType(SharingHub)).toBeDefined();
  await act(async () => button(v, 'Close').props.onPress());
  expect(v.root.findAllByType(WorkoutTemplates)).toHaveLength(0);
  await act(async () => v.unmount());
});
it('retries an onboarding baseline write instead of discarding it', async () => {
  await AsyncStorage.setItem(
    ONBOARDING_KEY,
    JSON.stringify({
      version: 1,
      status: 'completed',
      step: 'complete',
      answers: { displayName: 'Ihor', bodyWeightKg: '85' },
    }),
  );
  const original = (AsyncStorage.setItem as jest.Mock).getMockImplementation()!;
  (AsyncStorage.setItem as jest.Mock).mockImplementation(
    async (key: string, value: string) => {
      if (key === BODY_WEIGHT_KEY) throw Error('temporary baseline failure');
      return original(key, value);
    },
  );
  let v!: ReturnType<typeof create>;
  try {
    await act(async () => {
      v = create(<App />);
    });
    act(() => v.root.findByType(Dock).props.onChange('progress'));
    expect(button(v, 'Retry measurements')).toBeDefined();
    (AsyncStorage.setItem as jest.Mock).mockImplementation(original);
    await act(async () => button(v, 'Retry measurements').props.onPress());
    expect(
      JSON.parse((await AsyncStorage.getItem(BODY_WEIGHT_KEY))!).entries.map(
        (p: { kg: number }) => p.kg,
      ),
    ).toEqual([85]);
  } finally {
    (AsyncStorage.setItem as jest.Mock).mockImplementation(original);
    if (v) await act(async () => v.unmount());
  }
});
it('keeps workout drafts protected when returning to Profile', async () => {
  await AsyncStorage.setItem(
    ONBOARDING_KEY,
    JSON.stringify({
      version: 1,
      status: 'completed',
      step: 'complete',
      answers: {},
    }),
  );
  let v!: ReturnType<typeof create>;
  try {
    await act(async () => {
      v = create(<App />);
    });
    act(() => v.root.findByType(Dock).props.onChange('profile'));
    await act(async () => button(v, 'WORKOUTS').props.onPress());
    await act(async () => button(v, 'Create Workout').props.onPress());
    const modal = v.root
      .findAllByType(Modal)
      .find((node: any) => node.props.visible);
    await act(async () => modal.props.onRequestClose());
    expect(button(v, 'Next')).toBeDefined();
    expect(v.root.findByType(SharingHub)).toBeDefined();
  } finally {
    if (v) await act(async () => v.unmount());
  }
});
it('reconciles a pending measurement after a failed reset restores local data', async () => {
  await AsyncStorage.setItem(
    ONBOARDING_KEY,
    JSON.stringify({
      version: 1,
      status: 'completed',
      step: 'complete',
      answers: {},
    }),
  );
  await AsyncStorage.setItem(
    BODY_WEIGHT_KEY,
    JSON.stringify({
      version: 1,
      entries: [{ id: 'initial', recordedAt: 1000, kg: 85 }],
    }),
  );
  const original = (AsyncStorage.setItem as jest.Mock).getMockImplementation()!;
  const remove = (
    AsyncStorage.removeItem as jest.Mock
  ).getMockImplementation()!;
  let v!: ReturnType<typeof create>,
    release!: () => void,
    addition!: Promise<void>;
  try {
    await act(async () => {
      v = create(<App />);
    });
    act(() => v.root.findByType(Dock).props.onChange('progress'));
    (AsyncStorage.setItem as jest.Mock).mockImplementationOnce(
      async (key: string, value: string) => {
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        return original(key, value);
      },
    );
    const BodyWeight = jest.requireActual(
      '../../components/BodyWeight',
    ).BodyWeight;
    await act(async () => {
      addition = v.root.findByType(BodyWeight).props.onRecord('84');
      await Promise.resolve();
      await Promise.resolve();
    });
    act(() => v.root.findByType(Dock).props.onChange('profile'));
    await act(async () => button(v, 'Reset local data').props.onPress());
    (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(
      Error('temporary reset failure'),
    );
    const Confirmation = jest.requireActual(
      '../../components/Confirmation',
    ).Confirmation;
    let resetting!: Promise<void>;
    await act(async () => {
      resetting = v.root
        .findAllByType(Confirmation)
        .find(
          (n: { props: { title: string } }) =>
            n.props.title === 'Reset CRESUM?',
        )
        .props.onConfirm();
      await Promise.resolve();
    });
    await act(async () => {
      release();
      await addition;
      await resetting;
    });
    act(() => v.root.findByType(Dock).props.onChange('progress'));
    expect(
      v.root
        .findByType(BodyWeight)
        .props.entries.map((p: { kg: number }) => p.kg),
    ).toEqual([85, 84]);
  } finally {
    (AsyncStorage.setItem as jest.Mock).mockImplementation(original);
    (AsyncStorage.removeItem as jest.Mock).mockImplementation(remove);
    if (v) await act(async () => v.unmount());
  }
});

it('places Exercise Library immediately after WORKOUTS and opens a separate browsable page', async () => {
  await AsyncStorage.setItem(
    ONBOARDING_KEY,
    JSON.stringify({
      version: 1,
      status: 'completed',
      step: 'complete',
      answers: {},
    }),
  );
  let v!: ReturnType<typeof create>;
  try {
    await act(async () => {
      v = create(<App />);
    });
    act(() => v.root.findByType(Dock).props.onChange('profile'));
    const titles = v.root
      .findAllByType(AppButton)
      .map((n: any) => n.props.title);
    expect(titles.slice(0, 2)).toEqual(['WORKOUTS', 'EXERCISE LIBRARY']);
    act(() => button(v, 'EXERCISE LIBRARY').props.onPress());
    expect(v.root.findByType(ExerciseLibrary).props.presentation).toBe('page');
    expect(v.root.findAllByType(WorkoutTemplates)).toHaveLength(0);
    act(() =>
      v.root
        .findAll(isPressable)
        .find((n: any) => n.props.accessibilityLabel === 'Back to Profile')
        .props.onPress(),
    );
    expect(button(v, 'WORKOUTS')).toBeDefined();
  } finally {
    if (v) await act(async () => v.unmount());
  }
});
