import { AccessibilityInfo, View } from 'react-native';
import { withTiming } from 'react-native-reanimated';
import { LayoutDirectionContext } from '../../components/LayoutDirectionContext';
import { TabScene, useTabNavigation } from '../../components/TabContentMotion';

const { act, create } = jest.requireActual('react-test-renderer');

it.each([
  ['ltr', 24],
  ['rtl', -24],
] as const)(
  'keeps the outgoing scene through the slide in %s and follows Reduce Motion',
  async (direction, forward) => {
    const mockPreference = jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockResolvedValue(false);
    let onMotionChange: ((value: boolean) => void) | undefined;
    const mockSubscription = jest
      .spyOn(AccessibilityInfo, 'addEventListener')
      .mockImplementation((event, listener) => {
        if (event === 'reduceMotionChanged')
          onMotionChange = listener as (value: boolean) => void;
        return { remove: jest.fn() };
      });
    let finish: ((finished: boolean) => void) | undefined;
    const timing = jest.mocked(withTiming);
    const mockTiming = timing.mockImplementation((value, _config, callback) => {
      finish = callback;
      return value;
    });
    let navigation: ReturnType<typeof useTabNavigation>;
    function Example() {
      navigation = useTabNavigation('workout');
      return (
        <>
          <TabScene name="workout" {...navigation}>
            <View />
          </TabScene>
          <TabScene name="progress" {...navigation}>
            <View />
          </TabScene>
        </>
      );
    }
    let view!: ReturnType<typeof create>;
    try {
      await act(async () => {
        view = create(
          <LayoutDirectionContext.Provider value={direction}>
            <Example />
          </LayoutDirectionContext.Provider>,
        );
      });
      const scene = (tab: string) =>
        view.root.findAllByProps({ testID: `tab-scene-${tab}` }).at(-1)!;
      act(() => navigation.select('progress', true));
      expect(navigation!.transition).toMatchObject({
        from: 'workout',
        offset: forward,
      });
      expect(scene('workout').props.style.at(-1)).toBe(false);
      expect(scene('workout').props.pointerEvents).toBe('none');
      expect(scene('progress').props.pointerEvents).toBe('auto');
      act(() => navigation.select('home', true));
      act(() => navigation.select('workout', true));
      expect(navigation!.active).toBe('progress');
      act(() => finish!(true));
      expect(navigation!.active).toBe('workout');
      expect(navigation!.transition).toMatchObject({
        from: 'progress',
        offset: -forward,
      });
      act(() => onMotionChange!(true));
      expect(navigation!.transition).toBeUndefined();
      act(() => navigation.select('progress', true));
      expect(navigation!.active).toBe('progress');
      expect(navigation!.transition).toBeUndefined();
    } finally {
      if (view) act(() => view.unmount());
      mockTiming.mockReset();
      mockSubscription.mockRestore();
      mockPreference.mockRestore();
    }
  },
);
