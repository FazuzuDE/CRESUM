import { SharingHub } from '../../components/workout-sharing/SharingHub';
import { AppButton } from '../../components/AppButton';
import { defaultTemplates } from '../workout-catalog';
const { act, create } = jest.requireActual('react-test-renderer');
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
}));
jest.mock('expo-camera', () => ({
  CameraView: jest.requireActual('react-native').View,
  useCameraPermissions: () => [{ granted: false }, async () => {}],
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock',
  ),
);
test('saved plan exposes start independently from square share action', async () => {
  let starts = 0;
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(
      <SharingHub
        templates={defaultTemplates}
        busy={false}
        client={null}
        signedIn={false}
        onClose={() => {}}
        onImport={async () => {
          throw Error();
        }}
        onStart={() => {
          starts++;
        }}
        onContinue={() => {}}
        hasActiveWorkout={false}
        initialTemplate={defaultTemplates[0]}
      />,
    );
  });
  const buttons = view!.root.findAllByType(AppButton);
  await act(async () =>
    buttons
      .find(
        (b: { props: { title: string } }) => b.props.title === 'Start workout',
      )!
      .props.onPress(),
  );
  expect(starts).toBe(1);
  await act(async () => view!.unmount());
});

test('an incoming plan stays preview-only until explicit import', async () => {
  let imports = 0;
  let view: ReturnType<typeof create>;
  const client = {
    resolve: async () => ({
      origin: {
        publicationId: '550e8400-e29b-41d4-a716-446655440000',
        version: 1,
      },
      plan: {
        schemaVersion: 1,
        title: 'Incoming',
        exercises: [{ exerciseId: 'barbell-bench-press', sets: 2 }],
      },
    }),
  };
  await act(async () => {
    view = create(
      <SharingHub
        templates={[]}
        busy={false}
        client={client as never}
        signedIn={false}
        onClose={() => {}}
        onImport={async () => {
          imports++;
          return {
            template: {
              id: 'new',
              name: 'Incoming',
              exerciseIds: ['barbell-bench-press'],
            },
            created: true,
          };
        }}
        onStart={() => {}}
        onContinue={() => {}}
        hasActiveWorkout={false}
        initialToken={'a'.repeat(64)}
      />,
    );
  });
  expect(imports).toBe(0);
  expect(JSON.stringify(view!.toJSON())).toContain('Incoming');
  await act(async () =>
    view!.root
      .findAllByType(AppButton)
      .find(
        (b: { props: { title: string } }) => b.props.title === 'Save for later',
      )!
      .props.onPress(),
  );
  expect(imports).toBe(1);
  await act(async () => view!.unmount());
});

test('saved-copy details show the instructions that starting that copy will use', async () => {
  const saved = {
    id: 'edited',
    name: 'Edited copy',
    exerciseIds: ['barbell-bench-press'],
    plannedExercises: [
      {
        exerciseId: 'barbell-bench-press',
        sets: 4,
        weight: '12.50',
        target: {
          kind: 'authored' as const,
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
      <SharingHub
        templates={[saved]}
        busy={false}
        client={null}
        signedIn={false}
        onClose={() => {}}
        onImport={async () => {
          throw Error();
        }}
        onStart={() => {}}
        onContinue={() => {}}
        hasActiveWorkout={false}
        initialTemplate={saved}
      />,
    );
  });
  const json = JSON.stringify(view!.toJSON());
  expect(json).toContain('12.50');
  expect(json).toContain('60–90');
  expect(json).toContain('per side');
  await act(async () => view!.unmount());
});
