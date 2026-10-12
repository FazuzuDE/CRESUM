import { DatePickerSheet } from '../../components/DatePickerSheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../../app/index';
import { AppButton } from '../../components/AppButton';
import { Onboarding } from '../../components/Onboarding';
import { Dock } from '../../components/Dock';
import { ONBOARDING_KEY } from '../onboarding-repository';
import { PROGRAM_KEY } from '../training-programs/repository';
import { selectProgram } from '../training-programs/selectors';
import { STATE_KEY } from '../workout-repository';
import type { TrainingGoal, TrainingExperience } from '../onboarding';
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
    .find((b: { props: { title: string } }) => b.props.title === title);
async function seed(
  goal: TrainingGoal = 'get_stronger',
  experience: TrainingExperience = 'beginner',
  step = 'complete',
) {
  await AsyncStorage.clear();
  await AsyncStorage.setItem(
    ONBOARDING_KEY,
    JSON.stringify({
      version: 1,
      status: 'in_progress',
      step,
      answers: { goal, experience, environment: 'home' },
    }),
  );
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(<App />);
  });
  return view;
}
const variants = (
  ['build_muscle', 'get_stronger', 'general_fitness'] as const
).flatMap((g) =>
  (['beginner', 'some', 'experienced'] as const).map((e) => [g, e] as const),
);
it.each(variants)(
  'accepts %s / %s through START and opens Home without starting a session',
  async (goal, experience) => {
    const view = await seed(goal, experience);
    try {
      expect(button(view, 'START!')).toBeDefined();
      await act(async () => button(view, 'START!').props.onPress());
      expect(view.root.findByType(Dock).props.active).toBe('home');
      const document = JSON.parse((await AsyncStorage.getItem(PROGRAM_KEY))!);
      const state = JSON.parse((await AsyncStorage.getItem(STATE_KEY))!);
      expect(document.assignment.program.id).toBe(
        selectProgram(goal, experience)?.id,
      );
      expect(document.pending).toBeNull();
      expect(state.activeWorkout).toBeNull();
      expect(state.history).toEqual([]);
      expect(
        state.templates.filter((t: { id: string }) =>
          t.id.startsWith('program-'),
        ),
      ).toHaveLength(selectProgram(goal, experience)!.days.length);
      expect(
        JSON.parse((await AsyncStorage.getItem(ONBOARDING_KEY))!).answers
          .environment,
      ).toBe('gym');
      const start = view.root
        .findAllByType(AppButton)
        .find((b: { props: { title: string } }) =>
          b.props.title.startsWith('Start planned workout'),
        );
      await act(async () => start.props.onPress());
      const active = JSON.parse(
        (await AsyncStorage.getItem(STATE_KEY))!,
      ).activeWorkout;
      expect(active.programSlot.assignmentId).toBe(document.assignment.id);
      expect(active.exercises[0].sets[0].reps).toBe('');
      expect(active.exercises[0].sets[0].weight).toBe('');
    } finally {
      await act(async () => view.unmount());
    }
  },
);
it('resumes legacy environment at Body details and preserves Home until explicit acceptance', async () => {
  const view = await seed('build_muscle', 'beginner', 'environment');
  try {
    expect(button(view, 'Continue without body details')).toBeDefined();
    expect(button(view, 'Gym')).toBeUndefined();
    await act(async () => button(view, 'Back').props.onPress());
    expect(button(view, 'Continue')).toBeDefined();
    expect(
      JSON.parse((await AsyncStorage.getItem(ONBOARDING_KEY))!).answers
        .environment,
    ).toBe('home');
  } finally {
    await act(async () => view.unmount());
  }
});
it('keeps the proposal and Retry after a late write failure without generating duplicate routines', async () => {
  const view = await seed();
  const original = (AsyncStorage.setItem as jest.Mock).getMockImplementation()!;
  let failed = false;
  const spy = jest
    .spyOn(AsyncStorage, 'setItem')
    .mockImplementation(async (k, v) => {
      if (k === ONBOARDING_KEY && !failed) {
        failed = true;
        throw Error('disk full');
      }
      return original(k, v);
    });
  try {
    await act(async () => button(view, 'START!').props.onPress());
    expect(view.root.findAllByType(Onboarding)).toHaveLength(1);
    expect(button(view, 'Retry START!')).toBeDefined();
    await act(async () => button(view, 'Retry START!').props.onPress());
    const state = JSON.parse((await AsyncStorage.getItem(STATE_KEY))!);
    const ids = state.templates.map((t: { id: string }) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(
      JSON.parse((await AsyncStorage.getItem(PROGRAM_KEY))!).pending,
    ).toBeNull();
    expect(view.root.findByType(Dock).props.active).toBe('home');
  } finally {
    spy.mockRestore();
    (AsyncStorage.setItem as jest.Mock).mockImplementation(original);
    await act(async () => view.unmount());
  }
});

it('shows the complete proposal and makes unchecked frequencies unavailable without dropping workouts', async () => {
  const view = await seed();
  try {
    await act(async () => button(view, 'View full program').props.onPress());
    expect(JSON.stringify(view.toJSON())).toContain(
      'Standing Cable Anti-rotation Press',
    );
    await act(async () => button(view, 'Schedule options').props.onPress());
    await act(async () => button(view, '4 workouts').props.onPress());
    expect(button(view, 'START!').props.disabled).toBe(true);
    expect(JSON.stringify(view.toJSON())).toContain(
      'No checked program for this frequency',
    );
    expect(await AsyncStorage.getItem(PROGRAM_KEY)).toBeNull();
    expect(button(view, 'Set up workouts myself')).toBeDefined();
  } finally {
    await act(async () => view.unmount());
  }
});

it('retains manual setup and blocks an adult automatic proposal when the supplied age is 15', async () => {
  const view = await seed('general_fitness', 'beginner', 'profile');
  try {
    await act(async () =>
      view.root
        .findAllByType(AppButton)
        .find((n: any) => n.props.accessibilityLabel === 'Date of birth')
        .props.onPress(),
    );
    await act(async () =>
      view.root
        .findByType(DatePickerSheet)
        .props.onConfirm(
          new Date(new Date().getFullYear() - 15, 0, 1).getTime(),
        ),
    );
    await act(async () => button(view, 'Continue').props.onPress());
    expect(button(view, 'START!').props.disabled).toBe(true);
    expect(JSON.stringify(view.toJSON())).toContain('Adult starter programs');
    expect(await AsyncStorage.getItem(PROGRAM_KEY)).toBeNull();
    await act(async () =>
      button(view, 'Set up workouts myself').props.onPress(),
    );
    expect(JSON.stringify(view.toJSON())).toContain('Your first workout');
  } finally {
    await act(async () => view.unmount());
  }
});
