import { Image, Text } from 'react-native';
import { ExerciseArtwork } from '../../components/ExerciseArtwork';
import { TechniqueArtwork } from '../../components/TechniqueArtwork';
import { TechniqueViewer } from '../../components/TechniqueViewer';
import { ExerciseCharacterProvider } from '../../components/ExerciseCharacterProvider';
import { resolveExerciseArtwork } from '../exercise-artwork';
import type { AssetModel } from '../exercise-variant-model';

const { act, create } = jest.requireActual('react-test-renderer');
jest.mock('../../assets/exercises/goblet-squat/start.webp', () => 101);
jest.mock('../../assets/exercises/goblet-squat/finish.webp', () => 102);
jest.mock('../../assets/exercises/goblet-squat/female/start.webp', () => 201, {
  virtual: true,
});
jest.mock('../../assets/exercises/goblet-squat/female/finish.webp', () => 202, {
  virtual: true,
});
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
}));

it('resolves female phases only for the approved dumbbell variant', () => {
  expect(resolveExerciseArtwork('goblet-squat', 'start', 'female')).toBe(201);
  expect(resolveExerciseArtwork('goblet-squat', 'finish', 'female')).toBe(202);
  for (const id of ['kettlebell-goblet-squat', 'leg-press', 'unknown'])
    for (const phase of ['start', 'finish'] as const)
      expect(resolveExerciseArtwork(id, phase, 'female')).toBeNull();
  expect(resolveExerciseArtwork('goblet-squat', 'start', 'male')).toBe(101);
});

it('switches thumbnail, inline phase and fullscreen phase from the shared choice', async () => {
  const render = (model: AssetModel) => (
    <ExerciseCharacterProvider
      value={{ model, saving: false, error: false, disabled: false }}
    >
      <ExerciseArtwork imageKey="goblet-squat" />
      <TechniqueArtwork imageKey="goblet-squat" phase="FINISH" />
      <TechniqueViewer
        name="Goblet Squat"
        imageKey="goblet-squat"
        phase="START"
        onPhase={() => {}}
        onClose={() => {}}
      />
    </ExerciseCharacterProvider>
  );
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(render('male'));
  });
  const sources = () =>
    view.root.findAllByType(Image).map((node: any) => node.props.source);
  expect(sources()).toEqual([101, 102, 101]);
  await act(async () => view.update(render('female')));
  expect(sources()).toEqual([201, 202, 201]);
  await act(async () => view.update(render('male')));
  expect(sources()).toEqual([101, 102, 101]);
  await act(async () => view.unmount());
});

it('shows a female pending placeholder instead of a male image', async () => {
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(
      <ExerciseCharacterProvider
        value={{
          model: 'female',
          saving: false,
          error: false,
          disabled: false,
        }}
      >
        <ExerciseArtwork imageKey="leg-press" />
        <TechniqueArtwork imageKey="leg-press" phase="START" />
      </ExerciseCharacterProvider>,
    );
  });
  expect(view.root.findAllByType(Image)).toHaveLength(0);
  expect(
    view.root
      .findAllByType(Text)
      .some((node: any) => node.props.children === 'Preparing'),
  ).toBe(true);
  expect(
    view.root
      .findAllByType(Text)
      .some(
        (node: any) =>
          node.props.children === 'Female illustration is being prepared',
      ),
  ).toBe(true);
  await act(async () => view.unmount());
});
