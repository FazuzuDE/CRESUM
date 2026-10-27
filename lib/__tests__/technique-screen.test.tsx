import { ExerciseLibrary } from '../../components/ExerciseLibrary';
import { TextInput, Linking, Image } from 'react-native';
import { resolveExerciseArtwork } from '../exercise-artwork';
import { isPressable } from './pressable';
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
