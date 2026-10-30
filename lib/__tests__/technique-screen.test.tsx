import { MuscleMap } from '../../components/MuscleMap';
import { Path } from 'react-native-svg';
import { colors } from '../theme';
import { ExerciseLibrary } from '../../components/ExerciseLibrary';
import { TextInput, Linking, Image, StyleSheet, Modal } from 'react-native';
import { resolveExerciseArtwork } from '../exercise-artwork';
import { isPressable } from './pressable';
jest.mock(
  '../../assets/exercises/cable-triceps-pushdown/start.webp',
  () => 2601,
);
jest.mock(
  '../../assets/exercises/cable-triceps-pushdown/finish.webp',
  () => 2602,
);
jest.mock('../../assets/exercises/cable-biceps-curl/start.webp', () => 2501);
jest.mock('../../assets/exercises/cable-biceps-curl/finish.webp', () => 2502);
jest.mock('../../assets/exercises/hammer-curl/start.webp', () => 2401);
jest.mock('../../assets/exercises/hammer-curl/finish.webp', () => 2402);
jest.mock('../../assets/exercises/ez-bar-curl/start.webp', () => 2301);
jest.mock('../../assets/exercises/ez-bar-curl/finish.webp', () => 2302);
jest.mock('../../assets/exercises/barbell-curl/start.webp', () => 2201);
jest.mock('../../assets/exercises/barbell-curl/finish.webp', () => 2202);
jest.mock('../../assets/exercises/dumbbell-biceps-curl/start.webp', () => 2101);
jest.mock(
  '../../assets/exercises/dumbbell-biceps-curl/finish.webp',
  () => 2102,
);
jest.mock(
  '../../assets/exercises/resistance-band-pull-apart/start.webp',
  () => 2001,
);
jest.mock(
  '../../assets/exercises/resistance-band-pull-apart/finish.webp',
  () => 2002,
);
jest.mock('../../assets/exercises/reverse-pec-deck/start.webp', () => 1901);
jest.mock('../../assets/exercises/reverse-pec-deck/finish.webp', () => 1902);
jest.mock('../../assets/exercises/cable-lateral-raise/start.webp', () => 1801);
jest.mock('../../assets/exercises/cable-lateral-raise/finish.webp', () => 1802);
jest.mock(
  '../../assets/exercises/dumbbell-lateral-raise/start.webp',
  () => 1701,
);
jest.mock(
  '../../assets/exercises/dumbbell-lateral-raise/finish.webp',
  () => 1702,
);
jest.mock(
  '../../assets/exercises/machine-shoulder-press/start.webp',
  () => 1601,
);
jest.mock(
  '../../assets/exercises/machine-shoulder-press/finish.webp',
  () => 1602,
);
jest.mock(
  '../../assets/exercises/barbell-overhead-press/start.webp',
  () => 1501,
);
jest.mock(
  '../../assets/exercises/barbell-overhead-press/finish.webp',
  () => 1502,
);
jest.mock(
  '../../assets/exercises/dumbbell-shoulder-press/start.webp',
  () => 1401,
);
jest.mock(
  '../../assets/exercises/dumbbell-shoulder-press/finish.webp',
  () => 1402,
);
jest.mock('../../assets/exercises/barbell-deadlift/start.webp', () => 1301);
jest.mock('../../assets/exercises/barbell-deadlift/finish.webp', () => 1302);
jest.mock(
  '../../assets/exercises/cable-straight-arm-pulldown/start.webp',
  () => 1201,
);
jest.mock(
  '../../assets/exercises/cable-straight-arm-pulldown/finish.webp',
  () => 1202,
);
jest.mock('../../assets/exercises/machine-high-row/start.webp', () => 1101);
jest.mock('../../assets/exercises/machine-high-row/finish.webp', () => 1102);
jest.mock('../../assets/exercises/assisted-pull-up/start.webp', () => 1001);
jest.mock('../../assets/exercises/assisted-pull-up/finish.webp', () => 1002);
jest.mock('../../assets/exercises/pull-up/start.webp', () => 901);
jest.mock('../../assets/exercises/pull-up/finish.webp', () => 902);
jest.mock('../../assets/exercises/barbell-bent-over-row/start.webp', () => 801);
jest.mock(
  '../../assets/exercises/barbell-bent-over-row/finish.webp',
  () => 802,
);
jest.mock(
  '../../assets/exercises/lat-pulldown-wide-pronated-bar/start.webp',
  () => 301,
);
jest.mock(
  '../../assets/exercises/lat-pulldown-wide-pronated-bar/finish.webp',
  () => 302,
);

jest.mock(
  '../../assets/exercises/lat-pulldown-reverse-grip/start.webp',
  () => 401,
);
jest.mock(
  '../../assets/exercises/lat-pulldown-reverse-grip/finish.webp',
  () => 402,
);
jest.mock(
  '../../assets/exercises/seated-cable-row-close-neutral-v-handle/start.webp',
  () => 501,
);
jest.mock(
  '../../assets/exercises/seated-cable-row-close-neutral-v-handle/finish.webp',
  () => 502,
);
jest.mock('../../assets/exercises/one-arm-dumbbell-row/start.webp', () => 601);
jest.mock('../../assets/exercises/one-arm-dumbbell-row/finish.webp', () => 602);
jest.mock(
  '../../assets/exercises/chest-supported-dumbbell-row/start.webp',
  () => 701,
);
jest.mock(
  '../../assets/exercises/chest-supported-dumbbell-row/finish.webp',
  () => 702,
);
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
const render = (props: object = {}) => {
  let v!: ReturnType<typeof create>;
  act(() => {
    v = create(<ExerciseLibrary visible onClose={() => {}} {...props} />);
  });
  return v;
};
const button = (v: ReturnType<typeof create>, label: string) =>
  v.root
    .findAll(isPressable)
    .find((n: any) => n.props.accessibilityLabel === label);
const text = (v: ReturnType<typeof create>) => JSON.stringify(v.toJSON());

it('opens the correct offline guide from thumbnail without toggling or adding an exercise', () => {
  const add = jest.fn(),
    toggle = jest.fn(),
    v = render({ onAdd: add, onToggle: toggle });
  try {
    const technique = button(
      v,
      'Technique for Close Neutral V-Handle Lat Pulldown',
    );
    expect(technique).toBeDefined();
    act(() => technique!.props.onPress());
    expect(text(v)).toContain('Setup');
    expect(text(v)).toContain('V-handle');
    const illustration = v.root
      .findAllByType(Image)
      .find(
        (n: any) =>
          n.props.accessibilityLabel ===
          'Close Neutral V-Handle Lat Pulldown: START',
      );
    expect(illustration?.props.source).toEqual(
      resolveExerciseArtwork(
        'lat-pulldown-close-neutral-v-handle',
        'start',
        'male',
      ),
    );
    expect(add).not.toHaveBeenCalled();
    expect(toggle).not.toHaveBeenCalled();
    act(() => button(v, 'Common mistakes')!.props.onPress());
    expect(text(v)).toContain('Overpulling elbows');
    act(() => button(v, 'Close technique')!.props.onPress());
    expect(button(v, 'Close technique')).toBeUndefined();
  } finally {
    act(() => v.unmount());
  }
});
it('opens from a browse name and preserves query and phase across full-screen viewing', () => {
  const v = render({ presentation: 'page' });
  try {
    act(() => v.root.findByType(TextInput).props.onChangeText('V-Handle'));
    act(() =>
      button(v, 'View Close Neutral V-Handle Lat Pulldown')!.props.onPress(),
    );
    act(() => button(v, 'Show FINISH')!.props.onPress());
    act(() => button(v, 'Expand exercise illustration')!.props.onPress());
    expect(button(v, 'Close full-screen illustration')).toBeDefined();
    const illustrations = v.root
      .findAllByType(Image)
      .filter(
        (n: any) =>
          n.props.accessibilityLabel ===
          'Close Neutral V-Handle Lat Pulldown: FINISH',
      );
    expect(illustrations).toHaveLength(2);
    for (const image of illustrations) {
      expect(image.props.source).toEqual(
        resolveExerciseArtwork(
          'lat-pulldown-close-neutral-v-handle',
          'finish',
          'male',
        ),
      );
    }
    act(() => button(v, 'Close full-screen illustration')!.props.onPress());
    expect(button(v, 'Show FINISH')!.props.accessibilityState.selected).toBe(
      true,
    );
    act(() => button(v, 'Close technique')!.props.onPress());
    expect(v.root.findByType(TextInput).props.value).toBe('V-Handle');
  } finally {
    act(() => v.unmount());
  }
});
it.each([
  ['Wide Pronated Bar Lat Pulldown', 301, 302],
  ['Reverse-Grip Lat Pulldown', 401, 402],
  ['Close Neutral V-Handle Seated Cable Row', 501, 502],
  ['One-Arm Dumbbell Row', 601, 602],
  ['Chest-Supported Dumbbell Row', 701, 702],
  ['Barbell Bent-Over Row', 801, 802],
  ['Pull-Up', 901, 902],
  ['Assisted Pull-Up', 1001, 1002],
  ['Machine High Row', 1101, 1102],
  ['Cable Straight-Arm Pulldown', 1201, 1202],
  ['Barbell Deadlift', 1301, 1302],
  ['Dumbbell Shoulder Press', 1401, 1402],
  ['Barbell Overhead Press', 1501, 1502],
  ['Machine Shoulder Press', 1601, 1602],
  ['Dumbbell Lateral Raise', 1701, 1702],
  ['Cable Lateral Raise', 1801, 1802],
  ['Reverse Pec Deck', 1901, 1902],
  ['Resistance Band Pull-Apart', 2001, 2002],
  ['Dumbbell Biceps Curl', 2101, 2102],
  ['EZ Bar Curl', 2301, 2302],
  ['Hammer Curl', 2401, 2402],
  ['Cable Biceps Curl', 2501, 2502],
  ['Cable Triceps Pushdown', 2601, 2602],
] as const)(
  'shows %s phases inline and retains FINISH when expanded',
  (name, startAsset, finishAsset) => {
    const v = render();
    try {
      expect(button(v, `Technique for ${name}`)).toBeDefined();
      act(() => button(v, `Technique for ${name}`)!.props.onPress());
      const images = (phase: string) =>
        v.root
          .findAllByType(Image)
          .filter(
            (n: any) => n.props.accessibilityLabel === `${name}: ${phase}`,
          );
      expect(images('START')).toHaveLength(1);
      expect(images('START')[0].props.source).toBe(startAsset);
      act(() => button(v, 'Show FINISH')!.props.onPress());
      expect(images('START')).toHaveLength(0);
      expect(images('FINISH')).toHaveLength(1);
      expect(images('FINISH')[0].props.source).toBe(finishAsset);
      act(() => button(v, 'Expand exercise illustration')!.props.onPress());
      expect(images('FINISH')).toHaveLength(2);
      for (const image of images('FINISH'))
        expect(image.props.source).toBe(finishAsset);
      expect(text(v)).not.toContain(`Illustration unavailable: ${name}`);
      act(() => button(v, 'Close full-screen illustration')!.props.onPress());
      expect(button(v, 'Show FINISH')!.props.accessibilityState.selected).toBe(
        true,
      );
    } finally {
      act(() => v.unmount());
    }
  },
);
it('keeps inline and full-screen placeholders for variants without phase artwork', () => {
  const v = render();
  try {
    act(() => button(v, 'Technique for Barbell Bench Press')!.props.onPress());
    expect(text(v)).toContain('Image coming soon');
    act(() => button(v, 'Show FINISH')!.props.onPress());
    act(() => button(v, 'Expand exercise illustration')!.props.onPress());
    expect(text(v)).toContain('Illustration unavailable');
    expect(button(v, 'Close full-screen illustration')).toBeDefined();
  } finally {
    act(() => v.unmount());
  }
});
it('keeps instructions readable when an external source fails', async () => {
  const open = jest
    .spyOn(Linking, 'openURL')
    .mockRejectedValue(new Error('offline'));
  const v = render();
  try {
    act(() => button(v, 'Technique for Barbell Bench Press')!.props.onPress());
    act(() => button(v, 'Sources')!.props.onPress());
    await act(async () => {
      button(
        v,
        'Open source Chest Press. Source checked Oct 12, 2026.',
      )!.props.onPress();
    });
    expect(text(v)).toContain('Could not open this source');
    expect(text(v)).toContain('Setup');
  } finally {
    act(() => v.unmount());
    open.mockRestore();
  }
});

it('opens technique during a workout without changing logged values or the rest deadline', () => {
  const Workout = jest.requireActual('../../components/Workout').Workout;
  const { startWorkout } = jest.requireActual('../workout-engine');
  const { defaultTemplates, exerciseLibrary } =
    jest.requireActual('../workout-catalog');
  const session = startWorkout(defaultTemplates[0], exerciseLibrary, 1000);
  session.exercises[0].sets[0].weight = '63.75';
  session.exercises[0].sets[0].reps = '9';
  session.restEndsAt = Date.now() + 45000;
  const before = JSON.stringify(session),
    update = jest.fn();
  let v!: ReturnType<typeof create>;
  act(() => {
    v = create(
      <Workout
        session={session}
        history={[]}
        update={update}
        finish={() => {}}
        busy={false}
      />,
    );
  });
  try {
    const entry = button(v, 'Technique for Barbell Bench Press');
    expect(entry).toBeDefined();
    act(() => entry!.props.onPress());
    expect(text(v)).toContain('Setup');
    act(() => button(v, 'Close technique')!.props.onPress());
    expect(update).not.toHaveBeenCalled();
    expect(JSON.stringify(session)).toBe(before);
  } finally {
    act(() => v.unmount());
  }
});

it('allows disclosure labels to wrap beside their indicator at larger text sizes', () => {
  const { Text, StyleSheet } = jest.requireActual('react-native');
  const v = render();
  try {
    act(() => button(v, 'Technique for Barbell Bench Press')!.props.onPress());
    const disclosure = button(v, 'Common mistakes')!;
    const label = disclosure.findByType(Text);
    expect(StyleSheet.flatten(label.props.style)).toMatchObject({
      flex: 1,
      flexShrink: 1,
    });
  } finally {
    act(() => v.unmount());
  }
});

it('keeps deadlift FINISH uniformly aligned in both viewers and resets placement for START', () => {
  const v = render();
  const images = (phase: string) =>
    v.root
      .findAllByType(Image)
      .filter(
        (n: any) => n.props.accessibilityLabel === `Barbell Deadlift: ${phase}`,
      );
  try {
    act(() => button(v, 'Technique for Barbell Deadlift')!.props.onPress());
    expect(StyleSheet.flatten(images('START')[0].props.style)).toMatchObject({
      top: 0,
      width: '100%',
      height: '100%',
    });
    act(() => button(v, 'Show FINISH')!.props.onPress());
    act(() => button(v, 'Expand exercise illustration')!.props.onPress());
    expect(images('FINISH')).toHaveLength(2);
    const inlineStyle = StyleSheet.flatten(images('FINISH')[0].props.style);
    expect(parseFloat(String(inlineStyle.top))).toBeLessThan(0);
    expect(inlineStyle).toMatchObject({
      left: 0,
      width: '100%',
      height: '100%',
    });
    for (const image of images('FINISH')) {
      expect(image.props.source).toBe(1302);
      expect(image.props.resizeMode).toBe('contain');
      expect(StyleSheet.flatten(image.props.style)).toEqual(inlineStyle);
    }
    act(() => button(v, 'Close full-screen illustration')!.props.onPress());
    act(() => button(v, 'Show START')!.props.onPress());
    expect(images('START')[0].props.source).toBe(1301);
    expect(StyleSheet.flatten(images('START')[0].props.style).top).toBe(0);
  } finally {
    act(() => v.unmount());
  }
});

// Removing the per-exercise card, using history tint or omitting dismissal breaks these scenarios.
it('shows exact curl roles and opens/closes larger anatomy without changing FINISH', () => {
  const v = render();
  act(() => button(v, 'Technique for Dumbbell Biceps Curl')!.props.onPress());
  expect(text(v)).toContain('Working muscles');
  const map = v.root.findByType(MuscleMap);
  expect(map.props.height).toBe(160);
  const regions = v.root
    .findAllByType(Path)
    .filter((n: any) => n.props.testID?.startsWith('anatomical-region-'));
  expect(regions.some((n: any) => n.props.fill === colors.musclePrimary)).toBe(
    true,
  );
  expect(
    regions.some((n: any) => n.props.fill === colors.muscleSecondary),
  ).toBe(true);
  for (const muscle of map.props.muscles) {
    expect(muscle.primary).toBe(muscle.id === 'biceps' ? 1 : 0);
    expect(muscle.secondary).toBe(muscle.id === 'forearms' ? 1 : 0);
  }
  expect(regions.every((n: any) => n.props.onPress === undefined)).toBe(true);
  act(() => button(v, 'Show FINISH')!.props.onPress());
  act(() =>
    button(v, 'Muscle details for Dumbbell Biceps Curl')!.props.onPress(),
  );
  expect(
    v.root.findAllByType(MuscleMap).map((n: any) => n.props.height),
  ).toEqual([160, 340]);
  expect(text(v)).toContain('Qualitative muscle roles');
  const modal = v.root
    .findAllByType(Modal)
    .find((n: any) => n.props.testID === 'exercise-muscle-details')!;
  act(() => modal.props.onRequestClose());
  expect(v.root.findAllByType(MuscleMap)).toHaveLength(1);
  expect(
    v.root
      .findAllByType(Image)
      .some(
        (n: any) =>
          n.props.accessibilityLabel === 'Dumbbell Biceps Curl: FINISH',
      ),
  ).toBe(true);
  act(() =>
    button(v, 'Muscle details for Dumbbell Biceps Curl')!.props.onPress(),
  );
  act(() => button(v, 'Close muscle details')!.props.onPress());
  expect(v.root.findAllByType(MuscleMap)).toHaveLength(1);
  act(() => v.unmount());
});

it('shows bound partial adductor regions without claiming missing coverage', () => {
  const v = render();
  act(() => button(v, 'Technique for Machine Hip Adduction')!.props.onPress());
  expect(text(v)).not.toContain('Not highlighted on this map:');
  expect(text(v)).toContain('selected visible medial-thigh patches');
  expect(text(v)).toContain('Adductors');
  const map = v.root.findByType(MuscleMap);
  expect(map.props.muscles.find((m: any) => m.id === 'adductors').primary).toBe(
    1,
  );
  expect(
    v.root
      .findAllByType(Path)
      .some((n: any) => n.props.testID?.includes('adductor')),
  ).toBe(true);
  act(() => v.unmount());
});

it('shows selected barbell curl roles and opens/closes larger anatomy without changing FINISH', () => {
  const v = render();
  act(() => button(v, 'Technique for Barbell Curl')!.props.onPress());
  expect(text(v)).toContain('Working muscles');
  const map = v.root.findByType(MuscleMap);
  expect(map.props.height).toBe(160);
  const regions = v.root
    .findAllByType(Path)
    .filter((n: any) => n.props.testID?.startsWith('anatomical-region-'));
  expect(regions.some((n: any) => n.props.fill === colors.musclePrimary)).toBe(
    true,
  );
  expect(
    regions.some((n: any) => n.props.fill === colors.muscleSecondary),
  ).toBe(true);
  for (const muscle of map.props.muscles) {
    expect(muscle.primary).toBe(muscle.id === 'biceps' ? 1 : 0);
    expect(muscle.secondary).toBe(muscle.id === 'forearms' ? 1 : 0);
  }
  expect(regions.every((n: any) => n.props.onPress === undefined)).toBe(true);
  act(() => button(v, 'Show FINISH')!.props.onPress());
  act(() => button(v, 'Muscle details for Barbell Curl')!.props.onPress());
  expect(
    v.root.findAllByType(MuscleMap).map((n: any) => n.props.height),
  ).toEqual([160, 340]);
  expect(text(v)).toContain('Qualitative muscle roles');
  const modal = v.root
    .findAllByType(Modal)
    .find((n: any) => n.props.testID === 'exercise-muscle-details')!;
  act(() => modal.props.onRequestClose());
  expect(v.root.findAllByType(MuscleMap)).toHaveLength(1);
  expect(
    v.root
      .findAllByType(Image)
      .some((n: any) => n.props.accessibilityLabel === 'Barbell Curl: FINISH'),
  ).toBe(true);
  act(() => button(v, 'Muscle details for Barbell Curl')!.props.onPress());
  act(() => button(v, 'Close muscle details')!.props.onPress());
  expect(v.root.findAllByType(MuscleMap)).toHaveLength(1);
  act(() => v.unmount());
});

it('shows selected EZ curl roles and opens/closes larger anatomy without changing FINISH', () => {
  const v = render();
  try {
    act(() => button(v, 'Technique for EZ Bar Curl')!.props.onPress());
    expect(text(v)).toContain('Working muscles');
    const map = v.root.findByType(MuscleMap);
    expect(map.props.height).toBe(160);
    const regions = v.root
      .findAllByType(Path)
      .filter((n: any) => n.props.testID?.startsWith('anatomical-region-'));
    expect(
      regions.some((n: any) => n.props.fill === colors.musclePrimary),
    ).toBe(true);
    expect(
      regions.some((n: any) => n.props.fill === colors.muscleSecondary),
    ).toBe(true);
    for (const muscle of map.props.muscles) {
      expect(muscle.primary).toBe(muscle.id === 'biceps' ? 1 : 0);
      expect(muscle.secondary).toBe(muscle.id === 'forearms' ? 1 : 0);
    }
    expect(regions.every((n: any) => n.props.onPress === undefined)).toBe(true);
    act(() => button(v, 'Show FINISH')!.props.onPress());
    act(() => button(v, 'Muscle details for EZ Bar Curl')!.props.onPress());
    expect(
      v.root.findAllByType(MuscleMap).map((n: any) => n.props.height),
    ).toEqual([160, 340]);
    expect(text(v)).toContain('Qualitative muscle roles');
    const modal = v.root
      .findAllByType(Modal)
      .find((n: any) => n.props.testID === 'exercise-muscle-details')!;
    act(() => modal.props.onRequestClose());
    expect(v.root.findAllByType(MuscleMap)).toHaveLength(1);
    expect(
      v.root
        .findAllByType(Image)
        .some(
          (n: any) =>
            n.props.accessibilityLabel === 'EZ Bar Curl: FINISH' &&
            n.props.source === 2302,
        ),
    ).toBe(true);
    act(() => button(v, 'Muscle details for EZ Bar Curl')!.props.onPress());
    act(() => button(v, 'Close muscle details')!.props.onPress());
    expect(v.root.findAllByType(MuscleMap)).toHaveLength(1);
  } finally {
    act(() => v.unmount());
  }
});

it('shows selected hammer curl roles and opens/closes larger anatomy without changing FINISH', () => {
  const v = render();
  try {
    act(() => button(v, 'Technique for Hammer Curl')!.props.onPress());
    expect(text(v)).toContain('Working muscles');
    const map = v.root.findByType(MuscleMap);
    expect(map.props.height).toBe(160);
    const regions = v.root
      .findAllByType(Path)
      .filter((n: any) => n.props.testID?.startsWith('anatomical-region-'));
    expect(
      regions.some((n: any) => n.props.fill === colors.musclePrimary),
    ).toBe(true);
    expect(
      regions.some((n: any) => n.props.fill === colors.muscleSecondary),
    ).toBe(false);
    for (const muscle of map.props.muscles) {
      expect(muscle.primary).toBe(
        ['biceps', 'forearms'].includes(muscle.id) ? 1 : 0,
      );
      expect(muscle.secondary).toBe(0);
    }
    expect(regions.every((n: any) => n.props.onPress === undefined)).toBe(true);
    act(() => button(v, 'Show FINISH')!.props.onPress());
    act(() => button(v, 'Muscle details for Hammer Curl')!.props.onPress());
    expect(
      v.root.findAllByType(MuscleMap).map((n: any) => n.props.height),
    ).toEqual([160, 340]);
    expect(text(v)).toContain('Qualitative muscle roles');
    const modal = v.root
      .findAllByType(Modal)
      .find((n: any) => n.props.testID === 'exercise-muscle-details')!;
    act(() => modal.props.onRequestClose());
    expect(v.root.findAllByType(MuscleMap)).toHaveLength(1);
    expect(
      v.root
        .findAllByType(Image)
        .some(
          (n: any) =>
            n.props.accessibilityLabel === 'Hammer Curl: FINISH' &&
            n.props.source === 2402,
        ),
    ).toBe(true);
    act(() => button(v, 'Muscle details for Hammer Curl')!.props.onPress());
    act(() => button(v, 'Close muscle details')!.props.onPress());
    expect(v.root.findAllByType(MuscleMap)).toHaveLength(1);
  } finally {
    act(() => v.unmount());
  }
});

it('shows selected low cable curl roles and opens/closes larger anatomy without changing FINISH', () => {
  const v = render();
  try {
    act(() => button(v, 'Technique for Cable Biceps Curl')!.props.onPress());
    expect(text(v)).toContain('Working muscles');
    const map = v.root.findByType(MuscleMap);
    expect(map.props.height).toBe(160);
    const regions = v.root
      .findAllByType(Path)
      .filter((n: any) => n.props.testID?.startsWith('anatomical-region-'));
    expect(
      regions.some((n: any) => n.props.fill === colors.musclePrimary),
    ).toBe(true);
    expect(
      regions.some((n: any) => n.props.fill === colors.muscleSecondary),
    ).toBe(true);
    for (const muscle of map.props.muscles) {
      expect(muscle.primary).toBe(muscle.id === 'biceps' ? 1 : 0);
      expect(muscle.secondary).toBe(muscle.id === 'forearms' ? 1 : 0);
    }
    expect(regions.every((n: any) => n.props.onPress === undefined)).toBe(true);
    act(() => button(v, 'Show FINISH')!.props.onPress());
    act(() =>
      button(v, 'Muscle details for Cable Biceps Curl')!.props.onPress(),
    );
    expect(
      v.root.findAllByType(MuscleMap).map((n: any) => n.props.height),
    ).toEqual([160, 340]);
    expect(text(v)).toContain('Qualitative muscle roles');
    const modal = v.root
      .findAllByType(Modal)
      .find((n: any) => n.props.testID === 'exercise-muscle-details')!;
    act(() => modal.props.onRequestClose());
    expect(v.root.findAllByType(MuscleMap)).toHaveLength(1);
    expect(
      v.root
        .findAllByType(Image)
        .some(
          (n: any) =>
            n.props.accessibilityLabel === 'Cable Biceps Curl: FINISH' &&
            n.props.source === 2502,
        ),
    ).toBe(true);
    act(() =>
      button(v, 'Muscle details for Cable Biceps Curl')!.props.onPress(),
    );
    act(() => button(v, 'Close muscle details')!.props.onPress());
    expect(v.root.findAllByType(MuscleMap)).toHaveLength(1);
  } finally {
    act(() => v.unmount());
  }
});

it('shows selected high cable pushdown roles and opens/closes larger anatomy without changing FINISH', () => {
  const v = render();
  try {
    act(() =>
      button(v, 'Technique for Cable Triceps Pushdown')!.props.onPress(),
    );
    expect(text(v)).toContain('Working muscles');
    const map = v.root.findByType(MuscleMap);
    expect(map.props.height).toBe(160);
    const regions = v.root
      .findAllByType(Path)
      .filter((n: any) => n.props.testID?.startsWith('anatomical-region-'));
    expect(
      regions.some((n: any) => n.props.fill === colors.musclePrimary),
    ).toBe(true);
    expect(
      regions.some((n: any) => n.props.fill === colors.muscleSecondary),
    ).toBe(false);
    for (const muscle of map.props.muscles) {
      expect(muscle.primary).toBe(muscle.id === 'triceps' ? 1 : 0);
      expect(muscle.secondary).toBe(0);
    }
    expect(regions.every((n: any) => n.props.onPress === undefined)).toBe(true);
    act(() => button(v, 'Show FINISH')!.props.onPress());
    act(() =>
      button(v, 'Muscle details for Cable Triceps Pushdown')!.props.onPress(),
    );
    expect(
      v.root.findAllByType(MuscleMap).map((n: any) => n.props.height),
    ).toEqual([160, 340]);
    expect(text(v)).toContain('Qualitative muscle roles');
    const modal = v.root
      .findAllByType(Modal)
      .find((n: any) => n.props.testID === 'exercise-muscle-details')!;
    act(() => modal.props.onRequestClose());
    expect(v.root.findAllByType(MuscleMap)).toHaveLength(1);
    expect(
      v.root
        .findAllByType(Image)
        .some(
          (n: any) =>
            n.props.accessibilityLabel === 'Cable Triceps Pushdown: FINISH' &&
            n.props.source === 2602,
        ),
    ).toBe(true);
    act(() =>
      button(v, 'Muscle details for Cable Triceps Pushdown')!.props.onPress(),
    );
    act(() => button(v, 'Close muscle details')!.props.onPress());
    expect(v.root.findAllByType(MuscleMap)).toHaveLength(1);
  } finally {
    act(() => v.unmount());
  }
});
