import { Text } from 'react-native';
import { MuscleProgress } from '../../components/MuscleProgress';
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
  act(() =>
    view.root
      .find(
        (node: any) =>
          isPressable(node) && node.props.accessibilityLabel === 'Back',
      )
      .props.onPress(),
  );
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

it('explains the upper-back projection in Progress and its muscle details', () => {
  let v!: ReturnType<typeof create>;
  act(() => {
    v = create(
      <MuscleProgress history={history} now={now} onOverview={() => {}} />,
    );
  });
  const copy = () =>
    v.root
      .findAllByType(Text)
      .map((n: any) => n.props.children)
      .join(' ');
  expect(copy()).not.toContain('beneath trapezius');
  act(() => v.root.findAllByType(MuscleDisclosure)[0].props.onPress());
  expect(copy()).toContain('beneath trapezius');
  act(() => v.root.findByType(MuscleMap).props.onSelect('upper-back'));
  expect(copy().match(/beneath trapezius/g)).toHaveLength(2);
  act(() => v.unmount());
});

it('explains partial adductor coverage in overview and selected detail without empty missing copy', () => {
  let v: ReturnType<typeof create>;
  act(() => {
    v = create(<MuscleProgress history={[]} now={now} onOverview={() => {}} />);
  });
  const copy = () =>
    v!.root
      .findAllByType(Text)
      .map((n: any) => n.props.children)
      .join(' ');
  act(() => v!.root.findAllByType(MuscleDisclosure)[0].props.onPress());
  expect(copy()).toContain('selected visible medial-thigh patches');
  expect(copy()).not.toContain('Map coverage is pending for');
  expect(copy()).toContain('schematic projections beneath fascia');
  act(() => v!.root.findByType(MuscleMap).props.onSelect('adductors'));
  expect(copy().match(/selected visible medial-thigh patches/g)).toHaveLength(
    2,
  );
  act(() => v!.unmount());
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
  const map = () => view.root.findByType(MuscleMap);
  const displayed = (value: string) =>
    view.root.findAllByType(Text).some((n: any) => n.props.children === value);

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
  act(() => view.root.findByType(MuscleSegments).props.onChange('any'));
  expect(displayed('Cable Triceps Pushdown')).toBe(true);
  act(() => pressable('Back').props.onPress());
  expect(map().props.muscles.map(({ id }: { id: string }) => id)).toEqual([
    'chest',
    'triceps',
  ]);
  act(() => view.unmount());
});
