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
jest.mock(
  '../../assets/exercises/dumbbell-romanian-deadlift/start.webp',
  () => 1101,
);
jest.mock(
  '../../assets/exercises/dumbbell-romanian-deadlift/finish.webp',
  () => 1102,
);
jest.mock(
  '../../assets/exercises/dumbbell-romanian-deadlift/female/start.webp',
  () => 1201,
);
jest.mock(
  '../../assets/exercises/dumbbell-romanian-deadlift/female/finish.webp',
  () => 1202,
);
jest.mock(
  '../../assets/exercises/barbell-romanian-deadlift/start.webp',
  () => 1301,
);
jest.mock(
  '../../assets/exercises/barbell-romanian-deadlift/finish.webp',
  () => 1302,
);
jest.mock(
  '../../assets/exercises/barbell-romanian-deadlift/female/start.webp',
  () => 1401,
);
jest.mock(
  '../../assets/exercises/barbell-romanian-deadlift/female/finish.webp',
  () => 1402,
);
jest.mock('../../assets/exercises/barbell-hip-thrust/start.webp', () => 1501);
jest.mock('../../assets/exercises/barbell-hip-thrust/finish.webp', () => 1502);
jest.mock(
  '../../assets/exercises/barbell-hip-thrust/female/start.webp',
  () => 1601,
);
jest.mock(
  '../../assets/exercises/barbell-hip-thrust/female/finish.webp',
  () => 1602,
);
jest.mock('../../assets/exercises/cable-glute-kickback/start.webp', () => 1701);
jest.mock(
  '../../assets/exercises/cable-glute-kickback/finish.webp',
  () => 1702,
);
jest.mock(
  '../../assets/exercises/cable-glute-kickback/female/start.webp',
  () => 1801,
);
jest.mock(
  '../../assets/exercises/cable-glute-kickback/female/finish.webp',
  () => 1802,
);
jest.mock('../../assets/exercises/standing-calf-raise/start.webp', () => 1901);
jest.mock('../../assets/exercises/standing-calf-raise/finish.webp', () => 1902);
jest.mock(
  '../../assets/exercises/standing-calf-raise/female/start.webp',
  () => 2001,
);
jest.mock(
  '../../assets/exercises/standing-calf-raise/female/finish.webp',
  () => 2002,
);
jest.mock('../../assets/exercises/seated-calf-raise/start.webp', () => 2101);
jest.mock('../../assets/exercises/seated-calf-raise/finish.webp', () => 2102);
jest.mock(
  '../../assets/exercises/seated-calf-raise/female/start.webp',
  () => 2201,
);
jest.mock(
  '../../assets/exercises/seated-calf-raise/female/finish.webp',
  () => 2202,
);
jest.mock(
  '../../assets/exercises/machine-hip-adduction/start.webp',
  () => 2301,
);
jest.mock(
  '../../assets/exercises/machine-hip-adduction/finish.webp',
  () => 2302,
);
jest.mock(
  '../../assets/exercises/machine-hip-adduction/female/start.webp',
  () => 2401,
);
jest.mock(
  '../../assets/exercises/machine-hip-adduction/female/finish.webp',
  () => 2402,
);
jest.mock('../../assets/exercises/kettlebell-swing/start.webp', () => 2501);
jest.mock('../../assets/exercises/kettlebell-swing/finish.webp', () => 2502);
jest.mock(
  '../../assets/exercises/kettlebell-swing/female/start.webp',
  () => 2601,
);
jest.mock(
  '../../assets/exercises/kettlebell-swing/female/finish.webp',
  () => 2602,
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
  expect(
    resolveExerciseArtwork('dumbbell-romanian-deadlift', 'start', 'female'),
  ).toBe(1201);
  expect(
    resolveExerciseArtwork('dumbbell-romanian-deadlift', 'finish', 'female'),
  ).toBe(1202);
  expect(
    resolveExerciseArtwork('dumbbell-romanian-deadlift', 'start', 'male'),
  ).toBe(1101);
  expect(
    resolveExerciseArtwork('dumbbell-romanian-deadlift', 'finish', 'male'),
  ).toBe(1102);
  expect(
    resolveExerciseArtwork('barbell-romanian-deadlift', 'start', 'female'),
  ).toBe(1401);
  expect(
    resolveExerciseArtwork('barbell-romanian-deadlift', 'finish', 'female'),
  ).toBe(1402);
  expect(
    resolveExerciseArtwork('barbell-romanian-deadlift', 'start', 'male'),
  ).toBe(1301);
  expect(
    resolveExerciseArtwork('barbell-romanian-deadlift', 'finish', 'male'),
  ).toBe(1302);
  expect(resolveExerciseArtwork('barbell-hip-thrust', 'start', 'female')).toBe(
    1601,
  );
  expect(resolveExerciseArtwork('barbell-hip-thrust', 'finish', 'female')).toBe(
    1602,
  );
  expect(resolveExerciseArtwork('barbell-hip-thrust', 'start', 'male')).toBe(
    1501,
  );
  expect(resolveExerciseArtwork('barbell-hip-thrust', 'finish', 'male')).toBe(
    1502,
  );
  expect(
    resolveExerciseArtwork('cable-glute-kickback', 'start', 'female'),
  ).toBe(1801);
  expect(
    resolveExerciseArtwork('cable-glute-kickback', 'finish', 'female'),
  ).toBe(1802);
  expect(resolveExerciseArtwork('standing-calf-raise', 'start', 'female')).toBe(
    2001,
  );
  expect(
    resolveExerciseArtwork('standing-calf-raise', 'finish', 'female'),
  ).toBe(2002);
  expect(resolveExerciseArtwork('seated-calf-raise', 'start', 'female')).toBe(
    2201,
  );
  expect(resolveExerciseArtwork('seated-calf-raise', 'finish', 'female')).toBe(
    2202,
  );
  expect(
    resolveExerciseArtwork('machine-hip-adduction', 'start', 'female'),
  ).toBe(2401);
  expect(
    resolveExerciseArtwork('machine-hip-adduction', 'finish', 'female'),
  ).toBe(2402);
  expect(resolveExerciseArtwork('kettlebell-swing', 'start', 'female')).toBe(
    2601,
  );
  expect(resolveExerciseArtwork('kettlebell-swing', 'finish', 'female')).toBe(
    2602,
  );
  for (const id of ['kettlebell-goblet-squat', 'plank', 'unknown'])
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
  ['dumbbell-romanian-deadlift', [1101, 1102, 1101], [1201, 1202, 1201]],
  ['barbell-romanian-deadlift', [1301, 1302, 1301], [1401, 1402, 1401]],
  ['barbell-hip-thrust', [1501, 1502, 1501], [1601, 1602, 1601]],
  ['cable-glute-kickback', [1701, 1702, 1701], [1801, 1802, 1801]],
  ['standing-calf-raise', [1901, 1902, 1901], [2001, 2002, 2001]],
  ['seated-calf-raise', [2101, 2102, 2101], [2201, 2202, 2201]],
  ['machine-hip-adduction', [2301, 2302, 2301], [2401, 2402, 2401]],
  ['kettlebell-swing', [2501, 2502, 2501], [2601, 2602, 2601]],
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
        <ExerciseArtwork imageKey="plank" />
        <TechniqueArtwork imageKey="plank" phase="START" />
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
