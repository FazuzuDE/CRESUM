import { Modal, Text } from 'react-native';
import { MuscleProgress } from '../../components/MuscleProgress';
import { MuscleGuide } from '../../components/MuscleGuide';
import { MuscleMap } from '../../components/MuscleMap';
import { AppButton } from '../../components/AppButton';
import {
  MuscleDisclosure,
  MuscleSegments,
} from '../../components/MusclePageControls';
import { isPressable } from './pressable';
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
  act(() => view.root.findAllByType(MuscleSegments)[1].props.onChange('4w'));
  expect(
    view.root
      .findAllByType(AppButton)
      .some(
        (button: { props: { title: string } }) =>
          button.props.title === 'View completed sets',
      ),
  ).toBe(false);
  act(() =>
    view.root.findAllByType(MuscleSegments)[0].props.onChange('overview'),
  );
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

it('expands an illustrated guide inline without replacing the map or resetting its period', () => {
  let view!: ReturnType<typeof create>;
  act(() => {
    view = create(
      <MuscleProgress history={history} now={now} onOverview={() => {}} />,
    );
  });
  act(() => view.root.findAllByType(MuscleSegments)[1].props.onChange('4w'));
  act(() => view.root.findAllByType(MuscleDisclosure)[0].props.onPress());
  expect(
    view.root.findByType(MuscleGuide).findByType(MuscleMap).props.muscles,
  ).toEqual([
    { id: 'chest', primary: 1, secondary: 0 },
    { id: 'triceps', primary: 0, secondary: 1 },
    { id: 'front-delts', primary: 0, secondary: 1 },
  ]);
  expect(view.root.findAllByType(MuscleMap)).toHaveLength(2);
  expect(view.root.findAllByType(Modal)).toHaveLength(0);
  act(() => view.root.findAllByType(MuscleDisclosure)[0].props.onPress());
  expect(view.root.findAllByType(MuscleMap)).toHaveLength(1);
  expect(view.root.findAllByType(MuscleSegments)[1].props.value).toBe('4w');
  act(() => view.unmount());
});

it('opens the grouped period catalog and preselects the muscle in discovery from an empty detail', () => {
  let view!: ReturnType<typeof create>;
  act(() => {
    view = create(
      <MuscleProgress history={[]} now={now} onOverview={() => {}} />,
    );
  });
  act(() => view.root.findAllByType(MuscleDisclosure)[1].props.onPress());
  act(() =>
    view.root
      .findAllByType(MuscleDisclosure)
      .find((item: any) => item.props.label === 'Back')
      .props.onPress(),
  );
  const row = view.root.findAll(
    (node: any) =>
      isPressable(node) &&
      node.props.accessibilityLabel?.startsWith('Upper Back,'),
  )[0];
  expect(row.props.accessibilityLabel).toContain('0');
  act(() => row.props.onPress());
  const [mainMap, detailMap] = view.root.findAllByType(MuscleMap);
  expect(mainMap.props.selected).toBe('upper-back');
  expect(detailMap.props.selected).toBe('upper-back');
  expect(view.root.findAllByType(Modal)).toHaveLength(0);
  act(() => row.props.onPress());
  expect(mainMap.props.selected).toBeUndefined();
  act(() => row.props.onPress());
  act(() =>
    view.root
      .findAllByType(AppButton)
      .find((node: any) => node.props.title === 'Find exercises')
      .props.onPress(),
  );
  expect(view.root.findAllByType(MuscleMap).at(-1).props.muscles).toEqual([
    { id: 'upper-back', primary: 1, secondary: 0 },
  ]);
  act(() => view.unmount());
});

it('synchronizes map and checkboxes, filters the catalog and retains selection on back', () => {
  let view!: ReturnType<typeof create>;
  act(() => {
    view = create(
      <MuscleProgress history={[]} now={now} onOverview={() => {}} />,
    );
  });
  const button = (title: string) =>
    view.root
      .findAllByType(AppButton)
      .find((n: any) => n.props.title === title);
  const pressable = (label: string) =>
    view.root.find(
      (n: any) => isPressable(n) && n.props.accessibilityLabel === label,
    );
  const map = () => view.root.findAllByType(MuscleMap).at(-1);
  const displayed = (value: string) =>
    view.root.findAllByType(Text).some((n: any) => n.props.children === value);

  const mainMap = map();
  act(() => button('Find exercises').props.onPress());
  expect(button('Show exercises').props.disabled).toBe(true);
  act(() => map().props.onSelect('chest'));
  expect(pressable('Chest').props.accessibilityState.checked).toBe(true);
  act(() => pressable('Chest').props.onPress());
  expect(map().props.muscles).toEqual([]);
  act(() => map().props.onSelect('chest'));
  act(() => map().props.onSelect('triceps'));
  act(() => button('Show exercises · 2').props.onPress());
  expect(displayed('Machine Chest Press')).toBe(true);
  expect(displayed('Cable Triceps Pushdown')).toBe(false);
  act(() =>
    view.root.findAllByType(MuscleSegments).at(-1).props.onChange('any'),
  );
  expect(displayed('Cable Triceps Pushdown')).toBe(true);
  const pickerMap = map();
  act(() => pressable('Back').props.onPress());
  expect(map()).toBe(pickerMap);
  expect(map().props.muscles.map(({ id }: { id: string }) => id)).toEqual([
    'chest',
    'triceps',
  ]);
  act(() => pressable('Back').props.onPress());
  expect(map()).toBe(mainMap);
  act(() => view.unmount());
});
