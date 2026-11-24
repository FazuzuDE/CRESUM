import { ExerciseTechnique } from '../../components/ExerciseTechnique';
import { ProfileSettings } from '../../components/ProfileSettings';
import { Workout } from '../../components/Workout';
import { startWorkout } from '../workout-engine';
import { exerciseLibrary, findExercise } from '../exercise-library';
import { TemplateEditor } from '../../components/TemplateEditor';
import { ExerciseGroupComposer } from '../../components/ExerciseGroupComposer';
import { ExerciseLibrary } from '../../components/ExerciseLibrary';
import { AppPicker } from '../../components/AppPicker';
import { AppButton } from '../../components/AppButton';
import { ExerciseStatistics } from '../../components/ExerciseStatistics';
import { Image, TextInput } from 'react-native';
import { isPressable } from './pressable';
jest.mock('../../assets/exercises/goblet-squat/start.webp', () => 4401);
jest.mock('../../assets/exercises/goblet-squat/finish.webp', () => 4402);
jest.mock(
  '../../assets/exercises/kettlebell-goblet-squat/start.webp',
  () => 4301,
);
jest.mock(
  '../../assets/exercises/kettlebell-goblet-squat/finish.webp',
  () => 4302,
);
const { act, create } = jest.requireActual('react-test-renderer');
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
}));
jest.mock('expo-blur', () => ({
  BlurView: jest.requireActual('react-native').View,
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));
function press(view: any, label: string) {
  const node = view.root
    .findAll(isPressable)
    .find((x: any) => x.props.accessibilityLabel === label);
  expect(node).toBeDefined();
  act(() => node.props.onPress());
}
for (const mode of ['onAdd', 'onToggle'] as const)
  it(`propagates the chosen concrete kettlebell ID in ${mode}`, () => {
    const chosen = jest.fn();
    let view: any;
    act(() => {
      view = create(
        <ExerciseLibrary visible onClose={() => {}} {...{ [mode]: chosen }} />,
      );
    });
    act(() => view.root.findByType(TextInput).props.onChangeText('Goblet'));
    press(view, 'Change equipment: Dumbbell');
    press(view, 'Kettlebell');
    press(view, mode === 'onAdd' ? 'Add Goblet Squat' : 'Select Goblet Squat');
    expect(chosen.mock.calls[0][0]).toEqual(
      mode === 'onAdd'
        ? expect.objectContaining({
            id: 'kettlebell-goblet-squat',
            equipment: ['kettlebell'],
          })
        : 'kettlebell-goblet-squat',
    );
    act(() => view.unmount());
  });
it('offers All and both equipment statistics filters while retaining metric controls', () => {
  let view: any;
  act(() => {
    view = create(
      <ExerciseStatistics
        history={[]}
        exerciseId="goblet-squat"
        name="Goblet Squat"
        now={Date.now()}
      />,
    );
  });
  press(view, 'All');
  press(view, 'Kettlebell');
  press(view, 'Dumbbell');
  expect(
    view.root
      .findAll(isPressable)
      .some(
        (x: any) => x.props.accessibilityLabel === 'Exercise metric Volume',
      ),
  ).toBe(true);
  act(() => view.unmount());
});

it('opens a saved Goblet plan as a concrete exercise without the Lat Pulldown station composer', () => {
  let view: any;
  act(() => {
    view = create(
      <TemplateEditor
        mode="edit"
        template={{
          id: 'saved',
          name: 'Goblet',
          exerciseIds: ['kettlebell-goblet-squat'],
          plannedExercises: [
            { exerciseId: 'kettlebell-goblet-squat', sets: 2, weight: '24' },
          ],
        }}
        initialExerciseId="kettlebell-goblet-squat"
        busy={false}
        onSave={async () => ({ ok: true })}
        onCancel={() => {}}
      />,
    );
  });
  expect(view.root.findAllByType(ExerciseGroupComposer)).toHaveLength(0);
  expect(
    view.root
      .findAllByType(TextInput)
      .find(
        (x: any) =>
          x.props.accessibilityLabel === 'Starting weight in kilograms',
      )?.props.value,
  ).toBe('24');
  act(() => view.unmount());
});

it('adds a concrete kettlebell exercise directly to a live workout', () => {
  const session = startWorkout(
    { id: 't', name: 'Legs', exerciseIds: ['goblet-squat'] },
    exerciseLibrary,
    100,
  );
  const update = jest.fn();
  let view: any;
  act(() => {
    view = create(
      <Workout
        session={session}
        history={[]}
        update={update}
        finish={() => {}}
        busy={false}
      />,
    );
  });
  act(() =>
    view.root
      .findByType(ExerciseLibrary)
      .props.onAdd(findExercise('kettlebell-goblet-squat')),
  );
  expect(update).toHaveBeenCalledTimes(1);
  expect(
    update.mock.calls[0][0](session).exercises.map((e: any) => e.libraryId),
  ).toEqual(['goblet-squat', 'kettlebell-goblet-squat']);
  expect(view.root.findAllByType(ExerciseGroupComposer)).toHaveLength(0);
  act(() => view.unmount());
});

it('counts the visible family once in the profile library summary', () => {
  let view: any;
  act(() => {
    view = create(
      <ProfileSettings
        templates={[]}
        busy={false}
        createTemplate={async () => ({ ok: true })}
        updateTemplate={async () => ({ ok: true })}
        deleteTemplate={async () => ({ ok: true })}
      />,
    );
  });
  expect(JSON.stringify(view.toJSON())).toContain(
    `${exerciseLibrary.length - 1} exercises`,
  );
  act(() => view.unmount());
});

it('switches Goblet artwork with the equipment choice and retains the selected phase', () => {
  let view: any;
  act(() => {
    view = create(<ExerciseLibrary visible onClose={() => {}} />);
  });
  act(() => view.root.findByType(TextInput).props.onChangeText('Goblet'));
  press(view, 'Technique for Goblet Squat');
  const details = { root: view.root.findByType(ExerciseTechnique) };
  expect(
    details.root.findAllByType(Image).some((x: any) => x.props.source === 4401),
  ).toBe(true);
  press(details, 'Change equipment: Dumbbell');
  press(details, 'Kettlebell');
  expect(
    details.root.findAllByType(Image).some((x: any) => x.props.source === 4301),
  ).toBe(true);
  press(details, 'Show FINISH');
  expect(
    details.root.findAllByType(Image).some((x: any) => x.props.source === 4302),
  ).toBe(true);
  press(details, 'Change equipment: Kettlebell');
  press(details, 'Dumbbell');
  expect(
    details.root.findAllByType(Image).some((x: any) => x.props.source === 4402),
  ).toBe(true);
  act(() => view.unmount());
});

it('adds the variant currently displayed in the guide and reflects its selection in both places', () => {
  jest.useFakeTimers();
  const onAdd = jest.fn();
  const props = { visible: true, onClose: () => {}, onAdd };
  let view: ReturnType<typeof create>;
  act(() => {
    view = create(<ExerciseLibrary {...props} />);
  });
  act(() => view.root.findByType(TextInput).props.onChangeText('Goblet'));
  press(view, 'Technique for Goblet Squat');
  const details = { root: view.root.findByType(ExerciseTechnique) };
  press(details, 'Change equipment: Dumbbell');
  press(details, 'Kettlebell');
  expect(onAdd).not.toHaveBeenCalled();
  press(details, 'Add Goblet Squat');
  expect(onAdd).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'kettlebell-goblet-squat' }),
  );
  act(() =>
    view.update(
      <ExerciseLibrary {...props} selectedIds={['kettlebell-goblet-squat']} />,
    ),
  );
  const added = view.root
    .findAll(isPressable)
    .filter(
      (node: any) =>
        node.props.accessibilityLabel?.includes('Goblet Squat') &&
        node.props.disabled,
    );
  expect(added).toHaveLength(2);
  act(() => jest.advanceTimersByTime(500));
  expect(view.root.findAllByType(ExerciseTechnique)).toHaveLength(0);
  expect(view.root.findByType(TextInput).props.value).toBe('Goblet');
  expect(
    view.root
      .findAll(isPressable)
      .filter(
        (node: any) =>
          node.props.disabled &&
          node.props.accessibilityLabel?.includes('Goblet Squat'),
      ),
  ).toHaveLength(1);
  act(() => view.unmount());
  jest.useRealTimers();
});

it('applies a library wheel filter only after Done and shows the current choice', () => {
  let view: ReturnType<typeof create>;
  act(() => {
    view = create(<ExerciseLibrary visible onClose={() => {}} />);
  });
  press(view, 'Filter equipment All');
  const chooseKettlebell = () => {
    const picker = view.root.findByType(AppPicker);
    act(() =>
      picker.props.onChange(0, picker.props.columns[0].indexOf('Kettlebell')),
    );
  };
  const action = (title: string) =>
    view.root
      .findAllByType(AppButton)
      .find((node: { props: { title: string } }) => node.props.title === title)
      .props.onPress;
  chooseKettlebell();
  act(action('Cancel'));
  press(view, 'Filter equipment All');
  chooseKettlebell();
  act(action('Done'));
  press(view, 'Filter equipment Kettlebell');
  expect(view.root.findByType(AppPicker).props.selected[0]).toBeGreaterThan(0);
  act(() => view.unmount());
});
