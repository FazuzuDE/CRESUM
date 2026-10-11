import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import {
  progressScrollTarget,
  type ProgressSectionPosition,
} from '@/lib/progress-scroll';
import { spacing } from '@/lib/theme';

export function useScrollReturn(
  scrollTo: (y: number, animated: boolean) => void,
) {
  const reducedMotion = useRef(false);
  const positions = useRef<Record<string, ProgressSectionPosition>>({});
  const offset = useRef(0);
  const armed = useRef(false);
  const [visible, setVisible] = useState(false);
  const [toTop, setToTop] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) reducedMotion.current = value;
      })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (value) => {
        reducedMotion.current = value;
      },
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  const reset = useCallback(() => {
    armed.current = false;
    setToTop(false);
  }, []);
  const register = useCallback(
    (id: string, y: number) => {
      if (positions.current[id]?.y === y) return;
      positions.current[id] = { id, label: id, y };
      reset();
    },
    [reset],
  );
  return {
    visible,
    toTop,
    reset,
    register,
    retain(ids: string[]) {
      for (const id of Object.keys(positions.current))
        if (!ids.includes(id)) delete positions.current[id];
    },
    onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
      offset.current = Math.max(0, event.nativeEvent.contentOffset.y);
      setVisible(offset.current > spacing.xxl);
    },
    jump() {
      const target = progressScrollTarget(
        offset.current,
        Object.values(positions.current),
        armed.current,
      );
      armed.current = true;
      setToTop(true);
      // Native scrolling provides platform easing and stops when the user drags.
      scrollTo(target.y, !reducedMotion.current);
    },
  };
}
export type ScrollReturn = ReturnType<typeof useScrollReturn>;
