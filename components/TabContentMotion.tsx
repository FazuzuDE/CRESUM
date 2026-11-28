import {
  createContext,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  makeMutable,
  useAnimatedStyle,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useAppColors } from './AppThemeProvider';
import { useLayoutDirection } from './LayoutDirectionContext';
import { useReducedMotionPreference } from './useReducedMotionPreference';
import { dockTabs, type DockTab } from './Dock';

export type TabTransition = {
  id: number;
  from: DockTab;
  offset: number;
  progress: SharedValue<number>;
};

type Navigation = { active: DockTab; transition?: TabTransition };

export const TabContentLayout = createContext<{
  transition?: TabTransition;
  headerHeight?: number;
  onHeaderHeight?: (height: number) => void;
} | null>(null);

export function useTabNavigation(initial: DockTab) {
  const direction = useLayoutDirection();
  const reduced = useReducedMotionPreference();
  const [navigation, setNavigation] = useState<Navigation>({ active: initial });
  const current = useRef(navigation);
  const pending = useRef<DockTab | undefined>(undefined);
  const sequence = useRef(0);
  const preferences = useRef({ direction, reduced });
  const [headerHeight, setHeaderHeight] = useState<number>();

  useLayoutEffect(() => {
    preferences.current = { direction, reduced };
  }, [direction, reduced]);

  const select = useCallback((next: DockTab, animate = false) => {
    const { active, transition } = current.current;
    const { direction, reduced } = preferences.current;
    // Finish the visible handoff before starting the most recent dock request.
    if (animate && !reduced && transition) {
      pending.current = next === active ? undefined : next;
      return;
    }
    pending.current = undefined;
    if (next === active && !transition) return;

    const delta =
      dockTabs.findIndex(([id]) => id === next) -
      dockTabs.findIndex(([id]) => id === active);
    const state = {
      active: next,
      transition:
        animate && !reduced && delta !== 0
          ? {
              id: ++sequence.current,
              from: active,
              offset: Math.sign(delta) * (direction === 'rtl' ? -24 : 24),
              progress: makeMutable(0),
            }
          : undefined,
    };
    current.current = state;
    setNavigation(state);
  }, []);

  const complete = useCallback(
    (id: number) => {
      if (current.current.transition?.id !== id) return;
      const { active } = current.current;
      const next = pending.current ?? active;
      current.current = { active };
      pending.current = undefined;
      if (next !== active) select(next, true);
      else setNavigation(current.current);
    },
    [select],
  );

  const { transition } = navigation;
  useLayoutEffect(() => {
    if (!transition) return;
    const { id, progress } = transition;
    if (reduced) {
      complete(id);
      return;
    }
    progress.set(
      withTiming(1, { duration: 230 }, (finished) => {
        'worklet';
        if (finished) scheduleOnRN(complete, id);
      }),
    );
    return () => cancelAnimation(progress);
  }, [complete, reduced, transition]);

  return { ...navigation, select, headerHeight, setHeaderHeight };
}

export function TabScene({
  name,
  active,
  transition,
  headerHeight,
  setHeaderHeight,
  children,
}: Navigation & {
  name: DockTab;
  headerHeight?: number;
  setHeaderHeight: (height: number) => void;
  children: ReactNode;
}) {
  const colors = useAppColors();
  const selected = name === active;
  const visible = selected || name === transition?.from;
  const entering = selected ? transition : undefined;
  const progress = entering?.progress;
  const fade = useAnimatedStyle(() => ({ opacity: progress?.get() ?? 1 }));
  return (
    <View
      testID={`tab-scene-${name}`}
      style={[
        StyleSheet.absoluteFill,
        { zIndex: selected ? 1 : 0 },
        !visible && styles.hidden,
      ]}
      pointerEvents={selected ? 'auto' : 'none'}
      aria-hidden={!selected}
      accessibilityElementsHidden={!selected}
      importantForAccessibility={selected ? 'auto' : 'no-hide-descendants'}
    >
      <TabContentLayout.Provider
        value={{
          transition: entering,
          headerHeight,
          onHeaderHeight: selected ? setHeaderHeight : undefined,
        }}
      >
        <Animated.View
          style={[styles.surface, { backgroundColor: colors.background }, fade]}
        >
          {children}
        </Animated.View>
      </TabContentLayout.Provider>
    </View>
  );
}

const styles = StyleSheet.create({
  surface: { flex: 1 },
  hidden: {
    opacity: 0,
    ...Platform.select({
      web: { visibility: 'hidden' } as ViewStyle & { visibility: 'hidden' },
    }),
  },
});
