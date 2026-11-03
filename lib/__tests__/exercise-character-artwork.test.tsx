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
jest.mock('../../assets/exercises/leg-press/start.webp', () => 301);
jest.mock('../../assets/exercises/leg-press/finish.webp', () => 302);
jest.mock('../../assets/exercises/leg-press/female/start.webp', () => 401);
jest.mock('../../assets/exercises/leg-press/female/finish.webp', () => 402);
jest.mock('../../assets/exercises/leg-extension/start.webp', () => 501);
jest.mock('../../assets/exercises/leg-extension/finish.webp', () => 502);
jest.mock('../../assets/exercises/leg-extension/female/start.webp', () => 601);
jest.mock('../../assets/exercises/leg-extension/female/finish.webp', () => 602);
jest.mock('../../assets/exercises/lying-leg-curl/start.webp', () => 701);
jest.mock('../../assets/exercises/lying-leg-curl/finish.webp', () => 702);
jest.mock('../../assets/exercises/lying-leg-curl/female/start.webp', () => 801);
jest.mock(
  '../../assets/exercises/lying-leg-curl/female/finish.webp',
  () => 802,
);
jest.mock('../../assets/exercises/seated-leg-curl/start.webp', () => 901);
jest.mock('../../assets/exercises/seated-leg-curl/finish.webp', () => 902);
jest.mock(
  '../../assets/exercises/seated-leg-curl/female/start.webp',
  () => 1001,
);
jest.mock(
  '../../assets/exercises/seated-leg-curl/female/finish.webp',
  () => 1002,
);
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
}));

it('resolves female phases only for the approved exact variants', () => {
  expect(resolveExerciseArtwork('goblet-squat', 'start', 'female')).toBe(201);
  expect(resolveExerciseArtwork('goblet-squat', 'finish', 'female')).toBe(202);
  expect(resolveExerciseArtwork('leg-press', 'start', 'female')).toBe(401);
  expect(resolveExerciseArtwork('leg-press', 'finish', 'female')).toBe(402);
  expect(resolveExerciseArtwork('leg-press', 'start', 'male')).toBe(301);
  expect(resolveExerciseArtwork('leg-press', 'finish', 'male')).toBe(302);
  expect(resolveExerciseArtwork('leg-extension', 'start', 'female')).toBe(601);
  expect(resolveExerciseArtwork('leg-extension', 'finish', 'female')).toBe(602);
  expect(resolveExerciseArtwork('leg-extension', 'start', 'male')).toBe(501);
  expect(resolveExerciseArtwork('leg-extension', 'finish', 'male')).toBe(502);
  expect(resolveExerciseArtwork('lying-leg-curl', 'start', 'female')).toBe(801);
  expect(resolveExerciseArtwork('lying-leg-curl', 'finish', 'female')).toBe(
    802,
  );
  expect(resolveExerciseArtwork('lying-leg-curl', 'start', 'male')).toBe(701);
  expect(resolveExerciseArtwork('lying-leg-curl', 'finish', 'male')).toBe(702);
  expect(resolveExerciseArtwork('seated-leg-curl', 'start', 'female')).toBe(
    1001,
  );
  expect(resolveExerciseArtwork('seated-leg-curl', 'finish', 'female')).toBe(
    1002,
  );
  expect(resolveExerciseArtwork('seated-leg-curl', 'start', 'male')).toBe(901);
  expect(resolveExerciseArtwork('seated-leg-curl', 'finish', 'male')).toBe(902);
  for (const id of [
    'kettlebell-goblet-squat',
    'dumbbell-romanian-deadlift',
    'unknown',
  ])
    for (const phase of ['start', 'finish'] as const)
      expect(resolveExerciseArtwork(id, phase, 'female')).toBeNull();
  expect(resolveExerciseArtwork('goblet-squat', 'start', 'male')).toBe(101);
});

it.each([
  ['goblet-squat', [101, 102, 101], [201, 202, 201]],
  ['leg-press', [301, 302, 301], [401, 402, 401]],
  ['leg-extension', [501, 502, 501], [601, 602, 601]],
  ['lying-leg-curl', [701, 702, 701], [801, 802, 801]],
  ['seated-leg-curl', [901, 902, 901], [1001, 1002, 1001]],
] as const)(
  'switches %s thumbnail, inline and fullscreen phases from the shared choice',
  async (imageKey, maleSources, femaleSources) => {
    const render = (model: AssetModel) => (
      <ExerciseCharacterProvider
        value={{ model, saving: false, error: false, disabled: false }}
      >
        <ExerciseArtwork imageKey={imageKey} />
        <TechniqueArtwork imageKey={imageKey} phase="FINISH" />
        <TechniqueViewer
          name={imageKey}
          imageKey={imageKey}
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
    expect(sources()).toEqual(maleSources);
    await act(async () => view.update(render('female')));
    expect(sources()).toEqual(femaleSources);
    await act(async () => view.update(render('male')));
    expect(sources()).toEqual(maleSources);
    await act(async () => view.unmount());
  },
);

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
        <ExerciseArtwork imageKey="dumbbell-romanian-deadlift" />
        <TechniqueArtwork imageKey="dumbbell-romanian-deadlift" phase="START" />
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
