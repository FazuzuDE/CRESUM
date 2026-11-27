import { HomeDashboard } from '../../components/HomeDashboard';
import { WorkoutHistory } from '../../components/WorkoutHistory';
import type { WorkoutSession } from '../workout-model';
import { AppButton } from '../../components/AppButton';
import { makeAssignment } from '../training-programs/assignment';
import { selectProgram } from '../training-programs/selectors';
import { startWorkout } from '../workout-engine';
import { exerciseLibrary } from '../exercise-library';
const { act, create } = jest.requireActual('react-test-renderer');
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));
jest.mock('expo-blur', () => ({
  BlurView: jest.requireActual('react-native').View,
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock',
  ),
);
const a = makeAssignment(
  selectProgram('get_stronger', 'beginner')!,
  'home-1',
  '2026-10-11',
);
beforeEach(() => {
  jest.useFakeTimers().setSystemTime(new Date(2026, 9, 11, 12));
});
afterEach(() => jest.useRealTimers());
const render = async (
  active = false,
  templates = a.templates,
  history: WorkoutSession[] = [],
) => {
  let view!: ReturnType<typeof create>;
  const start = jest.fn();
  const resume = jest.fn();
  await act(async () => {
    view = create(
      <HomeDashboard
        history={history}
        busy={false}
        createTemplate={jest.fn()}
        activeWorkout={
          active ? startWorkout(a.templates[0], exerciseLibrary) : null
        }
        onResume={resume}
        startTemplate={() => {}}
        templates={templates}
        assignment={a}
        startProgramSlot={start}
        onOpenProfile={() => {}}
      />,
    );
  });
  return { view, start, resume };
};
it('shows accepted weeks separately from actual statistics and starts only a chosen slot', async () => {
  const { view, start } = await render();
  expect(JSON.stringify(view.toJSON())).toContain(a.program.name);
  const button = view.root
    .findAllByType(AppButton)
    .find((b: { props: { title: string } }) =>
      b.props.title.startsWith('Start '),
    );
  expect(button).toBeDefined();
  act(() => button.props.onPress());
  expect(start.mock.calls[0][0].context.assignmentId).toBe(a.id);
  expect(start.mock.calls[0][1].id).toMatch(/^program-home-1-/);
  act(() => view.unmount());
});
it('keeps Resume primary when a workout is active', async () => {
  const { view, resume, start } = await render(true);
  const button = view.root
    .findAllByType(AppButton)
    .find((b: { props: { title: string } }) =>
      b.props.title.startsWith('Resume '),
    );
  expect(button).toBeDefined();
  act(() => button.props.onPress());
  expect(resume).toHaveBeenCalledTimes(1);
  expect(
    view.root
      .findAllByType(AppButton)
      .some((b: { props: { title: string } }) =>
        b.props.title.startsWith('Start planned workout'),
      ),
  ).toBe(false);
  expect(start).not.toHaveBeenCalled();
  act(() => view.unmount());
});
it('offers review instead of recreating a deleted program routine', async () => {
  const { view } = await render(false, []);
  expect(JSON.stringify(view.toJSON())).toContain('Review workouts in Profile');
  expect(
    view.root
      .findAllByType(AppButton)
      .some((b: { props: { title: string } }) =>
        b.props.title.startsWith('Start planned workout'),
      ),
  ).toBe(false);
  act(() => view.unmount());
});

it('shows the next planned day on a rest day without a planned start action', async () => {
  jest.setSystemTime(new Date(2026, 9, 12, 12));
  const { view, start } = await render();
  expect(JSON.stringify(view.toJSON())).toContain('October 13');
  expect(
    view.root
      .findAllByType(AppButton)
      .some((b: { props: { title: string } }) =>
        b.props.title.startsWith('Start '),
      ),
  ).toBe(false);
  expect(start).not.toHaveBeenCalled();
  act(() => view.unmount());
});

it('opens the saved workout itself after completing today’s scheduled session', async () => {
  const workout = startWorkout(a.templates[0], exerciseLibrary);
  workout.programSlot = {
    assignmentId: a.id,
    weekIndex: 0,
    slotIndex: 0,
    date: '2026-10-11',
  };
  workout.finishedAt = Date.now();
  const set = workout.exercises[0].sets[0];
  Object.assign(set, {
    weight: '40',
    reps: '8',
    completedAt: workout.finishedAt,
  });
  const { view, start } = await render(false, a.templates, [workout]);
  const details = view.root
    .findAllByType(AppButton)
    .find(
      (b: { props: { title: string } }) => b.props.title === 'Workout details',
    );
  expect(details).toBeDefined();
  await act(async () => details.props.onPress());
  expect(view.root.findByType(WorkoutHistory).props.initialWorkoutId).toBe(
    workout.id,
  );
  expect(start).not.toHaveBeenCalled();
  act(() => view.unmount());
});
