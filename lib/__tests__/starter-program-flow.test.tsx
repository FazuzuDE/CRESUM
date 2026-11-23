import { ScheduleWelcome } from '../../components/ScheduleWelcome';
import { projectProgramWeek } from '../training-programs/schedule';
import { StarterProgramSchedule } from '../../components/StarterProgramSchedule';
import { DatePickerSheet } from '../../components/DatePickerSheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../../app/index';
import { AppButton } from '../../components/AppButton';
import { Onboarding } from '../../components/Onboarding';
import { Dock } from '../../components/Dock';
import { ONBOARDING_KEY } from '../onboarding-repository';
import { PROGRAM_KEY } from '../training-programs/repository';
import { starterProgram } from '../training-programs/selectors';
import { STATE_KEY } from '../workout-repository';
import type { TrainingGoal, TrainingExperience } from '../onboarding';
const { act, create } = jest.requireActual('react-test-renderer');
async function chooseDays(view: ReturnType<typeof create>, days = [0, 2, 4]) {
  for (const day of days) {
    await act(async () =>
      view.root.findByType(StarterProgramSchedule).props.onToggle(day),
    );
  }
}

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
  [
    'universal',
    'build_muscle',
    'get_stronger',
    'lose_weight',
    'general_fitness',
  ] as const
).flatMap((g) =>
  (['beginner', 'some', 'experienced'] as const).map((e) => [g, e] as const),
);
it.each(variants)(
  'accepts %s / %s through the calendar and opens Home without starting a session',
  async (goal, experience) => {
    const view = await seed(goal, experience);
    try {
      await act(async () => button(view, 'Set schedule').props.onPress());
      await chooseDays(view);
      await act(async () =>
        view.root.findByType(StarterProgramSchedule).props.onDone(),
      );
      expect(view.root.findByType(Dock).props.active).toBe('home');
      const document = JSON.parse((await AsyncStorage.getItem(PROGRAM_KEY))!);
      const state = JSON.parse((await AsyncStorage.getItem(STATE_KEY))!);
      expect(document.assignment.program.id).toBe(
        starterProgram(goal, experience)?.id,
      );
      expect(document.pending).toBeNull();
      expect(state.activeWorkout).toBeNull();
      expect(state.history).toEqual([]);
      expect(
        state.templates.filter((t: { id: string }) =>
          t.id.startsWith('program-'),
        ),
      ).toHaveLength(starterProgram(goal, experience)!.days.length);
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
    expect(button(view, 'Skip for now')).toBeDefined();
    expect(button(view, 'Gym')).toBeUndefined();
    await act(async () =>
      view.root
        .findAll(
          (item: { props: { onPress?: unknown } }) =>
            typeof item.props.onPress === 'function',
        )
        .find(
          (item: { props: { accessibilityLabel?: string } }) =>
            item.props.accessibilityLabel === 'Back',
        )
        .props.onPress(),
    );
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
  await act(async () => button(view, 'Set schedule').props.onPress());
  await chooseDays(view);
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
    const schedule = () => view.root.findByType(StarterProgramSchedule);
    await act(async () => schedule().props.onDone());
    expect(view.root.findAllByType(Onboarding)).toHaveLength(1);
    expect(schedule().props.changesDisabled).toBe(true);
    await act(async () => schedule().props.onDone());
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

it('updates all matching calendar days and saves a recurring three-day schedule', async () => {
  const view = await seed('universal');
  try {
    expect(JSON.stringify(view.toJSON())).toContain('Chest and arms');
    await act(async () => button(view, 'Set schedule').props.onPress());
    const schedule = () => view.root.findByType(StarterProgramSchedule);
    expect(schedule().props.selected).toEqual([]);
    const today = schedule().props.today as Date;
    const months = [0, 1].map(
      (offset) => new Date(today.getFullYear(), today.getMonth() + offset, 1),
    );
    const highlight = (date: Date) =>
      schedule().findAllByProps({
        testID: `program-date-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
      })[0].props.accessibilityState.selected;
    for (const month of months) {
      expect(highlight(month)).toBe(false);
    }
    await chooseDays(view, [1, 2, 4]);
    for (const month of months) {
      expect(highlight(month)).toBe([2, 3, 5].includes(month.getDay()));
    }
    await act(async () => schedule().props.onDone());
    expect(view.root.findByType(Dock).props.active).toBe('home');
    const { assignment } = JSON.parse(
      (await AsyncStorage.getItem(PROGRAM_KEY))!,
    );
    const start = new Date(assignment.startDate + 'T12:00:00');
    expect(
      assignment.program.schedule[0]
        .map(({ offset }: { offset: number }) => (start.getDay() + offset) % 7)
        .sort(),
    ).toEqual([2, 3, 5]);
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
    await act(async () => button(view, 'Find a program').props.onPress());
    await act(async () => button(view, 'General fitness').props.onPress());
    expect(button(view, 'Set schedule')).toBeUndefined();
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

it.each([false, true])(
  'opens a dismissible welcome on Home with skip=%s',
  async (skip) => {
    const view = await seed('universal');
    try {
      await act(async () => button(view, 'Set schedule').props.onPress());
      const schedule = () => view.root.findByType(StarterProgramSchedule);
      expect(schedule().props.selected).toEqual([]);
      await chooseDays(view, skip ? [0] : [0, 2, 4]);
      await act(async () =>
        skip ? schedule().props.onSkip() : schedule().props.onDone(),
      );
      expect(view.root.findByType(Dock).props.active).toBe('home');
      expect(view.root.findByType(ScheduleWelcome).props.saved).toBe(!skip);
      const { assignment } = JSON.parse(
        (await AsyncStorage.getItem(PROGRAM_KEY))!,
      );
      expect(assignment.scheduleSkipped).toBe(skip ? true : undefined);
      expect(
        projectProgramWeek(assignment, [], assignment.startDate).slots,
      ).toHaveLength(skip ? 0 : 3);
      expect(assignment.templates).toHaveLength(3);
      await act(async () => button(view, 'OK').props.onPress());
      expect(view.root.findAllByType(ScheduleWelcome)).toHaveLength(0);
      expect(view.root.findByType(Dock).props.active).toBe('home');
    } finally {
      await act(async () => view.unmount());
    }
  },
);
