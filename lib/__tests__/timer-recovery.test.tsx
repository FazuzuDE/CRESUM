import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, type AppStateStatus } from 'react-native';
import { notificationAsync } from 'expo-haptics';
import { AppButton } from '../../components/AppButton';
import { CardioCountdown } from '../../components/CardioCountdown';
import { Workout } from '../../components/Workout';
import { CARDIO_TIMERS_KEY, waitForCardioWrites } from '../cardio-timer';
import { defaultTemplates, exerciseLibrary } from '../workout-catalog';
import { appendExercise, startWorkout } from '../workout-engine';
import type { WorkoutSession } from '../workout-model';
import { findExercise } from '../exercise-library';
import { emptyWorkoutState, WorkoutRepository } from '../workout-repository';

const { act, create } = jest.requireActual('react-test-renderer');
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(async () => {}),
  NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));

const epoch = 1_800_000_000_000;
const history: WorkoutSession[] = [];
const sample = () => startWorkout(defaultTemplates[0], exerciseLibrary, epoch);

it('restores an active workout when the running cardio interval began after a backward clock change', async () => {
  const workout = appendExercise(sample(), findExercise('treadmill-walking')!);
  const exercise = workout.exercises.at(-1)!;
  exercise.cardio!.startedAt = epoch - 60_000;
  workout.currentExerciseIndex = workout.exercises.length - 1;
  const repository = new WorkoutRepository(AsyncStorage);
  await repository.save({ ...emptyWorkoutState(), activeWorkout: workout });
  const restored = (await repository.load()).activeWorkout!;
  expect(restored.id).toBe(workout.id);
  expect(restored.exercises.at(-1)?.cardio?.startedAt).toBe(epoch - 60_000);
});

it('restores rest after background suspension without replaying an old haptic', async () => {
  jest.useFakeTimers({ now: epoch });
  jest.mocked(notificationAsync).mockClear();
  const initialAppState = AppState.currentState;
  AppState.currentState = 'active';
  const listeners = new Set<(state: AppStateStatus) => void>();
  const subscription = jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((type, callback) => {
      if (type === 'change')
        listeners.add(callback as (state: AppStateStatus) => void);
      return {
        remove: () =>
          listeners.delete(callback as (state: AppStateStatus) => void),
      };
    });
  const emit = (state: AppStateStatus) => {
    AppState.currentState = state;
    for (const listener of listeners) listener(state);
  };
  const session = { ...sample(), restEndsAt: epoch + 30_000 };
  const screen = () => (
    <Workout
      session={session}
      history={history}
      update={() => {}}
      finish={() => {}}
      busy={false}
    />
  );
  let view!: ReturnType<typeof create>;
  const remaining = (label: string) =>
    view.root.findAllByProps({ accessibilityLabel: label });
  try {
    await act(async () => {
      view = create(screen());
    });
    expect(remaining('30 seconds remaining').length).toBeGreaterThan(0);
    act(() => {
      emit('background');
      jest.setSystemTime(epoch + 10_000);
      emit('active');
    });
    expect(remaining('20 seconds remaining').length).toBeGreaterThan(0);
    act(() => {
      emit('background');
      jest.setSystemTime(epoch + 31_000);
      emit('active');
    });
    expect(remaining('0 seconds remaining').length).toBeGreaterThan(0);
    expect(notificationAsync).not.toHaveBeenCalled();
    await act(async () => view.unmount());
    await act(async () => {
      view = create(screen());
    });
    expect(remaining('0 seconds remaining').length).toBeGreaterThan(0);
    expect(notificationAsync).not.toHaveBeenCalled();
    session.restEndsAt = Date.now() + 2_000;
    await act(async () => view.update(screen()));
    act(() => jest.advanceTimersByTime(3000));
    expect(notificationAsync).toHaveBeenCalledTimes(1);
  } finally {
    if (view) await act(async () => view.unmount());
    subscription.mockRestore();
    AppState.currentState = initialAppState;
    jest.useRealTimers();
  }
});

it('reads the committed program countdown when remounted during a pending write', async () => {
  await AsyncStorage.removeItem(CARDIO_TIMERS_KEY);
  const realSetItem = jest
    .mocked(AsyncStorage.setItem)
    .getMockImplementation()!;
  let release!: () => void;
  const hold = new Promise<void>((resolve) => {
    release = resolve;
  });
  const write = jest
    .spyOn(AsyncStorage, 'setItem')
    .mockImplementation(async (key, value) => {
      if (key === CARDIO_TIMERS_KEY) await hold;
      return realSetItem(key, value);
    });
  const screen = () => (
    <CardioCountdown
      sessionId="session"
      exerciseId="treadmill-walking"
      goalSeconds={60}
      now={Date.now()}
      history={history}
    />
  );
  let view!: ReturnType<typeof create>;
  const button = (title: string) =>
    view.root
      .findAllByType(AppButton)
      .find((node: { props: { title: string } }) => node.props.title === title);
  try {
    await act(async () => {
      view = create(screen());
    });
    await act(async () => {
      void button('Start cardio')!.props.onPress();
    });
    expect(
      write.mock.calls.filter(([key]) => key === CARDIO_TIMERS_KEY),
    ).toHaveLength(1);
    await act(async () => view.unmount());
    await act(async () => {
      view = create(screen());
    });
    await act(async () => {
      release();
      await waitForCardioWrites();
    });
    expect(Boolean(button('Pause'))).toBe(true);
    expect(Boolean(button('Start cardio'))).toBe(false);
  } finally {
    await act(async () => {
      release();
      await waitForCardioWrites();
      view?.unmount();
    });
    write.mockImplementation(realSetItem);
    await AsyncStorage.removeItem(CARDIO_TIMERS_KEY);
  }
});
