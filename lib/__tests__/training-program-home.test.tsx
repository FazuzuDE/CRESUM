import { HomeDashboard } from '../../components/HomeDashboard';
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
const render = async (active = false, templates = a.templates) => {
  let view!: ReturnType<typeof create>;
  const start = jest.fn();
  const resume = jest.fn();
  await act(async () => {
    view = create(
      <HomeDashboard
        history={[]}
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
      b.props.title.startsWith('Start planned workout'),
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
