import { renderedText } from './rendered-text';
import { isPressable } from './pressable';
import { ScrollView, StyleSheet, TextInput } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import type { ReactElement } from 'react';
import { ExerciseLibrary } from '../../components/ExerciseLibrary';
import { Workout } from '../../components/Workout';
import { AppPicker } from '../../components/AppPicker';
import { AppButton } from '../../components/AppButton';
import { exerciseLibrary, findExercise } from '../exercise-library';
import { defaultTemplates } from '../workout-catalog';
import { startWorkout } from '../workout-engine';
import App from '../../app/index';
import { Dock } from '../../components/Dock';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { completeOnboardingForTest } from './onboarding-fixture';

const { act, create } = jest.requireActual('react-test-renderer');
type ScrollNode = {
  props: {
    horizontal?: boolean;
    keyboardShouldPersistTaps?: string;
    style?: StyleProp<ViewStyle>;
  };
};

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(async () => {}),
  NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock',
  ),
);
jest.mock('expo-blur', () => ({
  BlurView: jest.requireActual('react-native').View,
}));

const renderLibrary = (element: ReactElement) => {
  let view!: ReturnType<typeof create>;
  act(() => {
    view = create(element);
  });
  return view;
};

const findPressable = (
  view: ReturnType<typeof create>,
  accessibilityLabel: string,
) =>
  view.root
    .findAll(isPressable)
    .find((node: { props: { accessibilityLabel?: string } }) =>
      node.props.accessibilityLabel?.startsWith(accessibilityLabel),
    );

const resultLabels = (view: ReturnType<typeof create>, prefix: string) =>
  view.root
    .findAll(isPressable)
    .map(
      (node: { props: { accessibilityLabel?: string } }) =>
        node.props.accessibilityLabel,
    )
    .filter((label: string | undefined): label is string =>
      Boolean(label?.startsWith(prefix)),
    );

const chooseFilter = (
  view: ReturnType<typeof create>,
  filter: string,
  value: string,
) => {
  act(() => findPressable(view, filter).props.onPress());
  const picker = view.root.findByType(AppPicker);
  const row = picker.props.columns[0].indexOf(value);
  expect(row).toBeGreaterThanOrEqual(0);
  act(() => picker.props.onChange(0, row));
  const done = view.root
    .findAllByType(AppButton)
    .find((node: { props: { title: string } }) => node.props.title === 'Done');
  act(() => done.props.onPress());
};

describe('ExerciseLibrary', () => {
  it('adds the exact exercise found through slang from a different language', () => {
    const onAdd = jest.fn();
    const view = renderLibrary(
      <ExerciseLibrary visible onAdd={onAdd} onClose={jest.fn()} />,
    );
    act(() => view.root.findByType(TextInput).props.onChangeText('молотки'));
    expect(resultLabels(view, 'Add ')).toEqual(['Add Hammer Curl']);
    act(() => findPressable(view, 'Add Hammer Curl').props.onPress());
    expect(onAdd).toHaveBeenCalledWith(
      exerciseLibrary.find((record) => record.id === 'hammer-curl'),
    );
    act(() => view.unmount());
  });

  it('searches names case-insensitively and renders no-results state', () => {
    const view = renderLibrary(
      <ExerciseLibrary visible onClose={jest.fn()} onAdd={jest.fn()} />,
    );
    const search = view.root.findByType(TextInput);

    act(() => search.props.onChangeText('BENCH'));
    expect(resultLabels(view, 'Add Barbell Bench Press')).toHaveLength(1);
    expect(resultLabels(view, 'Add Barbell Back Squat')).toHaveLength(0);

    act(() => search.props.onChangeText('not-a-real-exercise'));
    expect(renderedText(view.toJSON())).toContain('No exercises found');
  });

  it('combines muscle and equipment filters through real presses', () => {
    const view = renderLibrary(
      <ExerciseLibrary visible onClose={jest.fn()} onAdd={jest.fn()} />,
    );

    chooseFilter(view, 'Filter muscle All', 'Chest');
    chooseFilter(view, 'Filter equipment All', 'Dumbbell');

    expect(resultLabels(view, 'Add Incline Dumbbell Press')).toHaveLength(1);
    expect(resultLabels(view, 'Add Barbell Bench Press')).toHaveLength(0);
  });

  it('scrolls both compact wheel filters and results in one edge-to-edge viewport', () => {
    const view = renderLibrary(
      <ExerciseLibrary visible onClose={jest.fn()} onAdd={jest.fn()} />,
    );
    const scrollViews = view.root.findAllByType(ScrollView);
    const horizontal = scrollViews.filter(
      (node: ScrollNode) => node.props.horizontal,
    );
    const results = scrollViews.find(
      (node: ScrollNode) => node.props.keyboardShouldPersistTaps === 'handled',
    );

    expect(horizontal).toHaveLength(0);
    expect(resultLabels(view, 'Filter ')).toHaveLength(2);
    expect(StyleSheet.flatten(results?.props.style).flex).toBe(1);
    expect(results.props.contentInsetAdjustmentBehavior).toBe('never');
    expect(results.findByType(TextInput)).toBeDefined();
    expect(
      results
        .findAll(isPressable)
        .filter((node: { props: { accessibilityLabel?: string } }) =>
          node.props.accessibilityLabel?.startsWith('Filter '),
        ),
    ).toHaveLength(2);
  });

  it('adds an exercise and exposes controlled selection state', () => {
    const onAdd = jest.fn();
    const onToggle = jest.fn();
    const view = renderLibrary(
      <ExerciseLibrary visible onClose={jest.fn()} onAdd={onAdd} />,
    );

    act(() => findPressable(view, 'Add Barbell Bench Press')?.props.onPress());
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'barbell-bench-press' }),
    );

    act(() =>
      view.update(
        <ExerciseLibrary
          visible
          onClose={jest.fn()}
          selectedIds={['barbell-bench-press']}
          onToggle={onToggle}
        />,
      ),
    );

    const selected = findPressable(view, 'Select Barbell Bench Press');
    expect(selected?.props.accessibilityState).toMatchObject({ checked: true });
    act(() => selected?.props.onPress());
    expect(onToggle).toHaveBeenCalledWith('barbell-bench-press');
  });

  it('resets transient search and filters on close without owning selection', () => {
    const onClose = jest.fn();
    const props = {
      visible: true,
      onClose,
      selectedIds: ['barbell-bench-press'],
      onToggle: jest.fn(),
    };
    const view = renderLibrary(<ExerciseLibrary {...props} />);

    act(() => view.root.findByType(TextInput).props.onChangeText('squat'));
    chooseFilter(view, 'Filter muscle All', 'Quadriceps');
    act(() => findPressable(view, 'Close exercise library')?.props.onPress());
    expect(onClose).toHaveBeenCalledTimes(1);

    act(() => view.update(<ExerciseLibrary {...props} visible={false} />));
    act(() => view.update(<ExerciseLibrary {...props} visible />));

    expect(view.root.findByType(TextInput).props.value).toBe('');
    expect(resultLabels(view, 'Select Barbell Bench Press')).toHaveLength(1);
    expect(
      findPressable(view, 'Select Barbell Bench Press')?.props
        .accessibilityState,
    ).toMatchObject({ checked: true });
  });
});

it('uses the reusable library to append an exercise to an active workout', () => {
  jest.useFakeTimers();
  const update = jest.fn();
  const session = startWorkout(defaultTemplates[0], exerciseLibrary, 1000);
  const view = renderLibrary(
    <Workout
      session={session}
      history={[]}
      update={update}
      finish={jest.fn()}
      busy={false}
    />,
  );
  const addButton = view.root
    .findAllByType(AppButton)
    .find((node: { props: { title: string } }) =>
      node.props.title.startsWith('Add exercise'),
    );

  act(() => addButton?.props.onPress());
  const sheet = view.root.findByType(ExerciseLibrary);
  expect(sheet.props.visible).toBe(true);

  act(() =>
    sheet.props.onAdd(exerciseLibrary.find(({ id }) => id === 'farmers-carry')),
  );
  expect(sheet.props.visible).toBe(true);
  const transform = update.mock.calls.at(-1)?.[0];
  expect(transform(session).exercises.at(-1).libraryId).toBe('farmers-carry');
  act(() => view.unmount());
  jest.useRealTimers();
});

it('selects canonical exercises for a template without rendering the full catalog', async () => {
  await AsyncStorage.clear();
  await completeOnboardingForTest();
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(<App />);
  });

  act(() => view.root.findByType(Dock).props.onChange('profile'));
  expect(renderedText(view.toJSON())).not.toContain("Farmer's Carry");

  const button = (title: string) =>
    view.root
      .findAllByType(AppButton)
      .find((node: { props: { title: string } }) => node.props.title === title);
  act(() => button('My workouts')?.props.onPress());
  act(() => button('Create Workout')?.props.onPress());
  act(() =>
    view.root
      .findByProps({ accessibilityLabel: 'Workout Name' })
      .props.onChangeText('New workout'),
  );
  act(() => button('Next')?.props.onPress());

  const sheet = view.root.findByType(ExerciseLibrary);
  act(() => sheet.props.onAdd(findExercise('barbell-bench-press')));
  act(() => button('Add Exercise')?.props.onPress());
  act(() => button('Add Exercise')?.props.onPress());
  act(() =>
    sheet.props.onAdd(
      exerciseLibrary.find((item) => item.id === 'seated-cable-row'),
    ),
  );
  act(() => button('Add Exercise')?.props.onPress());
  await act(async () => {
    button('Save Workout')?.props.onPress();
    await Promise.resolve();
  });

  const saved = JSON.parse((await AsyncStorage.getItem('fitflow_state_v1'))!);
  expect(saved.templates.at(-1).exerciseIds).toEqual([
    'barbell-bench-press',
    'seated-cable-row',
  ]);
  act(() => view.unmount());
});

it('shows canonical exercise names for saved legacy templates on Home', async () => {
  await AsyncStorage.clear();
  await AsyncStorage.setItem(
    'fitflow_state_v1',
    JSON.stringify({
      schemaVersion: 1,
      activeWorkout: null,
      history: [],
      templates: [
        {
          id: 'legacy-template',
          name: 'Legacy Template',
          exerciseIds: ['bench', 'row'],
        },
      ],
    }),
  );
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(<App />);
  });

  const rendered = renderedText(view.toJSON());
  expect(rendered).toContain('Barbell Bench Press');
  expect(rendered).toContain('Seated Cable Row');
  act(() => view.unmount());
});

it('reports available and unavailable exercise counts truthfully on Home', async () => {
  await AsyncStorage.clear();
  await AsyncStorage.setItem(
    'fitflow_state_v1',
    JSON.stringify({
      schemaVersion: 1,
      activeWorkout: null,
      history: [],
      templates: [
        {
          id: 'partially-stale',
          name: 'Partially Stale',
          exerciseIds: ['bench', 'missing-exercise', 'row'],
        },
      ],
    }),
  );
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(<App />);
  });

  expect(renderedText(view.toJSON())).toContain('2 available · 1 unavailable');
  act(() => view.unmount());
});

it('offers a read-only full library page with working search and Back', () => {
  const onClose = jest.fn();
  const view = renderLibrary(
    <ExerciseLibrary visible presentation="page" onClose={onClose} />,
  );
  try {
    expect(resultLabels(view, 'Add ')).toHaveLength(0);
    expect(resultLabels(view, 'Select ')).toHaveLength(0);
    expect(renderedText(view.toJSON())).toContain('Barbell Bench Press');
    act(() => view.root.findByType(TextInput).props.onChangeText('not-real'));
    expect(renderedText(view.toJSON())).toContain('No exercises found');
    act(() => findPressable(view, 'Back to Profile')?.props.onPress());
    expect(onClose).toHaveBeenCalledTimes(1);
  } finally {
    act(() => view.unmount());
  }
});

it('lets the active workout add both cardio exercises', () => {
  const onAdd = jest.fn();
  const view = renderLibrary(
    <ExerciseLibrary
      visible
      onClose={() => {}}
      onAdd={onAdd}
      allowCardio
      selectedIds={['barbell-bench-press']}
    />,
  );
  expect(renderedText(view.toJSON())).toContain(
    `${exerciseLibrary.length - 1} exercises`,
  );
  expect(
    findPressable(view, 'Already added Barbell Bench Press')?.props.disabled,
  ).toBe(true);
  expect(findPressable(view, 'Add Treadmill walking')?.props.disabled).toBe(
    false,
  );
  expect(
    findPressable(view, 'Add Upright stationary bike')?.props.disabled,
  ).toBe(false);
  expect(findPressable(view, 'Technique for Treadmill walking')).toBeDefined();
  expect(
    findPressable(view, 'Technique for Upright stationary bike'),
  ).toBeDefined();
  expect(renderedText(view.toJSON())).not.toContain(
    'Available in starter programs',
  );
  act(() => findPressable(view, 'Add Treadmill walking')?.props.onPress());
  act(() =>
    findPressable(view, 'Add Upright stationary bike')?.props.onPress(),
  );
  expect(onAdd.mock.calls.map(([entry]) => entry.id)).toEqual([
    'treadmill-walking',
    'upright-stationary-bike',
  ]);
  act(() => view.unmount());
});

it('uses the selected V7 action to remove from the active workout with three choices after progress', async () => {
  const initial = startWorkout(
    { id: 'press', name: 'Press', exerciseIds: ['barbell-bench-press'] },
    exerciseLibrary,
  );
  const exercise = initial.exercises[0];
  exercise.sets[0] = { ...exercise.sets[0], weight: '40', entered: true };
  const removeExercises = jest.fn(async () => true);
  const view = renderLibrary(
    <Workout
      session={initial}
      history={[]}
      busy={false}
      update={() => {}}
      finish={() => {}}
      removeExercises={removeExercises}
    />,
  );
  const add = view.root
    .findAllByType(AppButton)
    .find(
      (item: { props: { title: string } }) =>
        item.props.title === 'Add exercise',
    );
  act(() => add!.props.onPress());
  const remove = () =>
    findPressable(view, 'Remove Barbell Bench Press from the current workout');
  act(() => remove()!.props.onPress());
  expect(findPressable(view, 'Remove without saving')).toBeDefined();
  await act(async () => {
    await findPressable(view, 'Cancel')!.props.onPress();
  });
  expect(removeExercises).not.toHaveBeenCalled();

  act(() => remove()!.props.onPress());
  await act(async () => {
    await findPressable(view, 'Save and remove')!.props.onPress();
  });
  expect(removeExercises).toHaveBeenCalledWith(initial.id, [exercise.id], true);
  expect(view.root.findByType(ExerciseLibrary).props.visible).toBe(true);
  act(() => view.unmount());
});
