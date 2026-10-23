import { PlanPreview } from '../../components/workout-sharing/PlanPreview';
import { AppButton } from '../../components/AppButton';
import { parseSharedPlan } from '../workout-sharing/contract';
const { act, create } = jest.requireActual('react-test-renderer');
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));
const plan = parseSharedPlan({
  schemaVersion: 1,
  title: 'My plan',
  exercises: [{ exerciseId: 'barbell-bench-press', sets: 2 }],
});
const origin = {
  publicationId: '550e8400-e29b-41d4-a716-446655440000',
  version: 1,
};
const template = {
  id: 'saved',
  name: 'My plan',
  exerciseIds: ['barbell-bench-press'],
};
test('waits for durable save, then starts once and preserves saved copy if starting fails', async () => {
  let resolve: (v: {
    template: typeof template;
    created: boolean;
  }) => void = () => {};
  let starts = 0;
  const save = () =>
    new Promise<{ template: typeof template; created: boolean }>((r) => {
      resolve = r;
    });
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(
      <PlanPreview
        plan={plan}
        origin={origin}
        onImport={save}
        onStart={() => {
          starts++;
          throw Error('start failed');
        }}
        hasActiveWorkout={false}
        onContinue={() => {}}
      />,
    );
  });
  const button = () =>
    view!.root
      .findAllByType(AppButton)
      .find(
        (b: { props: { title: string } }) => b.props.title === 'Add and start',
      );
  await act(async () => {
    button()!.props.onPress();
    button()!.props.onPress();
  });
  expect(starts).toBe(0);
  await act(async () => {
    resolve({ template, created: true });
  });
  expect(starts).toBe(1);
  expect(
    view!.root
      .findAllByType(AppButton)
      .some(
        (b: { props: { title: string } }) =>
          b.props.title === 'Start saved copy',
      ),
  ).toBe(true);
  await act(async () => view!.unmount());
});
test('active workout makes save available and never replaces the session', async () => {
  let imports = 0,
    starts = 0;
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(
      <PlanPreview
        plan={plan}
        origin={origin}
        onImport={async () => {
          imports++;
          return { template, created: true };
        }}
        onStart={() => {
          starts++;
        }}
        hasActiveWorkout
        onContinue={() => {}}
      />,
    );
  });
  const buttons = view!.root.findAllByType(AppButton);
  expect(
    buttons.some(
      (b: { props: { title: string } }) => b.props.title === 'Add and start',
    ),
  ).toBe(false);
  await act(async () =>
    buttons
      .find(
        (b: { props: { title: string } }) => b.props.title === 'Save for later',
      )!
      .props.onPress(),
  );
  expect(imports).toBe(1);
  expect(starts).toBe(0);
  await act(async () => view!.unmount());
});

test('reopened remote plan provides a destination for the actual edited saved copy', async () => {
  const edited = {
    id: 'local-copy',
    name: 'My edited plan',
    exerciseIds: ['seated-cable-row'],
  };
  let opened = '';
  let started = '';
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(
      <PlanPreview
        plan={plan}
        origin={origin}
        savedTemplate={edited}
        onImport={async () => {
          throw Error('must not import');
        }}
        onStart={(value) => {
          started = value.id;
        }}
        onOpenSaved={(value) => {
          opened = value.id;
        }}
        hasActiveWorkout={false}
        onContinue={() => {}}
      />,
    );
  });
  const buttons = view!.root.findAllByType(AppButton);
  await act(async () =>
    buttons
      .find(
        (b: { props: { title: string } }) =>
          b.props.title === 'Open saved copy',
      )!
      .props.onPress(),
  );
  expect(opened).toBe('local-copy');
  await act(async () =>
    buttons
      .find(
        (b: { props: { title: string } }) =>
          b.props.title === 'Start saved copy',
      )!
      .props.onPress(),
  );
  expect(started).toBe('local-copy');
  await act(async () => view!.unmount());
});

test('shows shared weights, per-side instructions and rest range before import', async () => {
  const detailed = {
    ...plan,
    exercises: [
      {
        ...plan.exercises[0],
        weightKg: '12.50',
        target: {
          repMin: 8,
          repMax: 12,
          restMin: 60,
          restMax: 90,
          perSide: true,
        },
      },
    ],
  };
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(
      <PlanPreview
        plan={detailed}
        origin={origin}
        onImport={async () => {
          throw Error();
        }}
        onStart={() => {}}
        hasActiveWorkout={false}
        onContinue={() => {}}
      />,
    );
  });
  const json = JSON.stringify(view!.toJSON());
  expect(json).toContain('12.50');
  expect(json).toContain('kg');
  expect(json).toContain('60–90');
  expect(json).toContain('per side');
  await act(async () => view!.unmount());
});
