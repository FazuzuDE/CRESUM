import { TextInput } from 'react-native';
import { TemplateEditor } from '../../components/TemplateEditor';
import { ExerciseGroupComposer } from '../../components/ExerciseGroupComposer';
import { WorkoutHistory } from '../../components/WorkoutHistory';
import { PlanPreview } from '../../components/workout-sharing/PlanPreview';
import { AppButton } from '../../components/AppButton';
import { Confirmation } from '../../components/Confirmation';
import { findExercise } from '../exercise-library';
import { isPressable } from './pressable';
import { parseSharedPlan } from '../workout-sharing/contract';
import { exportSharedPlan } from '../workout-sharing/adapter';
import type {
  PlannedExercise,
  WorkoutTemplate,
  WorkoutSession,
} from '../workout-model';
const { act, create } = jest.requireActual('react-test-renderer');
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));
beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});
const ids = [
  'lat-pulldown-close-neutral-ergonomic-handle',
  'lat-pulldown-close-neutral-v-handle',
];
const template = (): WorkoutTemplate => ({
  id: 'plan',
  name: 'Pull',
  exerciseIds: ids,
  plannedExercises: ids.map((exerciseId, i) => ({
    exerciseId,
    sets: 2,
    exerciseGroup: {
      id: 'station',
      familyId: 'lat-pulldown',
      name: 'Frozen station',
    },
    plannedSets: [
      { id: `${i}a`, weight: String(45 - i * 5), reps: '12' },
      { id: `${i}b`, weight: '35', reps: '8' },
    ],
  })),
});
const button = (v: any, title: string) =>
  v.root.findAllByType(AppButton).find((n: any) => n.props.title === title)!;
const press = (v: any, label: string) =>
  act(() =>
    v.root
      .findAll(isPressable)
      .find((n: any) => n.props.accessibilityLabel === label)!
      .props.onPress(),
  );
const field = (v: any, label: string, value: string) =>
  act(() =>
    v.root
      .findAllByType(TextInput)
      .find((n: any) => n.props.accessibilityLabel === label)!
      .props.onChangeText(value),
  );

it('shares station drafts across sibling entry points and does not revert the newer accepted sibling', () => {
  let view: any;
  act(() => {
    view = create(
      <TemplateEditor
        mode="edit"
        template={template()}
        initialExerciseId={ids[0]}
        busy={false}
        onSave={async () => ({ ok: true })}
        onCancel={() => {}}
      />,
    );
  });
  field(view, 'Weight for set 1', '50');
  act(() => view.root.findByType(ExerciseGroupComposer).props.onCancel());
  press(view, `Edit ${findExercise(ids[1])!.name}`);
  expect(
    view.root
      .findAll(isPressable)
      .some(
        (n: any) => n.props.accessibilityLabel === 'Change equipment: V-handle',
      ),
  ).toBe(true);
  field(view, 'Weight for set 3', '60');
  act(() => button(view, 'Add group to workout').props.onPress());
  press(view, `Edit ${findExercise(ids[0])!.name}`);
  expect(
    view.root
      .findAllByType(TextInput)
      .find((n: any) => n.props.accessibilityLabel === 'Weight for set 3').props
      .value,
  ).toBe('60');
  act(() => view.unmount());
});

it('preserves and edits imported scalar per-row prescriptions including deliberate count growth', async () => {
  const original: WorkoutTemplate = {
    id: 'bench',
    name: 'Bench',
    exerciseIds: ['barbell-bench-press'],
    plannedExercises: [
      {
        exerciseId: 'barbell-bench-press',
        sets: 2,
        weight: '55',
        plannedSets: [
          { id: 'a', weight: '60', reps: '12' },
          { id: 'b', weight: '65', reps: '8' },
        ],
      },
    ],
  };
  let saved: any;
  let view: any;
  act(() => {
    view = create(
      <TemplateEditor
        mode="edit"
        template={original}
        initialExerciseId="barbell-bench-press"
        busy={false}
        onSave={async (d) => {
          saved = d;
          return { ok: true };
        }}
        onCancel={() => {}}
      />,
    );
  });
  act(() => button(view, 'Update Exercise').props.onPress());
  await act(async () => button(view, 'Save Workout').props.onPress());
  expect(saved.plannedExercises[0].plannedSets).toEqual(
    original.plannedExercises![0].plannedSets,
  );
  press(view, `Edit ${findExercise('barbell-bench-press')!.name}`);
  field(view, 'Weight for set 2', '67.5');
  field(view, 'Planned sets', '3');
  field(view, 'Starting weight in kilograms', '');
  act(() => button(view, 'Update Exercise').props.onPress());
  await act(async () => button(view, 'Save Workout').props.onPress());
  expect(saved.plannedExercises[0].weight).toBeUndefined();
  expect(saved.plannedExercises[0].plannedSets).toHaveLength(3);
  expect(saved.plannedExercises[0].plannedSets[1]).toEqual({
    id: 'b',
    weight: '67.5',
    reps: '8',
  });
  expect(saved.plannedExercises[0].plannedSets[2].weight).toBeUndefined();
  act(() => view.unmount());
});

it('retains group membership when a valid imported family has no picker policy', async () => {
  const e: PlannedExercise = {
    exerciseId: 'barbell-bench-press',
    sets: 1,
    exerciseGroup: {
      id: 'benchg',
      familyId: 'bench-press',
      name: 'Bench station',
    },
    plannedSets: [{ id: 'a', weight: '60', reps: '8' }],
  };
  let saved: any;
  let view: any;
  act(() => {
    view = create(
      <TemplateEditor
        mode="edit"
        template={{
          id: 'p',
          name: 'P',
          exerciseIds: [e.exerciseId],
          plannedExercises: [e],
        }}
        initialExerciseId={e.exerciseId}
        busy={false}
        onSave={async (d) => {
          saved = d;
          return { ok: true };
        }}
        onCancel={() => {}}
      />,
    );
  });
  const composer = view.root.findAllByType(ExerciseGroupComposer);
  if (composer.length)
    act(() => button(view, 'Add group to workout').props.onPress());
  else act(() => button(view, 'Update Exercise').props.onPress());
  await act(async () => button(view, 'Save Workout').props.onPress());
  expect(saved.plannedExercises[0]).toEqual(e);
  act(() => view.unmount());
});

it('converts an existing generic pulldown explicitly without losing weight, target or provenance', async () => {
  const target = {
    repMin: 8,
    repMax: 12,
    restMin: 120,
    restMax: 180,
    programId: 'starter',
    revision: 1,
    sourceRefs: ['source'],
  };
  let saved: PlannedExercise[] = [];
  let view: any;
  act(() => {
    view = create(
      <ExerciseGroupComposer
        initialExerciseId="lat-pulldown"
        initialEntries={[
          { exerciseId: 'lat-pulldown', sets: 2, weight: '35', target },
        ]}
        onApply={(e) => {
          saved = e;
          return true;
        }}
        onCancel={() => {}}
      />,
    );
  });
  press(view, 'Change equipment: Choose a handle');
  press(view, 'Short ergonomic handle');
  act(() => button(view, 'Add sets').props.onPress());
  await act(async () => button(view, 'Add group to workout').props.onPress());
  expect(saved[0].sets).toBe(2);
  expect(saved[0].plannedSets?.map((s) => s.weight)).toEqual(['35', '35']);
  expect(saved[0].target).toEqual(target);
  act(() => view.unmount());
});

it('keeps frozen child labels in grouped History with unknown or unmapped equipment', () => {
  const w: WorkoutSession = {
    id: 'saved',
    templateId: 'p',
    name: 'Saved',
    startedAt: 100,
    finishedAt: 200,
    currentExerciseIndex: 0,
    restDurationSeconds: 90,
    exercises: ['retired-attachment', 'barbell-bench-press'].map(
      (libraryId, i) => ({
        id: String(i),
        libraryId,
        name: `Frozen child ${i}`,
        muscle: 'Saved',
        exerciseGroup: {
          id: 'g',
          familyId: 'bench-press',
          name: 'Frozen group',
        },
        sets: [{ id: `r${i}`, weight: '60', reps: '8', completedAt: 150 }],
      }),
    ),
  };
  let view: any;
  act(() => {
    view = create(<WorkoutHistory history={[w]} />);
  });
  press(view, 'Open Saved workout details');
  expect(JSON.stringify(view.toJSON())).toContain('Frozen child 0');
  expect(JSON.stringify(view.toJSON())).toContain('Frozen child 1');
  act(() => view.unmount());
});

it('shows V2 station and exact row prescriptions before import, without leaking omitted weights', () => {
  const plan = exportSharedPlan(template(), true);
  let view: any;
  const render = (p: ReturnType<typeof parseSharedPlan>) => (
    <PlanPreview
      plan={p}
      origin={{
        publicationId: '550e8400-e29b-41d4-a716-446655440000',
        version: 1,
      }}
      onImport={async () => ({ template: template(), created: true })}
      onStart={() => {}}
      onContinue={() => {}}
      hasActiveWorkout={false}
    />
  );
  act(() => {
    view = create(render(plan));
  });
  let output = JSON.stringify(view.toJSON());
  expect(output).toContain('Frozen station');
  expect(output).toContain('45 kg');
  expect(output).toContain('12');
  act(() => view.update(render(exportSharedPlan(template(), false))));
  output = JSON.stringify(view.toJSON());
  expect(output).not.toContain('45 kg');
  expect(output).toContain('12');
  act(() => view.unmount());
});

const scalarPresetTemplate = (): WorkoutTemplate => ({
  id: 'scalar-presets',
  name: 'Bench',
  exerciseIds: ['barbell-bench-press'],
  plannedExercises: [
    {
      exerciseId: 'barbell-bench-press',
      sets: 3,
      plannedSets: [
        { id: 'first', weight: '60', reps: '12' },
        { id: 'second', weight: '65', reps: '10' },
        { id: 'third', weight: '70', reps: '8' },
      ],
    },
  ],
});

it.each([
  ['Weight for set 2', '67.5'],
  ['Repetitions for set 2', '11'],
])(
  'confirms cancellation of a changed per-set prescription: %s',
  (label, value) => {
    const original = scalarPresetTemplate();
    const before = JSON.stringify(original);
    const save = jest.fn(async () => ({ ok: true as const })),
      cancel = jest.fn();
    let view: any;
    act(() => {
      view = create(
        <TemplateEditor
          mode="edit"
          template={original}
          initialExerciseId="barbell-bench-press"
          busy={false}
          onSave={save}
          onCancel={cancel}
        />,
      );
    });
    try {
      field(view, label, value);
      act(() => button(view, 'Cancel').props.onPress());
      expect(view.root.findByType(Confirmation).props.visible).toBe(true);
      expect(cancel).not.toHaveBeenCalled();
      expect(save).not.toHaveBeenCalled();
      act(() => view.root.findByType(Confirmation).props.onCancel());
      expect(view.root.findByType(Confirmation).props.visible).toBe(false);
      expect(
        view.root
          .findAllByType(TextInput)
          .find((n: any) => n.props.accessibilityLabel === label).props.value,
      ).toBe(value);
      act(() => button(view, 'Cancel').props.onPress());
      act(() => view.root.findByType(Confirmation).props.onConfirm());
      expect(cancel).toHaveBeenCalledTimes(1);
      expect(save).not.toHaveBeenCalled();
      expect(JSON.stringify(original)).toBe(before);
    } finally {
      act(() => view.unmount());
    }
  },
);

it('closes an untouched per-set prescription without a discard warning', () => {
  const cancel = jest.fn();
  let view: any;
  act(() => {
    view = create(
      <TemplateEditor
        mode="edit"
        template={scalarPresetTemplate()}
        initialExerciseId="barbell-bench-press"
        busy={false}
        onSave={async () => ({ ok: true })}
        onCancel={cancel}
      />,
    );
  });
  try {
    act(() => button(view, 'Cancel').props.onPress());
    expect(view.root.findByType(Confirmation).props.visible).toBe(false);
    expect(cancel).toHaveBeenCalledTimes(1);
  } finally {
    act(() => view.unmount());
  }
});
