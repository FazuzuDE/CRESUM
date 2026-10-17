import { Text } from 'react-native';
import { MuscleProgress } from '../../components/MuscleProgress';
import { MuscleMap } from '../../components/MuscleMap';
import { AppButton } from '../../components/AppButton';
import type { WorkoutSession } from '../workout-model';

const { act, create } = jest.requireActual('react-test-renderer');
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));
jest.mock('expo-blur', () => ({
  BlurView: jest.requireActual('react-native').View,
}));

const now = new Date(2026, 9, 17, 12).getTime();
const history: WorkoutSession[] = [
  {
    id: 'saved',
    name: 'Saved workout',
    templateId: 'template',
    startedAt: now - 1000,
    finishedAt: now,
    currentExerciseIndex: 0,
    restDurationSeconds: 90,
    exercises: [
      {
        id: 'exercise',
        libraryId: 'bench',
        name: 'Historical bench',
        muscle: 'Saved',
        sets: [{ id: 'set', weight: '50', reps: '8', completedAt: now - 100 }],
      },
    ],
  },
];

it('opens muscle details, shows source sets and closes stale details on period change', () => {
  let view!: ReturnType<typeof create>;
  const onOverview = jest.fn();
  act(() => {
    view = create(
      <MuscleProgress history={history} now={now} onOverview={onOverview} />,
    );
  });
  const press = (title: string) =>
    act(() =>
      view.root
        .findAllByType(AppButton)
        .find(
          (button: { props: { title: string } }) =>
            button.props.title === title,
        )!
        .props.onPress(),
    );
  act(() => view.root.findByType(MuscleMap).props.onSelect('chest'));
  press('View completed sets');
  expect(
    view.root
      .findAllByType(Text)
      .some(
        (node: { props: { children: unknown } }) =>
          node.props.children === 'Historical bench',
      ),
  ).toBe(true);
  press('Done');
  press('4 weeks');
  expect(
    view.root
      .findAllByType(AppButton)
      .some(
        (button: { props: { title: string } }) =>
          button.props.title === 'View completed sets',
      ),
  ).toBe(false);
  press('Overview');
  expect(onOverview).toHaveBeenCalledTimes(1);
  act(() => view.unmount());
});

it('keeps zero-history muscles selectable without inventing data', () => {
  let view!: ReturnType<typeof create>;
  act(() => {
    view = create(
      <MuscleProgress history={[]} now={now} onOverview={() => {}} />,
    );
  });
  act(() => view.root.findByType(MuscleMap).props.onSelect('lats'));
  expect(
    view.root
      .findAllByType(Text)
      .some(
        (node: { props: { children: unknown } }) =>
          node.props.children ===
          'No mapped completed sets for this muscle in this period.',
      ),
  ).toBe(true);
  act(() => view.unmount());
});

it('does not reinterpret saved reps as seconds or meters for duration exercises', () => {
  const plank = {
    ...history[0],
    exercises: [{ ...history[0].exercises[0], libraryId: 'plank' }],
  };
  let view!: ReturnType<typeof create>;
  act(() => {
    view = create(
      <MuscleProgress history={[plank]} now={now} onOverview={() => {}} />,
    );
  });
  act(() => view.root.findByType(MuscleMap).props.onSelect('abs'));
  act(() =>
    view.root
      .findAllByType(AppButton)
      .find(
        (button: { props: { title: string } }) =>
          button.props.title === 'View completed sets',
      )!
      .props.onPress(),
  );
  const strings = view.root
    .findAllByType(Text)
    .map((node: { props: { children: unknown } }) =>
      String(node.props.children),
    );
  expect(
    strings.some(
      (value: string) =>
        value.includes('Duration (s)') || value.includes('Distance (m)'),
    ),
  ).toBe(false);
  act(() => view.unmount());
});
