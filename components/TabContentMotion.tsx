import { createContext, useLayoutEffect, useRef, type ReactNode } from 'react';
import {
  cancelAnimation,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useLayoutDirection } from './LayoutDirectionContext';
import { useReducedMotionPreference } from './useReducedMotionPreference';
import { dockTabs, type DockTab } from './Dock';
export const TabContentOffset = createContext<SharedValue<number> | null>(null);

export function TabContentMotion({
  active,
  children,
}: {
  active: DockTab;
  children: ReactNode;
}) {
  const direction = useLayoutDirection();
  const reduced = useReducedMotionPreference();
  const offset = useSharedValue(0);
  const previous = useRef(active);
  useLayoutEffect(() => {
    const delta =
      dockTabs.findIndex(([id]) => id === active) -
      dockTabs.findIndex(([id]) => id === previous.current);
    previous.current = active;
    if (reduced || delta === 0) {
      offset.set(0);
      return;
    }
    offset.set(Math.sign(delta) * (direction === 'rtl' ? -28 : 28));
    offset.set(withTiming(0, { duration: 210 }));
    return () => cancelAnimation(offset);
  }, [active, direction, offset, reduced]);

  return (
    <TabContentOffset.Provider value={offset}>
      {children}
    </TabContentOffset.Provider>
  );
}
