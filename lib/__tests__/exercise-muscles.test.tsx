import * as Native from 'react-native';
import { ExerciseMuscles } from '../../components/ExerciseMuscles';
import { ExerciseTechnique } from '../../components/ExerciseTechnique';
import { ExerciseEquipmentSheet } from '../../components/ExerciseEquipmentSheet';
import { MuscleMap } from '../../components/MuscleMap';
import { LocalizationProvider } from '../../components/LocalizationProvider';
import { LocaleStore } from '../i18n/preference-store';
import { findExercise } from '../exercise-library';
import { isPressable } from './pressable';

const { act, create } = jest.requireActual('react-test-renderer');
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));
jest.mock('expo-blur', () => ({
  BlurView: jest.requireActual('react-native').View,
}));
const press = (v: any, name: string) =>
  act(() =>
    v.root
      .findAll(isPressable)
      .find((n: any) => n.props.accessibilityLabel === name)!
      .props.onPress(),
  );
const copy = (v: any) =>
  v.root
    .findAllByType(Native.Text)
    .map((n: any) => n.props.children)
    .join(' ');

afterEach(() => jest.restoreAllMocks());

it.each([
  [320, 1, 'column'],
  [390, 1.5, 'column'],
  [390, 1, 'row'],
] as const)(
  'keeps labels readable at width %s and fontScale %s',
  (width, fontScale, direction) => {
    jest
      .spyOn(jest.requireActual('react-native'), 'useWindowDimensions')
      .mockReturnValue({ width, height: 844, scale: 3, fontScale });
    let v: any;
    act(() => {
      v = create(<ExerciseMuscles exercise={findExercise('hammer-curl')!} />);
    });
    const row = v.root
      .findAllByType(Native.View)
      .find((n: any) => n.props.testID === 'exercise-muscle-summary')!;
    expect(Native.StyleSheet.flatten(row.props.style).flexDirection).toBe(
      direction,
    );
    expect(copy(v)).toContain('None listed');
    const map = v.root.findByType(MuscleMap);
    expect(map.props.muscles.filter((m: any) => m.secondary)).toEqual([]);
    act(() => v.unmount());
  },
);

it('retains the lower-back projection caveat in summary and expanded details', () => {
  let v: any;
  act(() => {
    v = create(
      <ExerciseMuscles exercise={findExercise('barbell-deadlift')!} />,
    );
  });
  expect(copy(v)).toContain('schematic projections beneath fascia');
  press(v, 'Muscle details for Barbell Deadlift');
  expect(copy(v).match(/schematic projections beneath fascia/g)).toHaveLength(
    2,
  );
  act(() => v.unmount());
});

it('closes stale details and follows the selected exact equipment variant', () => {
  let v: any;
  act(() => {
    v = create(
      <ExerciseTechnique
        exercise={findExercise('lat-pulldown-close-neutral-v-handle')!}
        onClose={() => {}}
      />,
    );
  });
  press(v, 'Muscle details for Close Neutral V-Handle Lat Pulldown');
  expect(v.root.findAllByType(MuscleMap)).toHaveLength(2);
  // Open the existing picker callback through its real equipment row.
  const equipment = v.root
    .findAll(isPressable)
    .find((n: any) =>
      n.props.accessibilityLabel?.startsWith('Change equipment:'),
    )!;
  act(() => equipment.props.onPress());
  act(() =>
    v.root
      .findByType(ExerciseEquipmentSheet)
      .props.onSelect('lat-pulldown-wide-pronated-bar'),
  );
  expect(v.root.findAllByType(MuscleMap)).toHaveLength(1);
  expect(
    v.root
      .findAll(isPressable)
      .some(
        (n: any) =>
          n.props.accessibilityLabel ===
          'Muscle details for Wide Pronated Bar Lat Pulldown',
      ),
  ).toBe(true);
  act(() => v.unmount());
});

it('updates role copy in all four languages while details stay open', async () => {
  const store = new LocaleStore(
    { getItem: async () => null, setItem: async () => {} },
    () => ['en'],
  );
  let v: any;
  await act(async () => {
    v = create(
      <LocalizationProvider store={store}>
        <ExerciseMuscles exercise={findExercise('dumbbell-biceps-curl')!} />
      </LocalizationProvider>,
    );
  });
  press(v, 'Muscle details for Dumbbell Biceps Curl');
  for (const [locale, expected] of [
    ['ru', 'Работающие мышцы'],
    ['de', 'Beanspruchte Muskeln'],
    ['fr', 'Muscles sollicités'],
    ['en', 'Working muscles'],
  ] as const) {
    await act(async () => {
      await store.select(locale);
    });
    expect(copy(v)).toContain(expected);
    expect(v.root.findAllByType(MuscleMap)).toHaveLength(2);
  }
  act(() => v.unmount());
});

it('explains upper-back projection in summary and expanded exercise details', () => {
  let v: any;
  act(() => {
    v = create(
      <ExerciseMuscles exercise={findExercise('seated-cable-row')!} />,
    );
  });
  expect(copy(v)).toContain('beneath trapezius');
  press(v, 'Muscle details for Seated Cable Row');
  expect(copy(v).match(/beneath trapezius/g)).toHaveLength(2);
  act(() => v.unmount());
});
