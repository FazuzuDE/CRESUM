import { isPressable } from './pressable';
import { ContentScrollView } from '../../components/ContentScrollView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import App from '../../app/index';
import { AppButton } from '../../components/AppButton';
import { DatePickerSheet } from '../../components/DatePickerSheet';
import { AppDatePicker } from '../../components/AppDatePicker';
import { Onboarding } from '../../components/Onboarding';
import { TemplateEditor } from '../../components/TemplateEditor';
import { ExerciseLibrary } from '../../components/ExerciseLibrary';
import { Dock } from '../../components/Dock';
import { ONBOARDING_KEY } from '../onboarding-repository';
import { initialOnboardingState } from '../onboarding';
import { STATE_KEY } from '../workout-repository';
import { defaultTemplates, exerciseLibrary } from '../workout-catalog';
import { startWorkout } from '../workout-engine';

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
  view.root
    .findAllByType(AppButton)
    .find((item: { props: { title: string } }) => item.props.title === title);

const mount = async () => {
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(<App />);
  });
  return view;
};

const enterBody = async (view: ReturnType<typeof create>) => {
  const input = view.root
    .findAllByType(TextInput)
    .find(
      (n: { props: { accessibilityLabel: string } }) =>
        n.props.accessibilityLabel === 'Your name',
    );
  await act(async () => input?.props.onChangeText('Ihor'));
  await act(async () => button(view, 'Continue')?.props.onPress());
  await act(async () => button(view, 'Male')?.props.onPress());
  await act(async () => button(view, 'Continue')?.props.onPress());
};
const enterGoal = async (view: ReturnType<typeof create>) => {
  await enterBody(view);
  await act(async () => button(view, 'Skip for now')?.props.onPress());
  await act(async () => button(view, 'Find a program')?.props.onPress());
};
const mountLegacyBuilder = async () => {
  await AsyncStorage.setItem(
    ONBOARDING_KEY,
    JSON.stringify({
      ...initialOnboardingState,
      step: 'self_setup',
    }),
  );
  return mount();
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

const backToProfile = (view: any) =>
  button(view, 'Back to Profile') ??
  view.root.findAll(
    (node: any) =>
      isPressable(node) && node.props.accessibilityLabel === 'Back to Profile',
  )[0];

it('lets a new user go straight to Home without generating a program', async () => {
  const view = await mount();
  await enterBody(view);
  await act(async () => button(view, 'Skip for now').props.onPress());
  expect(button(view, 'Find a program')).toBeDefined();
  await act(async () => button(view, 'Start on my own').props.onPress());
  expect(view.root.findByType(Dock).props.active).toBe('home');
  const saved = JSON.parse((await AsyncStorage.getItem(ONBOARDING_KEY))!);
  expect(saved).toMatchObject({
    status: 'completed',
    answers: { displayName: 'Ihor', artworkModel: 'male' },
  });
  expect(saved.answers.goal).toBeUndefined();
  await act(async () => view.unmount());
});

it('enables page scrolling only when the content exceeds the available height', async () => {
  const view = await mount();
  const page = () =>
    view.root.findByType(ContentScrollView).findByType(ScrollView);
  await act(async () => {
    page().props.onLayout({
      nativeEvent: { layout: { width: 390, height: 730 } },
    });
    page().props.onContentSizeChange(390, 730);
  });
  expect(page().props.scrollEnabled).toBe(false);
  await act(async () => page().props.onContentSizeChange(390, 790));
  expect(page().props.scrollEnabled).toBe(true);
  await act(async () => view.unmount());
});

it('renders welcome artwork with explicit bounds inside the viewport', async () => {
  const view = await mount();
  const artwork = view.root.findByType(Image);
  const { width, height } = Dimensions.get('window');
  const frame = StyleSheet.flatten(artwork.props.style);
  expect(frame.width).toEqual(expect.any(Number));
  expect(frame.height).toEqual(expect.any(Number));
  expect(frame.width).toBeCloseTo(Math.min(width, 600));
  const frameContainer = artwork.parent;
  expect(
    StyleSheet.flatten(frameContainer?.props.style).marginHorizontal,
  ).toBeLessThan(0);
  expect(frame.maxWidth).toBe('100%');
  const naturalHeight = frame.width / (852 / 822);
  expect(frame.height).toBeCloseTo(
    Math.min(naturalHeight, Math.max(naturalHeight * 0.82, height * 0.39)),
  );
  expect(artwork.props.resizeMode).toBe('cover');
  await act(async () => view.unmount());
});

it('collects a name on the welcome screen before showing the normal dock', async () => {
  const view = await mount();
  expect(view.root.findByType(Onboarding)).toBeDefined();
  expect(button(view, 'Continue')?.props.disabled).toBe(true);
  expect(view.root.findAllByType(Dock)).toHaveLength(0);
  await enterBody(view);
  expect(button(view, 'Skip for now')).toBeDefined();
  await act(async () => view.unmount());
});

it('persists a goal selection through Back and reload and opens the review directly', async () => {
  const view = await mount();
  await enterGoal(view);
  expect(button(view, 'Continue').props.disabled).toBe(true);
  await act(async () => button(view, 'Build muscle').props.onPress());
  await act(async () => button(view, 'Continue').props.onPress());
  expect(button(view, 'Begin')).toBeDefined();
  expect(button(view, 'Beginner')).toBeUndefined();
  const back = view.root
    .findAll(
      (item: { props: { onPress?: unknown } }) =>
        typeof item.props.onPress === 'function',
    )
    .find(
      (item: { props: { accessibilityLabel?: string } }) =>
        item.props.accessibilityLabel === 'Back',
    );
  await act(async () => back.props.onPress());
  expect(button(view, 'Build muscle').props.selected).toBe(true);
  await act(async () => view.unmount());
  const restored = await mount();
  expect(button(restored, 'Build muscle').props.selected).toBe(true);
  await act(async () => button(restored, 'Continue').props.onPress());
  await act(async () => button(restored, 'Begin').props.onPress());
  expect(restored.root.findByType(Dock).props.active).toBe('home');
  await act(async () => restored.unmount());
  const completed = await mount();
  expect(completed.root.findAllByType(Onboarding)).toHaveLength(0);
  await act(async () => completed.unmount());
});

it('preserves the Lose weight selection and reviews the fitness starter plan', async () => {
  const view = await mount();
  await enterGoal(view);
  await act(async () => button(view, 'Lose weight').props.onPress());
  await act(async () => button(view, 'Continue').props.onPress());
  expect(button(view, 'Workout 1')).toBeDefined();
  expect(button(view, 'Workout 2')).toBeDefined();
  expect(button(view, 'Workout 3')).toBeUndefined();
  await act(async () => button(view, 'Workout 1').props.onPress());
  expect(JSON.stringify(view.toJSON())).toContain('Dumbbell Bench Press');
  await act(async () => button(view, 'Begin').props.onPress());
  const saved = JSON.parse((await AsyncStorage.getItem(ONBOARDING_KEY))!);
  expect(saved.answers.goal).toBe('lose_weight');
  expect(view.root.findByType(Dock).props.active).toBe('home');
  await act(async () => view.unmount());
});

it('uses the existing Guided Workout Builder and cancel does not complete onboarding', async () => {
  const view = await mountLegacyBuilder();
  expect(view.root.findByType(TemplateEditor).props.mode).toBe('create');
  await act(async () => button(view, 'Cancel')?.props.onPress());
  expect(button(view, 'Continue')).toBeDefined();
  expect(
    JSON.parse((await AsyncStorage.getItem(ONBOARDING_KEY)) ?? '{}').status,
  ).toBe('in_progress');
  await act(async () => view.unmount());
});

it('completes self-setup only after the existing builder durably saves a custom workout', async () => {
  const view = await mountLegacyBuilder();
  const name = view.root
    .findAllByType(TextInput)
    .find(
      (item: { props: { accessibilityLabel?: string } }) =>
        item.props.accessibilityLabel === 'Workout Name',
    );
  act(() => name?.props.onChangeText('My first workout'));
  act(() => button(view, 'Next')?.props.onPress());
  act(() =>
    view.root
      .findByType(ExerciseLibrary)
      .props.onAdd({ id: 'barbell-bench-press' }),
  );
  act(() => button(view, 'Add Exercise')?.props.onPress());
  expect(view.root.findAllByType(Dock)).toHaveLength(0);
  await act(async () => button(view, 'Save Workout')?.props.onPress());
  expect(view.root.findByType(Dock)).toBeDefined();
  const workout = JSON.parse((await AsyncStorage.getItem(STATE_KEY)) ?? '{}');
  expect(
    workout.templates.filter(
      (item: { name: string }) => item.name === 'My first workout',
    ),
  ).toHaveLength(1);
  expect(workout.history).toEqual([]);
  expect(
    JSON.parse((await AsyncStorage.getItem(ONBOARDING_KEY)) ?? '{}').status,
  ).toBe('completed');
  await act(async () => view.unmount());
});

it('keeps self-setup incomplete when the builder cannot save a workout', async () => {
  const view = await mountLegacyBuilder();
  const name = view.root
    .findAllByType(TextInput)
    .find(
      (item: { props: { accessibilityLabel?: string } }) =>
        item.props.accessibilityLabel === 'Workout Name',
    );
  act(() => name?.props.onChangeText('Unsaved workout'));
  act(() => button(view, 'Next')?.props.onPress());
  act(() =>
    view.root
      .findByType(ExerciseLibrary)
      .props.onAdd({ id: 'barbell-bench-press' }),
  );
  act(() => button(view, 'Add Exercise')?.props.onPress());
  jest
    .spyOn(AsyncStorage, 'setItem')
    .mockRejectedValueOnce(new Error('disk full'));
  await act(async () => button(view, 'Save Workout')?.props.onPress());
  expect(view.root.findByType(TemplateEditor)).toBeDefined();
  expect(view.root.findAllByType(Dock)).toHaveLength(0);
  expect(
    JSON.parse((await AsyncStorage.getItem(ONBOARDING_KEY)) ?? '{}').status,
  ).toBe('in_progress');
  expect(JSON.stringify(view.toJSON())).toContain(
    'Template changes could not be saved',
  );
  await act(async () => view.unmount());
});

it('does not gate an existing active workout even when onboarding storage is damaged', async () => {
  await AsyncStorage.setItem(ONBOARDING_KEY, '{broken');
  await AsyncStorage.setItem(
    STATE_KEY,
    JSON.stringify({
      schemaVersion: 1,
      activeWorkout: startWorkout(defaultTemplates[0], exerciseLibrary, 1000),
      history: [],
      templates: defaultTemplates,
    }),
  );
  const originalWorkout = await AsyncStorage.getItem(STATE_KEY);
  const view = await mount();
  expect(view.root.findByType(Dock)).toBeDefined();
  expect(await AsyncStorage.getItem(STATE_KEY)).toBe(originalWorkout);
  expect(await AsyncStorage.getItem(ONBOARDING_KEY)).toBe('{broken');
  await act(async () => view.unmount());
});

it('keeps malformed onboarding data untouched and allows safe app access', async () => {
  await AsyncStorage.setItem(ONBOARDING_KEY, '{broken');
  const view = await mount();
  expect(JSON.stringify(view.toJSON())).toContain(
    'Saved onboarding is unavailable',
  );
  await act(async () => button(view, 'Continue to app')?.props.onPress());
  expect(view.root.findByType(Dock)).toBeDefined();
  expect(await AsyncStorage.getItem(ONBOARDING_KEY)).toBe('{broken');
  await act(async () => view.unmount());
});

it('lets a completed user reopen and update personalization from Profile', async () => {
  await AsyncStorage.setItem(
    ONBOARDING_KEY,
    JSON.stringify({
      ...initialOnboardingState,
      status: 'completed',
      step: 'complete',
    }),
  );
  const view = await mount();
  act(() => view.root.findByType(Dock).props.onChange('profile'));
  await act(async () => button(view, 'Personalization')?.props.onPress());
  expect(button(view, 'Continue')).toBeDefined();
  await act(async () => backToProfile(view)?.props.onPress());
  expect(view.root.findByType(Dock).props.active).toBe('profile');
  await act(async () => view.unmount());
});

it('resumes an unfinished Profile body-details edit after reopening', async () => {
  await AsyncStorage.setItem(
    ONBOARDING_KEY,
    JSON.stringify({
      version: 1,
      status: 'completed',
      step: 'complete',
      answers: {},
    }),
  );
  const view = await mount();
  act(() => view.root.findByType(Dock).props.onChange('profile'));
  await act(async () => button(view, 'Personalization')?.props.onPress());
  await enterBody(view);
  await act(async () => backToProfile(view)?.props.onPress());
  await act(async () => view.unmount());
  const restored = await mount();
  act(() => restored.root.findByType(Dock).props.onChange('profile'));
  await act(async () => button(restored, 'Personalization')?.props.onPress());
  expect(button(restored, 'Continue without body details')).toBeDefined();
  await act(async () => restored.unmount());
});

it('retries a failed name write without losing the latest in-memory answer', async () => {
  const view = await mount();
  const original = (AsyncStorage.setItem as jest.Mock).getMockImplementation()!;
  const write = jest.spyOn(AsyncStorage, 'setItem');
  write.mockRejectedValueOnce(new Error('temporary storage failure'));
  try {
    const name = view.root
      .findAllByType(TextInput)
      .find(
        (n: { props: { accessibilityLabel: string } }) =>
          n.props.accessibilityLabel === 'Your name',
      );
    await act(async () => name.props.onChangeText('Ihor'));
    expect(button(view, 'Retry onboarding')).toBeDefined();
    await act(async () => button(view, 'Retry onboarding')?.props.onPress());
    expect(
      JSON.parse((await AsyncStorage.getItem(ONBOARDING_KEY))!).answers
        .displayName,
    ).toBe('Ihor');
  } finally {
    write.mockRestore();
    (AsyncStorage.setItem as jest.Mock).mockImplementation(original);
    await act(async () => view.unmount());
  }
});

it('does not turn body details into workout history', async () => {
  const view = await mount();
  await enterBody(view);
  await act(async () =>
    view.root
      .findAllByType(AppButton)
      .find((n: any) => n.props.accessibilityLabel === 'Date of birth')
      .props.onPress(),
  );
  await act(async () =>
    view.root
      .findByType(DatePickerSheet)
      .props.onConfirm(new Date(1989, 8, 27).getTime()),
  );
  await act(async () => button(view, 'Continue')?.props.onPress());
  await act(async () => button(view, 'Find a program')?.props.onPress());
  await act(async () => button(view, 'Build muscle')?.props.onPress());
  await act(async () => button(view, 'Continue')?.props.onPress());
  await act(async () => button(view, 'Begin')?.props.onPress());
  expect(JSON.parse((await AsyncStorage.getItem(STATE_KEY))!).history).toEqual(
    [],
  );
  await act(async () => view.unmount());
});

it('does not apply a date of birth draft after cancelling its wheels', async () => {
  const view = await mount();
  try {
    await enterBody(view);
    await act(async () =>
      view.root
        .findAllByType(AppButton)
        .find((n: any) => n.props.accessibilityLabel === 'Date of birth')
        .props.onPress(),
    );
    act(() =>
      view.root
        .findByType(AppDatePicker)
        .props.onChange(new Date(2000, 1, 29).getTime()),
    );
    await act(async () => button(view, 'Cancel').props.onPress());
    expect(button(view, 'Skip for now')).toBeDefined();
    expect(
      JSON.parse((await AsyncStorage.getItem(ONBOARDING_KEY))!).answers
        .dateOfBirth,
    ).toBeUndefined();
  } finally {
    await act(async () => view.unmount());
  }
});

it('offers only birthdate years accepted by the existing profile validator', async () => {
  const view = await mount();
  try {
    await enterBody(view);
    await act(async () =>
      view.root
        .findAllByType(AppButton)
        .find((n: any) => n.props.accessibilityLabel === 'Date of birth')
        .props.onPress(),
    );
    const date = view.root.findByType(AppDatePicker);
    expect(new Date(date.props.minimum).getFullYear()).toBe(
      new Date().getFullYear() - 120,
    );
  } finally {
    await act(async () => view.unmount());
  }
});

it('centers each onboarding element in the remaining space below its preceding content', async () => {
  const view = await mount();
  const expectCentered = (testID: string) => {
    const slot = view.root.findAllByProps({ testID })[0];
    expect(StyleSheet.flatten(slot?.props.style)).toMatchObject({
      flexGrow: 1,
      justifyContent: 'center',
    });
    return slot;
  };
  expect(
    expectCentered('onboarding-name-slot').findByType(TextInput),
  ).toBeDefined();

  await enterBody(view);
  const image = expectCentered('onboarding-scale-slot').findByType(Image);
  expect(StyleSheet.flatten(image.props.style).height).toBeGreaterThan(190);

  await act(async () => button(view, 'Skip for now')?.props.onPress());
  const choices = expectCentered('onboarding-start-choices');
  expect(choices.findAllByType(AppButton)).toHaveLength(2);
  await act(async () => view.unmount());
});
