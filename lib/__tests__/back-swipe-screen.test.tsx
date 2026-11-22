import { Platform, TextInput, View } from 'react-native';
import {
  GestureDetector,
  PointerType,
  type PanGesture,
} from 'react-native-gesture-handler';
import { withTiming } from 'react-native-reanimated';
import { AppScrollView } from '../../components/AppScrollView';
import { AppButton } from '../../components/AppButton';
import { AppSlider } from '../../components/AppSlider';
import { ContentScrollView } from '../../components/ContentScrollView';
import { BrandHeader } from '../../components/BrandHeader';
import { ExerciseLibrary } from '../../components/ExerciseLibrary';
import { ExerciseTechnique } from '../../components/ExerciseTechnique';
import { MuscleExerciseDiscovery } from '../../components/MuscleExerciseDiscovery';
import { MuscleMap } from '../../components/MuscleMap';
import { MuscleProgress } from '../../components/MuscleProgress';
import {
  LayoutDirectionContext,
  LocalizedModal,
} from '../../components/LayoutDirection';
import { isPressable } from './pressable';

const { act, create } = jest.requireActual('react-test-renderer');
jest.unmock('../../components/ScreenModal');

afterEach(() => jest.restoreAllMocks());
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
  SafeAreaProvider: jest.requireActual('react-native').View,
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));
jest.mock('expo-blur', () => ({
  BlurView: jest.requireActual('react-native').View,
}));

function gestures(view: ReturnType<typeof create>) {
  return view.root
    .findAllByType(GestureDetector)
    .filter((node: { props: { gesture?: unknown } }) => node.props.gesture)
    .map((node: { props: { gesture: PanGesture } }) => node.props.gesture);
}

type SwipeValues = Partial<{
  translationX: number;
  translationY: number;
  velocityX: number;
  canceled: boolean;
}>;

function beginSwipe(gesture: PanGesture, pointerType = PointerType.TOUCH) {
  act(() => {
    const event = { pointerType, numberOfPointers: 1 } as never;
    gesture.config.onBegin?.(event);
    gesture.config.onActivate?.(event);
  });
}

function endSwipe(gesture: PanGesture, values: SwipeValues = {}) {
  act(() => {
    const event = {
      translationX: 120,
      translationY: 5,
      velocityX: 110,
      canceled: false,
      ...values,
    } as never;
    gesture.config.onDeactivate?.(event);
    gesture.config.onFinalize?.(event);
  });
}

function swipe(
  gesture: PanGesture,
  values: SwipeValues = {},
  pointerType = PointerType.TOUCH,
) {
  beginSwipe(gesture, pointerType);
  endSwipe(gesture, values);
}

it.each(['ios', 'android'] as const)(
  'commits only deliberate rightward swipes on %s and preserves the button',
  (platform) => {
    jest.replaceProperty(Platform, 'OS', platform);
    const back = jest.fn();
    let view: ReturnType<typeof create>;
    act(() => {
      view = create(
        <AppScrollView branded back={{ onPress: back, testID: 'page-back' }}>
          <View />
        </AppScrollView>,
      );
    });
    const gesture = gestures(view)[0];
    expect(gesture.config.enabled).toBe(true);
    expect(gesture.config.activeOffsetXEnd).toBe(24);
    expect(gesture.config.failOffsetXStart).toBe(-12);
    expect(gesture.config.failOffsetYEnd).toBe(15);
    expect(gesture.config.maxPointers).toBe(1);
    swipe(gesture, { translationX: -140 });
    swipe(gesture, { translationX: 20, velocityX: 600 });
    swipe(gesture, { translationY: 65 });
    swipe(gesture, { canceled: true });
    swipe(gesture, {}, PointerType.MOUSE);
    beginSwipe(gesture);
    act(() => gesture.config.onTouchesDown?.({ numberOfTouches: 2 } as never));
    endSwipe(gesture);
    expect(back).not.toHaveBeenCalled();
    swipe(gesture);
    swipe(gesture, { translationX: 39, velocityX: 660 });
    endSwipe(gesture);
    expect(back).toHaveBeenCalledTimes(2);
    const button = view.root.find(
      (node: any) => isPressable(node) && node.props.testID === 'page-back',
    );
    act(() => button.props.onPress());
    expect(back).toHaveBeenCalledTimes(3);
    act(() => view.unmount());
  },
);

it.each([
  ['ltr', 1],
  ['rtl', -1],
] as const)(
  'restores an interrupted drag and animates to the %s edge before invoking Back',
  (direction, sign) => {
    const back = jest.fn();
    const timing = jest.mocked(withTiming);
    let view: ReturnType<typeof create>;
    act(() => {
      view = create(
        <LayoutDirectionContext.Provider value={direction}>
          <AppScrollView branded back={{ onPress: back }} />
        </LayoutDirectionContext.Provider>,
      );
    });
    const gesture = gestures(view)[0];
    beginSwipe(gesture);
    endSwipe(gesture, { translationX: sign * 56, canceled: true });
    expect(timing).toHaveBeenLastCalledWith(0, { duration: 160 });
    expect(back).not.toHaveBeenCalled();

    beginSwipe(gesture);
    act(() => gesture.config.onTouchesDown?.({ numberOfTouches: 2 } as never));
    endSwipe(gesture, { translationX: sign * 120 });
    expect(timing).toHaveBeenLastCalledWith(0, { duration: 160 });
    expect(back).not.toHaveBeenCalled();

    timing.mockImplementationOnce((destination) => destination);
    swipe(gesture, { translationX: sign * 120 });
    const [destination, , finish] = timing.mock.lastCall!;
    expect((destination as number) * sign).toBeGreaterThan(0);
    expect(back).not.toHaveBeenCalled();
    act(() => finish?.(true));
    expect(back).toHaveBeenCalledTimes(1);
    act(() => view.unmount());
  },
);

it('uses the inline destination and respects its disabled state', () => {
  const outer = jest.fn();
  const inner = jest.fn();
  const screen = (disabled: boolean) => (
    <AppScrollView branded back={{ onPress: outer }}>
      <AppButton
        title="Previous step"
        swipeBack
        onPress={inner}
        disabled={disabled}
      />
    </AppScrollView>
  );
  let view: ReturnType<typeof create>;
  act(() => {
    view = create(screen(false));
  });
  swipe(gestures(view)[0]);
  expect(inner).toHaveBeenCalledTimes(1);
  expect(outer).not.toHaveBeenCalled();

  act(() => view.update(screen(true)));
  expect(gestures(view)[0].config.enabled).toBe(false);
  swipe(gestures(view)[0]);
  expect(inner).toHaveBeenCalledTimes(1);
  expect(outer).not.toHaveBeenCalled();
  act(() => view.unmount());
});

it('isolates modal Back and gives sliders priority over the screen gesture', () => {
  const pageBack = jest.fn();
  const modalBack = jest.fn();
  let view: ReturnType<typeof create>;
  act(() => {
    view = create(
      <AppScrollView branded back={{ onPress: pageBack }}>
        <AppSlider />
        <LocalizedModal visible>
          <AppScrollView branded back={{ onPress: modalBack }} />
        </LocalizedModal>
      </AppScrollView>,
    );
  });
  const [page, slider, modal] = gestures(view);
  expect(page.config.enabled).toBe(true);
  expect(slider.gestureRelations.blocksHandlers).toContain(page.handlerTag);
  expect(modal.config.enabled).toBe(true);
  swipe(modal);
  expect(pageBack).not.toHaveBeenCalled();
  expect(modalBack).toHaveBeenCalledTimes(1);
  act(() => view.unmount());
});

it('does not arm the gesture on a top-level page', () => {
  let view: ReturnType<typeof create>;
  act(() => {
    view = create(<AppScrollView branded />);
  });
  expect(gestures(view)[0].config.enabled).toBe(false);
  act(() => view.unmount());
});

it('mirrors both thresholds and velocity when the app switches to RTL', () => {
  const back = jest.fn();
  const screen = (direction: 'ltr' | 'rtl') => (
    <LayoutDirectionContext.Provider value={direction}>
      <AppScrollView branded back={{ onPress: back }} />
    </LayoutDirectionContext.Provider>
  );
  let view: ReturnType<typeof create>;
  act(() => {
    view = create(screen('ltr'));
  });
  beginSwipe(gestures(view)[0]);
  act(() => view.update(screen('rtl')));

  const gesture = gestures(view)[0];
  expect(gesture.config.activeOffsetXStart).toBe(-24);
  expect(gesture.config.activeOffsetXEnd).toBeUndefined();
  expect(gesture.config.failOffsetXEnd).toBe(12);
  endSwipe(gesture, { translationX: -120 });
  swipe(gesture);
  swipe(gesture, { translationX: -40, velocityX: 650 });
  expect(back).not.toHaveBeenCalled();
  swipe(gesture, { translationX: -120 });
  swipe(gesture, { translationX: -40, velocityX: -650 });
  expect(back).toHaveBeenCalledTimes(2);
  act(() => view.unmount());
});

it('disarms a swipe when the same header changes destinations', () => {
  const first = jest.fn();
  const second = jest.fn();
  const page = (scope: string, onPress: () => void) => (
    <AppScrollView branded back={{ scope, onPress }} />
  );
  let view: ReturnType<typeof create>;
  act(() => {
    view = create(page('first', first));
  });
  beginSwipe(gestures(view)[0]);
  act(() => view.update(page('second', second)));
  endSwipe(gestures(view)[0]);
  expect(first).not.toHaveBeenCalled();
  expect(second).not.toHaveBeenCalled();

  const timing = jest.mocked(withTiming);
  timing.mockImplementationOnce((destination) => destination);
  swipe(gestures(view)[0]);
  const [, , finish] = timing.mock.lastCall!;
  act(() => view.update(page('first', first)));
  act(() => finish?.(true));
  expect(first).not.toHaveBeenCalled();
  expect(second).not.toHaveBeenCalled();
  swipe(gestures(view)[0]);
  expect(first).toHaveBeenCalledTimes(1);
  act(() => view.unmount());
});

it('uses the modal close only when there is no more specific return control', () => {
  const parent = jest.fn();
  const close = jest.fn();
  const back = jest.fn();
  const screen = (disabled: boolean, nested: boolean, visible = true) => (
    <AppScrollView branded back={{ onPress: parent }}>
      <LocalizedModal
        visible={visible}
        swipeBack={{ onPress: close, disabled }}
      >
        <AppScrollView
          branded
          back={nested ? { onPress: back, disabled } : undefined}
        />
      </LocalizedModal>
    </AppScrollView>
  );
  let view: ReturnType<typeof create>;
  act(() => {
    view = create(screen(false, true));
  });
  swipe(gestures(view)[1]);
  expect(back).toHaveBeenCalledTimes(1);
  expect(close).not.toHaveBeenCalled();

  act(() => view.update(screen(true, true)));
  expect(gestures(view)[1].config.enabled).toBe(false);
  swipe(gestures(view)[1]);
  expect(back).toHaveBeenCalledTimes(1);
  expect(close).not.toHaveBeenCalled();

  act(() => view.update(screen(false, false)));
  swipe(gestures(view)[1]);
  expect(close).toHaveBeenCalledTimes(1);
  act(() => view.update(screen(false, true, false)));
  // iOS may retain the modal content until the dismissal animation finishes.
  expect(
    gestures(view)
      .slice(1)
      .every((pan: PanGesture) => !pan.config.enabled),
  ).toBe(true);
  expect(parent).not.toHaveBeenCalled();
  act(() => view.unmount());
});

it('gives an enabled horizontal scroller priority inside its own fixed header', () => {
  const screen = (enabled: boolean) => (
    <ContentScrollView
      horizontal
      scrollEnabled={enabled}
      fixedHeader={<BrandHeader back={{ onPress: jest.fn() }} />}
    >
      <View />
    </ContentScrollView>
  );
  let view: ReturnType<typeof create>;
  act(() => {
    view = create(screen(true));
  });
  const [page, scroll] = gestures(view);
  expect(scroll.gestureRelations.blocksHandlers).toContain(page.handlerTag);
  act(() => view.update(screen(false)));
  expect(gestures(view)[1].gestureRelations.blocksHandlers).toEqual([]);
  act(() => view.unmount());
});

it('returns from muscle results to selection and then to the map', () => {
  let view: ReturnType<typeof create>;
  act(() => {
    view = create(
      <MuscleProgress history={[]} now={0} onOverview={jest.fn()} />,
    );
  });
  const press = (title: string) =>
    act(() =>
      view.root
        .findAllByType(AppButton)
        .find((node: any) => node.props.title === title)
        .props.onPress(),
    );

  const pickerMap = () =>
    view.root.findByType(MuscleExerciseDiscovery).findByType(MuscleMap);
  press('Find exercises');
  expect(view.root.findAllByType(MuscleMap)).toHaveLength(2);
  act(() => pickerMap().props.onSelect('chest'));
  press('Show exercises · 1');
  swipe(gestures(view).find((gesture: PanGesture) => gesture.config.enabled));
  expect(pickerMap().props.muscles).toEqual([
    expect.objectContaining({ id: 'chest' }),
  ]);
  swipe(gestures(view).find((gesture: PanGesture) => gesture.config.enabled));
  expect(
    gestures(view).some((gesture: PanGesture) => gesture.config.enabled),
  ).toBe(false);
  expect(view.root.findByType(MuscleMap)).toBeDefined();
  act(() => view.unmount());
});

it('closes the exercise card before leaving the library and preserves search', () => {
  const onClose = jest.fn();
  let view: ReturnType<typeof create>;
  act(() => {
    view = create(
      <ExerciseLibrary visible presentation="page" onClose={onClose} />,
    );
  });
  const query = 'barbell bench press';
  act(() => view.root.findByType(TextInput).props.onChangeText(query));
  const row = view.root.find(
    (node: any) =>
      isPressable(node) &&
      node.props.accessibilityLabel === 'View Barbell Bench Press',
  );
  act(() => row.props.onPress());
  expect(view.root.findByType(ExerciseTechnique)).toBeDefined();

  const enabled = () =>
    gestures(view).filter((gesture: PanGesture) => gesture.config.enabled);
  expect(enabled()).toHaveLength(2);
  swipe(enabled()[1]);
  expect(view.root.findAllByType(ExerciseTechnique)).toHaveLength(0);
  expect(view.root.findByType(TextInput).props.value).toBe(query);
  expect(onClose).not.toHaveBeenCalled();
  swipe(enabled()[0]);
  expect(onClose).toHaveBeenCalledTimes(1);
  act(() => view.unmount());
});
