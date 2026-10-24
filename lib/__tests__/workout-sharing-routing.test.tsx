import { TextInput } from 'react-native';
import { TemplateEditor } from '../../components/TemplateEditor';
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

test('built-in plan opens the exercise library and saves changes as a selected personal copy', async () => {
  const copy = {
    ...defaultTemplates[0],
    id: 'personal-upper',
    name: 'Personal upper',
  };
  let view: ReturnType<typeof create>;
  const props = {
    templates: [...defaultTemplates, copy],
    busy: false,
    client: null,
    signedIn: false,
    onClose: () => {},
    onImport: async () => {
      throw Error();
    },
    onStart: () => {},
    onContinue: () => {},
    hasActiveWorkout: false,
    initialTemplate: defaultTemplates[0],
    onCreate: async () => ({ ok: true as const, template: copy }),
    onUpdate: async () => {
      throw Error('Built-in must not be overwritten');
    },
  };
  await act(async () => {
    view = create(<SharingHub {...props} />);
  });
  const swipe = view!.root.findAll(
    (node: any) => typeof node.props.renderRightActions === 'function',
  )[0];
  await act(async () => swipe.props.renderRightActions().props.onPress());
  expect(
    view!.root
      .findAllByType(TextInput)
      .find((n: any) => n.props.accessibilityLabel === 'Planned sets'),
  ).toBeDefined();
  expect(view!.root.findByType(TemplateEditor).props.initialExerciseId).toBe(
    defaultTemplates[0].exerciseIds[0],
  );
  await act(async () => view!.root.findByType(TemplateEditor).props.onCancel());
  await act(async () =>
    view!.root
      .findAllByType(AppButton)
      .find((b: any) => b.props.title === 'Add Exercise')!
      .props.onPress(),
  );
  expect(view!.root.findByType(TemplateEditor).props.initialStep).toBe(
    'library',
  );
  await act(async () =>
    view!.root.findByType(TemplateEditor).props.onSave({
      name: copy.name,
      exerciseIds: copy.exerciseIds,
    }),
  );
  expect(JSON.stringify(view!.toJSON())).toContain('Personal upper');
  expect(defaultTemplates[0].id).toBe('upper');
  await act(async () => view!.unmount());
});

test('custom plan edits the swiped exercise and retains its draft after a failed save', async () => {
  const template = {
    ...defaultTemplates[0],
    id: 'custom-plan',
    name: 'My plan',
  };
  const exerciseId = template.exerciseIds[1];
  let attempt = 0;
  let saved: any;
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(
      <SharingHub
        templates={[template]}
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
        initialTemplate={template}
        onUpdate={async (id, draft) => {
          expect(id).toBe(template.id);
          saved = draft;
          attempt++;
          return attempt === 1
            ? { ok: false, error: 'disk' }
            : { ok: true, template: { ...template, ...draft } };
        }}
      />,
    );
  });
  const swipeActions = [
    ...new Set(
      view!.root
        .findAll((n: any) => typeof n.props.renderRightActions === 'function')
        .map((n: any) => n.props.renderRightActions),
    ),
  ] as (() => any)[];
  await act(async () => swipeActions[1]().props.onPress());
  expect(view!.root.findByType(TemplateEditor).props.initialExerciseId).toBe(
    exerciseId,
  );
  const sets = view!.root
    .findAllByType(TextInput)
    .find((n: any) => n.props.accessibilityLabel === 'Planned sets');
  await act(async () => sets.props.onChangeText('5'));
  const press = async (title: string) =>
    act(async () =>
      view!.root
        .findAllByType(AppButton)
        .find((b: any) => b.props.title === title)!
        .props.onPress(),
    );
  await press('Update Exercise');
  await press('Save Workout');
  expect(JSON.stringify(view!.toJSON())).toContain(
    'Workout could not be saved. Try again.',
  );
  expect(
    saved.plannedExercises.find((e: any) => e.exerciseId === exerciseId).sets,
  ).toBe(5);
  expect(saved.exerciseIds).toEqual(template.exerciseIds);
  await press('Save Workout');
  expect(view!.root.findAllByType(TemplateEditor)).toHaveLength(0);
  expect(attempt).toBe(2);
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

test('creates from the plan hub, retains failed drafts and returns to plans after save', async () => {
  let saved = false;
  let editing = false;
  let view: ReturnType<typeof create>;
  const draft = { name: 'New plan', exerciseIds: ['barbell-bench-press'] };
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
        onStart={() => {}}
        onContinue={() => {}}
        hasActiveWorkout={false}
        onEditorChange={(value) => {
          editing = value;
        }}
        onCreate={async () =>
          saved ? { ok: true } : { ok: false, error: 'Save failed' }
        }
      />,
    );
  });
  await act(async () =>
    view!.root
      .findAllByType(AppButton)
      .find(
        (b: { props: { title: string } }) => b.props.title === 'Create Workout',
      )!
      .props.onPress(),
  );
  expect(editing).toBe(true);
  const editor = view!.root.findByType(TemplateEditor);
  await act(async () =>
    expect(await editor.props.onSave(draft)).toEqual({
      ok: false,
      error: 'Save failed',
    }),
  );
  expect(view!.root.findAllByType(TemplateEditor)).toHaveLength(1);
  saved = true;
  await act(async () => editor.props.onSave(draft));
  expect(view!.root.findAllByType(TemplateEditor)).toHaveLength(0);
  expect(editing).toBe(false);
  expect(JSON.stringify(view!.toJSON())).toContain('Workout plans');
  await act(async () => view!.unmount());
});
