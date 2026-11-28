import { useContext } from 'react';
import { AccessibilityInfo } from 'react-native';
import {
  cancelAnimation,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { LayoutDirectionContext } from '../../components/LayoutDirectionContext';
import {
  TabContentMotion,
  TabContentOffset,
} from '../../components/TabContentMotion';
import type { DockTab } from '../../components/Dock';

const { act, create } = jest.requireActual('react-test-renderer');

it.each([
  ['ltr', 28],
  ['rtl', -28],
] as const)(
  'slides from the selected dock side in %s and follows Reduce Motion',
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
    let offset: SharedValue<number> | null;
    function Observer() {
      offset = useContext(TabContentOffset);
      return null;
    }
    const starts: number[] = [];
    const mockTiming = jest.mocked(withTiming).mockImplementation((value) => {
      starts.push(offset!.get());
      return value;
    });
    const stops = jest.mocked(cancelAnimation);
    stops.mockClear();
    const screen = (tab: DockTab) => (
      <LayoutDirectionContext.Provider value={direction}>
        <TabContentMotion active={tab}>
          <Observer />
        </TabContentMotion>
      </LayoutDirectionContext.Provider>
    );
    let view!: ReturnType<typeof create>;
    try {
      await act(async () => {
        view = create(screen('home'));
      });
      act(() => view.update(screen('profile')));
      act(() => view.update(screen('workout')));
      expect(starts).toEqual([forward, -forward]);
      expect(stops).toHaveBeenCalledTimes(1);
      act(() => onMotionChange!(true));
      act(() => view.update(screen('progress')));
      expect(starts).toHaveLength(2);
      expect(stops).toHaveBeenCalledTimes(2);
    } finally {
      if (view) act(() => view.unmount());
      mockTiming.mockReset();
      mockSubscription.mockRestore();
      mockPreference.mockRestore();
    }
  },
);
