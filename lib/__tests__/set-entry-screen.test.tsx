import { useState } from 'react';
import { Modal, TextInput } from 'react-native';
import { SetEntrySheet } from '../../components/SetEntrySheet';
import { AppPicker } from '../../components/AppPicker';
import { AppButton } from '../../components/AppButton';
import { Workout } from '../../components/Workout';
import { isPressable } from './pressable';
import { startWorkout } from '../workout-engine';
import { defaultTemplates, exerciseLibrary } from '../workout-catalog';
const { act, create } = jest.requireActual('react-test-renderer');
jest.mock('expo', () => ({ requireOptionalNativeModule: () => null }));
jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
  NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));
jest.mock('expo-blur', () => ({
  BlurView: jest.requireActual('react-native').View,
}));
const button = (v: any, label: string) =>
  v.root
    .findAll(isPressable)
    .find((n: any) => n.props.accessibilityLabel === label);
const field = (v: any, label: string) =>
  v.root
    .findAllByType(TextInput)
    .find((n: any) => n.props.accessibilityLabel === label);
const save = (v: any) =>
  v.root
    .findAllByType(AppButton)
    .find((n: any) => n.props.accessibilityLabel === 'Save set values');
function render(extra = {}) {
  let v: any;
  act(() => {
    v = create(
      <SetEntrySheet
        set={{ id: 's', weight: '63.75', reps: '9' }}
        setNumber={3}
        libraryId="barbell-bench-press"
        onCancel={() => {}}
        onSave={() => {}}
        {...extra}
      />,
    );
  });
  return v;
}
it('preserves exact off-grid values through mode changes and cancels without committing', () => {
  const commit = jest.fn(),
    cancel = jest.fn(),
    v = render({ onSave: commit, onCancel: cancel });
  try {
    const picker = v.root.findByType(AppPicker);
    expect(picker.props.columns[0][picker.props.selected[0]]).toBe('63.75');
    act(() => button(v, 'Use keypad')!.props.onPress());
    expect(field(v, 'Exact weight in kilograms')!.props.value).toBe('63.75');
    act(() =>
      field(v, 'Exact weight in kilograms')!.props.onChangeText('61,25'),
    );
    act(() => button(v, 'Use wheel')!.props.onPress());
    expect(v.root.findByType(AppPicker).props.columns[0]).toContain('61.25');
    expect(commit).not.toHaveBeenCalled();
    act(() => v.root.findByType(Modal).props.onRequestClose());
    expect(cancel).toHaveBeenCalledTimes(1);
  } finally {
    act(() => v.unmount());
  }
});
it('blocks invalid values without discarding the keypad draft and saves valid values only', () => {
  const commit = jest.fn(),
    v = render({ onSave: commit });
  try {
    act(() => button(v, 'Use keypad')!.props.onPress());
    act(() => field(v, 'Exact repetitions')!.props.onChangeText('0'));
    expect(save(v).props.disabled).toBe(true);
    act(() => button(v, 'Use wheel')!.props.onPress());
    expect(field(v, 'Exact repetitions')!.props.value).toBe('0');
    act(() => field(v, 'Exact repetitions')!.props.onChangeText('12'));
    act(() => save(v).props.onPress());
    expect(commit).toHaveBeenCalledWith({ weight: '63.75', reps: '12' });
  } finally {
    act(() => v.unmount());
  }
});
it('retains independent left/right repetitions and disables save while busy', () => {
  const v = render({
    set: { id: 's', weight: '20', reps: '9', otherSideReps: '7' },
    busy: true,
  });
  try {
    expect(v.root.findByType(AppPicker).props.columns).toHaveLength(3);
    expect(save(v).props.disabled).toBe(true);
  } finally {
    act(() => v.unmount());
  }
});

it('blocks Save and mode changes until a native wheel selection settles', () => {
  const commit = jest.fn(),
    v = render({ onSave: commit });
  try {
    act(() => v.root.findByType(AppPicker).props.onInteractionChange(true));
    expect(save(v).props.disabled).toBe(true);
    act(() => button(v, 'Use keypad')!.props.onPress());
    expect(v.root.findAllByType(TextInput)).toHaveLength(0);
    act(() => save(v).props.onPress());
    expect(commit).not.toHaveBeenCalled();
    act(() => v.root.findByType(AppPicker).props.onChange(0, 25));
    act(() => v.root.findByType(AppPicker).props.onInteractionChange(false));
    act(() => save(v).props.onPress());
    expect(commit).toHaveBeenCalledWith({ weight: '62.5', reps: '9' });
  } finally {
    act(() => v.unmount());
  }
});
it('opens from actual workout rows, discards Cancel, and saves without rest or completion mutations', () => {
  const seed = startWorkout(defaultTemplates[0], exerciseLibrary, 1000);
  seed.exercises[0].sets[0].weight = '60';
  seed.restEndsAt = Date.now() + 60000;
  function Harness() {
    const [session, setSession] = useState(seed);
    return (
      <Workout
        session={session}
        history={[]}
        update={setSession}
        finish={() => {}}
        busy={false}
      />
    );
  }
  let v: any;
  act(() => {
    v = create(<Harness />);
  });
  try {
    act(() => button(v, 'Edit set 1 weight')!.props.onPress());
    act(() => button(v, 'Increase weight')!.props.onPress());
    expect(v.root.findByType(Workout).props.session).toEqual(seed);
    act(() => button(v, 'Cancel set editing')!.props.onPress());
    expect(v.root.findByType(Workout).props.session).toEqual(seed);
    act(() => button(v, 'Edit set 1 repetitions')!.props.onPress());
    act(() => button(v, 'Increase weight')!.props.onPress());
    act(() => save(v).props.onPress());
    const next = v.root.findByType(Workout).props.session;
    expect(next.exercises[0].sets[0].weight).toBe('62.5');
    expect(next.exercises[0].sets[0].completedAt).toBeUndefined();
    expect(next.restEndsAt).toBe(seed.restEndsAt);
  } finally {
    act(() => v.unmount());
  }
});

it('opens the wheel with an unset weight and requires an explicit choice', () => {
  const onSave = jest.fn();
  const v = render({ set: { id: 's', weight: '', reps: '10' }, onSave });
  try {
    const picker = () => v.root.findByType(AppPicker);
    expect(picker().props.columns[0][picker().props.selected[0]]).toBe('—');
    expect(save(v).props.disabled).toBe(true);
    act(() =>
      picker().props.onChange(0, picker().props.columns[0].indexOf('62.5')),
    );
    act(() => save(v).props.onPress());
    expect(onSave).toHaveBeenCalledWith({ weight: '62.5', reps: '10' });
  } finally {
    act(() => v.unmount());
  }
});

it('uses the prior set as a suggestion and records only through the explicit action', () => {
  const seed = startWorkout(defaultTemplates[0], exerciseLibrary);
  const exercise = seed.exercises[0];
  const prior = {
    ...seed,
    id: 'previous-session',
    finishedAt: seed.startedAt - 100,
    exercises: [
      {
        ...exercise,
        sets: [
          { ...exercise.sets[0], weight: '60', reps: '10', completedAt: 20 },
        ],
      },
    ],
  };
  function Harness() {
    const [session, setSession] = useState(seed);
    return (
      <Workout
        session={session}
        history={[prior]}
        update={setSession}
        finish={() => {}}
        busy={false}
      />
    );
  }
  let v: any;
  act(() => {
    v = create(<Harness />);
  });
  try {
    expect(button(v, 'Edit set 1 weight')!.props.accessibilityValue.text).toBe(
      '60',
    );
    expect(
      v.root.findByType(Workout).props.session.exercises[0].sets[0].completedAt,
    ).toBeUndefined();
    act(() => button(v, 'Complete set 1')!.props.onPress());
    expect(
      v.root.findByType(Workout).props.session.exercises[0].sets[0],
    ).toMatchObject({
      weight: '60',
      reps: '10',
      completedAt: expect.any(Number),
    });
  } finally {
    act(() => v.unmount());
  }
});

it('keeps declared plan values ahead of previously recorded values', () => {
  const seed = startWorkout(
    {
      id: 'plan',
      name: 'Plan',
      exerciseIds: ['barbell-bench-press'],
      plannedExercises: [
        {
          exerciseId: 'barbell-bench-press',
          sets: 1,
          plannedSets: [{ id: 'p1', weight: '70', reps: '8' }],
        },
      ],
    },
    exerciseLibrary,
    1000,
  );
  const exercise = seed.exercises[0];
  const prior = {
    ...seed,
    id: 'prior',
    startedAt: 100,
    finishedAt: 200,
    exercises: [
      {
        ...exercise,
        sets: [
          { ...exercise.sets[0], weight: '60', reps: '10', completedAt: 150 },
        ],
      },
    ],
  };
  function Harness() {
    const [session, update] = useState(seed);
    return (
      <Workout
        session={session}
        history={[prior]}
        update={update}
        finish={() => {}}
        busy={false}
      />
    );
  }
  let v: any;
  act(() => {
    v = create(<Harness />);
  });
  try {
    expect(button(v, 'Edit set 1 weight')!.props.accessibilityValue.text).toBe(
      '70',
    );
    expect(
      button(v, 'Edit set 1 repetitions')!.props.accessibilityValue.text,
    ).toBe('8');
    act(() => button(v, 'Complete set 1')!.props.onPress());
    expect(
      v.root.findByType(Workout).props.session.exercises[0].sets[0],
    ).toMatchObject({
      weight: '70',
      reps: '8',
      completedAt: expect.any(Number),
    });
  } finally {
    act(() => v.unmount());
  }
});

it('keeps the exact weight and every row index when rolling away and back', () => {
  const v = render({ set: { id: 's', weight: '62,75', reps: '8' } });
  try {
    const picker = () => v.root.findByType(AppPicker);
    const before = picker().props.columns[0];
    const exact = before.indexOf('62.75');
    act(() => picker().props.onChange(0, before.indexOf('65')));
    expect(picker().props.columns[0]).toEqual(before);
    act(() => picker().props.onChange(0, exact));
    expect(picker().props.selected[0]).toBe(exact);
  } finally {
    act(() => v.unmount());
  }
});
