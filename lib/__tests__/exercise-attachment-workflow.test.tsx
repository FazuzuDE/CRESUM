import { ExerciseGroupComposer } from '../../components/ExerciseGroupComposer';
import { Workout } from '../../components/Workout';
import { SetEntrySheet } from '../../components/SetEntrySheet';
import { startWorkout } from '../workout-engine';
import { exerciseLibrary, findExercise } from '../exercise-library';
import { ExerciseLibrary } from '../../components/ExerciseLibrary';
import * as React from 'react';
import { TextInput } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { isPressable } from './pressable';
import type { PlannedExercise } from '../workout-model';
const { act, create } = jest.requireActual('react-test-renderer');
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));
jest.mock('expo-crypto', () => {
  let n = 0;
  return { randomUUID: () => `equipment-${++n}` };
});
beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

it('prepares two sets per exact handle, keeps draft weights and applies one ordered group', async () => {
  let saved: PlannedExercise[] | undefined;
  let view: ReturnType<typeof create>;
  act(() => {
    view = create(
      <ExerciseGroupComposer
        initialExerciseId="lat-pulldown-close-neutral-ergonomic-handle"
        onApply={async (entries: PlannedExercise[]) => {
          saved = entries;
          return true;
        }}
        onCancel={() => {}}
      />,
    );
  });
  expect(JSON.stringify(view!.toJSON())).toContain('Primary');
  const field = (label: string, value: string) =>
    act(() =>
      view!.root
        .findAllByType(TextInput)
        .find(
          (x: { props: { accessibilityLabel?: string } }) =>
            x.props.accessibilityLabel === label,
        )!
        .props.onChangeText(value),
    );
  const button = (title: string) =>
    view!.root
      .findAllByType(AppButton)
      .find((x: { props: { title: string } }) => x.props.title === title)!;
  const press = (label: string) =>
    act(() =>
      view!.root
        .findAll(isPressable)
        .find(
          (x: { props: { accessibilityLabel?: string } }) =>
            x.props.accessibilityLabel === label,
        )!
        .props.onPress(),
    );
  field('Planned sets', '2');
  field('Starting weight in kilograms', '45');
  field('Planned repetitions', '12');
  act(() => button('Add sets').props.onPress());
  press('Change equipment: Short ergonomic handle');
  press('V-handle');
  field('Planned sets', '2');
  field('Starting weight in kilograms', '40');
  field('Planned repetitions', '10');
  act(() => button('Add sets').props.onPress());
  press('Change equipment: V-handle');
  press('Short ergonomic handle');
  expect(
    view!.root
      .findAllByType(TextInput)
      .find(
        (x: { props: { accessibilityLabel?: string } }) =>
          x.props.accessibilityLabel === 'Starting weight in kilograms',
      )!.props.value,
  ).toBe('45');
  press('Change equipment: Short ergonomic handle');
  press('Wide bar');
  field('Planned sets', '2');
  field('Starting weight in kilograms', '35');
  field('Planned repetitions', '10');
  act(() => button('Add sets').props.onPress());
  await act(async () => button('Add group to workout').props.onPress());
  expect(saved?.map((e) => e.exerciseId)).toEqual([
    'lat-pulldown-close-neutral-ergonomic-handle',
    'lat-pulldown-close-neutral-v-handle',
    'lat-pulldown-wide-pronated-bar',
  ]);
  expect(saved?.map((e) => e.plannedSets?.length)).toEqual([2, 2, 2]);
  expect(saved?.map((e) => e.plannedSets?.[0].weight)).toEqual([
    '45',
    '40',
    '35',
  ]);
  expect(new Set(saved?.map((e) => e.exerciseGroup?.id)).size).toBe(1);
  act(() => view!.unmount());
});

it('logs six rows in one station and edits/completes the exact second attachment', () => {
  const ids = [
    'lat-pulldown-close-neutral-ergonomic-handle',
    'lat-pulldown-close-neutral-v-handle',
    'lat-pulldown-wide-pronated-bar',
  ];
  let current = startWorkout(
    {
      id: 'p',
      name: 'Pull',
      exerciseIds: ids,
      plannedExercises: ids.map((exerciseId) => ({
        exerciseId,
        sets: 2,
        weight: '40',
        exerciseGroup: {
          id: 'station',
          name: 'Lat Pulldown',
          familyId: 'lat-pulldown',
        },
      })),
    },
    exerciseLibrary,
  );
  function Harness() {
    const [session, setSession] = React.useState(current);
    current = session;
    return (
      <Workout
        session={session}
        history={[]}
        busy={false}
        update={setSession}
        finish={() => {}}
      />
    );
  }
  let view: ReturnType<typeof create>;
  act(() => {
    view = create(<Harness />);
  });
  const press = (label: string) =>
    act(() =>
      view!.root
        .findAll(isPressable)
        .find(
          (x: { props: { accessibilityLabel?: string } }) =>
            x.props.accessibilityLabel === label,
        )!
        .props.onPress(),
    );
  expect(
    view!.root
      .findAll(isPressable)
      .filter(
        (x: { props: { accessibilityRole?: string } }) =>
          x.props.accessibilityRole === 'checkbox',
      ),
  ).toHaveLength(6);
  press('Edit set 3 weight');
  expect(view!.root.findByType(SetEntrySheet).props.libraryId).toBe(ids[1]);
  act(() =>
    view!.root
      .findByType(SetEntrySheet)
      .props.onSave({ weight: '42', reps: '8' }),
  );
  expect(current.exercises[1].sets[0].weight).toBe('42');
  expect(current.exercises[0].sets[0].weight).toBe('40');
  press('Complete set 3');
  expect(current.exercises[1].sets[0].completedAt).toBeDefined();
  expect(current.restEndsAt).toBeDefined();
  expect(current.exercises[0].sets[0].completedAt).toBeUndefined();
  act(() => view!.unmount());
});

it('keeps staged rows on failed active-workout save and commits through the atomic callback only', async () => {
  const initial = startWorkout(
    { id: 'p', name: 'Pull', exerciseIds: ['barbell-bench-press'] },
    exerciseLibrary,
  );
  const before = JSON.stringify(initial);
  const update = jest.fn();
  let accept = false;
  const append = jest.fn(async () => accept);
  let view: ReturnType<typeof create>;
  act(() => {
    view = create(
      <Workout
        session={initial}
        history={[]}
        busy={false}
        update={update}
        finish={() => {}}
        appendGroup={append}
      />,
    );
  });
  act(() =>
    view!.root
      .findByType(ExerciseLibrary)
      .props.onAdd(findExercise('lat-pulldown-close-neutral-ergonomic-handle')),
  );
  const button = (title: string) =>
    view!.root
      .findAllByType(AppButton)
      .find((x: { props: { title: string } }) => x.props.title === title)!;
  act(() => button('Add sets').props.onPress());
  await act(async () => button('Add group to workout').props.onPress());
  expect(view!.root.findAllByType(ExerciseGroupComposer)).toHaveLength(1);
  expect(JSON.stringify(view!.toJSON())).toContain('Could not save');
  expect(update).not.toHaveBeenCalled();
  expect(JSON.stringify(initial)).toBe(before);
  accept = true;
  await act(async () => button('Add group to workout').props.onPress());
  expect(append).toHaveBeenCalledTimes(2);
  expect(append.mock.calls[1]).toEqual(append.mock.calls[0]);
  expect(view!.root.findAllByType(ExerciseGroupComposer)).toHaveLength(0);
  act(() => view!.unmount());
});

it('does not mutate existing prescriptions during draft edits, cancellation or duplicate selection', () => {
  const id = 'lat-pulldown-close-neutral-ergonomic-handle';
  const initial = [
    {
      exerciseId: id,
      sets: 1,
      exerciseGroup: {
        id: 'g',
        name: 'Lat Pulldown',
        familyId: 'lat-pulldown',
      },
      plannedSets: [{ id: 'r', weight: '45', reps: '10' }],
    },
  ];
  const before = JSON.stringify(initial);
  const apply = jest.fn(),
    cancel = jest.fn();
  let view: ReturnType<typeof create>;
  act(() => {
    view = create(
      <ExerciseGroupComposer
        initialExerciseId={id}
        initialEntries={initial}
        existingOutsideIds={['lat-pulldown-close-neutral-v-handle']}
        onApply={apply}
        onCancel={cancel}
      />,
    );
  });
  act(() =>
    view!.root
      .findAllByType(TextInput)
      .find(
        (x: { props: { accessibilityLabel?: string } }) =>
          x.props.accessibilityLabel === 'Weight for set 1',
      )!
      .props.onChangeText('55'),
  );
  const press = (label: string) =>
    act(() =>
      view!.root
        .findAll(isPressable)
        .find(
          (x: { props: { accessibilityLabel?: string } }) =>
            x.props.accessibilityLabel === label,
        )!
        .props.onPress(),
    );
  press('Change equipment: Short ergonomic handle');
  press('V-handle');
  expect(JSON.stringify(view!.toJSON())).toContain('already');
  act(() =>
    view!.root
      .findAllByType(AppButton)
      .find((x: { props: { title: string } }) => x.props.title === 'Back')!
      .props.onPress(),
  );
  expect(cancel).toHaveBeenCalledTimes(1);
  expect(apply).not.toHaveBeenCalled();
  expect(JSON.stringify(initial)).toBe(before);
  act(() => view!.unmount());
});
