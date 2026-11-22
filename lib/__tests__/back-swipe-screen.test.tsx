import { View } from 'react-native';
import { withTiming } from 'react-native-reanimated';
import {
  GestureDetector,
  PointerType,
  type PanGesture,
} from 'react-native-gesture-handler';
import { AppScrollView } from '../../components/AppScrollView';
import { AppButton } from '../../components/AppButton';
import { AppSlider } from '../../components/AppSlider';
import { LocalizedModal } from '../../components/LayoutDirection';

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

function gestures(view: ReturnType<typeof create>) {
  return view.root
    .findAllByType(GestureDetector)
    .filter((node: { props: { gesture?: unknown } }) => node.props.gesture)
    .map((node: { props: { gesture: PanGesture } }) => node.props.gesture);
}

function swipe(
  gesture: PanGesture,
  values: Partial<{
    translationX: number;
    translationY: number;
    velocityX: number;
    canceled: boolean;
  }> = {},
  pointerType = PointerType.TOUCH,
) {
  act(() => {
    gesture.config.onActivate?.({ pointerType } as never);
    gesture.config.onDeactivate?.({
      translationX: 100,
      translationY: 5,
      velocityX: 110,
      canceled: false,
      ...values,
    } as never);
  });
}

it('only commits a completed rightward swipe on a screen with Back', () => {
  const back = jest.fn();
  let view: ReturnType<typeof create>;
  act(() => {
    view = create(
      <AppScrollView branded back={{ onPress: back }}>
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
  expect(back).not.toHaveBeenCalled();
  swipe(gesture);
  swipe(gesture, { translationX: 39, velocityX: 660 });
  expect(back).toHaveBeenCalledTimes(2);
  act(() => view.unmount());
});

it('settles an interrupted swipe back in place and animates out before committed Back', () => {
  const back = jest.fn();
  const timing = jest.mocked(withTiming);
  let view: ReturnType<typeof create>;
  act(() => {
    view = create(<AppScrollView branded back={{ onPress: back }} />);
  });
  const gesture = gestures(view)[0];
  act(() => {
    gesture.config.onActivate?.({ pointerType: PointerType.TOUCH } as never);
    const drag = { translationX: 56, translationY: 2 };
    if (typeof gesture.config.onUpdate === 'function') {
      gesture.config.onUpdate(drag as never);
    }
    gesture.config.onDeactivate?.({
      ...drag,
      velocityX: 100,
      canceled: true,
    } as never);
  });
  expect(timing).toHaveBeenLastCalledWith(0, { duration: 160 });
  expect(back).not.toHaveBeenCalled();

  timing.mockImplementationOnce((destination) => destination);
  swipe(gesture);
  const [destination, , finish] = timing.mock.lastCall!;
  expect(destination as number).toBeGreaterThan(0);
  expect(back).not.toHaveBeenCalled();
  act(() => finish?.(true));
  expect(back).toHaveBeenCalledTimes(1);
  act(() => view.unmount());
});

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
