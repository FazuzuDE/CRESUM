import { ExerciseLibrary } from '../../components/ExerciseLibrary';
import { VolumeTrendChart } from '../../components/VolumeTrendChart';
import { EstimatedOneRepMaxBars } from '../../components/EstimatedOneRepMaxBars';
import { TextInput } from 'react-native';
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
const now = new Date(2026, 9, 14, 12).getTime();
const history: WorkoutSession[] = [
  {
    id: 'saved',
    templateId: 't',
    name: 'Upper Body',
    startedAt: now - 60000,
    finishedAt: now,
    currentExerciseIndex: 0,
    restDurationSeconds: 90,
    exercises: [
      {
        id: 'e',
        libraryId: 'bench',
        name: 'Historical name',
        muscle: 'Chest',
        sets: [
          { id: 'completed', weight: '60', reps: '10', completedAt: now },
          { id: 'planned', weight: '999', reps: '10' },
        ],
      },
    ],
  },
];
const button = (view: ReturnType<typeof create>, label: string) =>
  view.root
    .findAll(isPressable)
    .find((n: any) => n.props.accessibilityLabel === label);
const text = (view: ReturnType<typeof create>) => {
  const children = (node: any): string =>
    typeof node === 'string'
      ? node
      : Array.isArray(node)
        ? node.map(children).join(' ')
        : node
          ? children(node.children)
          : '';
  return children(view.toJSON());
};
const render = (h = history, props = {}) => {
  let view!: ReturnType<typeof create>;
  act(() => {
    view = create(
      <ExerciseLibrary
        visible
        history={h}
        now={now}
        onClose={() => {}}
        {...props}
      />,
    );
  });
  return view;
};

it('does not deny previous data when only the selected period is empty', () => {
  const older = {
    ...history[0],
    id: 'old',
    startedAt: now - 40 * 86400000 - 60000,
    finishedAt: now - 40 * 86400000,
  };
  const view = render([older]);
  try {
    act(() =>
      button(view, 'Statistics for Barbell Bench Press')!.props.onPress(),
    );
    expect(text(view)).toContain('Comparison unavailable');
    expect(text(view)).not.toContain('No previous-period data');
  } finally {
    act(() => view.unmount());
  }
});

it('opens the selected curve workout for non-pointer accessibility activation', () => {
  const points = [
    {
      workoutId: 'first',
      workoutName: 'First',
      finishedAt: now - 86400000,
      volume: 50,
    },
    { workoutId: 'last', workoutName: 'Last', finishedAt: now, volume: 70 },
  ];
  const selected = jest.fn();
  let view!: ReturnType<typeof create>;
  act(() => {
    view = create(
      <VolumeTrendChart
        workouts={points}
        start={now - 86400000}
        end={now}
        onSelectPoint={selected}
      />,
    );
  });
  try {
    const curve = view.root
      .findAll(isPressable)
      .find((n: any) => n.props.accessibilityRole === 'adjustable');
    act(() => curve.props.onPress({ nativeEvent: {} }));
    expect(selected).toHaveBeenLastCalledWith(points[1]);
    act(() =>
      curve.props.onAccessibilityAction({
        nativeEvent: { actionName: 'decrement' },
      }),
    );
    const updated = view.root
      .findAll(isPressable)
      .find((n: any) => n.props.accessibilityRole === 'adjustable');
    act(() =>
      updated.props.onAccessibilityAction({
        nativeEvent: { actionName: 'activate' },
      }),
    );
    expect(selected).toHaveBeenLastCalledWith(points[0]);
  } finally {
    act(() => view.unmount());
  }
});

it('opens real exercise statistics without selecting a workout and drills into one workout only', () => {
  const toggle = jest.fn();
  const view = render(history, { onToggle: toggle });
  try {
    expect(button(view, 'Statistics for Barbell Bench Press')).toBeDefined();
    act(() =>
      button(view, 'Statistics for Barbell Bench Press')!.props.onPress(),
    );
    expect(text(view)).toContain('80.0');
    expect(text(view)).toContain('No previous-period data');
    expect(toggle).not.toHaveBeenCalled();
    const chart = view.root.findByType(VolumeTrendChart);
    act(() => chart.props.onSelectPoint(chart.props.workouts[0]));
    expect(text(view)).toContain('Logged sets');
    expect(text(view)).toContain('Upper Body');
    expect(text(view)).not.toContain('999');
    act(() => button(view, 'Back to exercise statistics')!.props.onPress());
    act(() => button(view, 'Exercise metric Volume')!.props.onPress());
    expect(text(view)).toContain('600');
    act(() => button(view, 'Exercise period 1W')!.props.onPress());
    expect(
      view.root.findByType(EstimatedOneRepMaxBars).props.workouts,
    ).toHaveLength(1);
    act(() => button(view, 'Exercise detail Technique')!.props.onPress());
    expect(text(view)).toContain('Setup');
    act(() => button(view, 'Exercise detail Statistics')!.props.onPress());
    expect(
      button(view, 'Exercise metric Volume')!.props.accessibilityState.selected,
    ).toBe(true);
    expect(
      button(view, 'Exercise period 1W')!.props.accessibilityState.selected,
    ).toBe(true);
  } finally {
    act(() => view.unmount());
  }
});

it('shows an honest empty state and returns to the existing Library query', () => {
  const view = render([]);
  try {
    act(() => view.root.findByType(TextInput).props.onChangeText('Bench'));
    act(() =>
      button(view, 'Statistics for Barbell Bench Press')!.props.onPress(),
    );
    expect(text(view)).toContain('No completed sets for this exercise');
    expect(view.root.findAllByType(VolumeTrendChart)).toHaveLength(0);
    act(() => button(view, 'Close exercise details')!.props.onPress());
    expect(view.root.findByType(TextInput).props.value).toBe('Bench');
  } finally {
    act(() => view.unmount());
  }
});
