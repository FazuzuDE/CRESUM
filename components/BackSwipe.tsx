import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import {
  Platform,
  View,
  useWindowDimensions,
  type ViewProps,
} from 'react-native';
import {
  GestureDetector,
  PointerType,
  usePanGesture,
  type PanGesture,
} from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useLayoutDirection } from './LayoutDirectionContext';

export type BackSwipeAction = {
  onPress: () => void;
  disabled?: boolean;
  // Change when an existing control starts returning from a different step.
  scope?: string;
};
type Priority = 'fallback' | 'page' | 'inline';
type Target = {
  action: RefObject<BackSwipeAction | undefined>;
  priority: Priority;
  disabled: boolean;
};
type SwipeDestination = { target: Target; direction: 1 | -1 };
type SwipePhase = 'idle' | 'began' | 'dragging' | 'settling';
type Register = (target: Target) => () => void;

const BackSwipeContext = createContext<{
  register: Register;
  gesture?: PanGesture;
} | null>(null);

export function useBackSwipeAction(
  action?: BackSwipeAction,
  priority: Priority = 'page',
) {
  const register = useContext(BackSwipeContext)?.register;
  const latest = useRef(action);
  useLayoutEffect(() => {
    latest.current = action;
  }, [action]);

  const present = action !== undefined;
  const disabled = action?.disabled ?? false;
  const scope = action?.scope;
  useLayoutEffect(() => {
    if (present) return register?.({ action: latest, priority, disabled });
  }, [register, present, priority, disabled, scope]);
}

export function useBackSwipeGesture() {
  return useContext(BackSwipeContext)?.gesture;
}

/** A native modal starts a new input surface even when it is nested in React. */
export function BackSwipeBoundary({
  isolate = false,
  active = true,
  ...props
}: ViewProps & { isolate?: boolean; active?: boolean }) {
  const enclosing = useContext(BackSwipeContext);
  const supported = Platform.OS === 'ios' || Platform.OS === 'android';
  if (!supported || (enclosing && !isolate)) return <View {...props} />;
  return <BackSwipeSurface {...props} active={active} />;
}

function BackSwipeSurface({
  active,
  ...props
}: ViewProps & { active: boolean }) {
  const [targets, setTargets] = useState<Target[]>([]);
  const register = useCallback<Register>((target) => {
    setTargets((current) => [...current, target]);
    return () =>
      setTargets((current) => current.filter((item) => item !== target));
  }, []);
  const target =
    targets.findLast((item) => item.priority === 'inline') ??
    targets.findLast((item) => item.priority === 'page') ??
    targets.at(-1);
  const direction = useLayoutDirection() === 'rtl' ? -1 : 1;
  const enabled = active && target !== undefined && !target.disabled;
  const destination = useMemo<SwipeDestination | undefined>(
    () => (enabled ? { target, direction } : undefined),
    [target, enabled, direction],
  );
  const currentDestination = useRef(destination);
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const offset = useSharedValue(0);
  const phase = useSharedValue<SwipePhase>('idle');
  const [completion, setCompletion] = useState(0);
  useLayoutEffect(() => {
    currentDestination.current = destination;
    cancelAnimation(offset);
    offset.set(0);
    phase.set('idle');
    return () => {
      currentDestination.current = undefined;
    };
  }, [destination, completion, offset, phase]);
  const completeBack = () => {
    if (!destination || currentDestination.current !== destination) return;
    const action = destination.target.action.current;
    if (action && !action.disabled) action.onPress();
    // Reset the offset after React commits the destination, including inline Back.
    setCompletion((count) => count + 1);
  };
  const motion = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.get() }],
  }));

  const gesture = usePanGesture({
    enabled,
    maxPointers: 1,
    activeOffsetX: 24 * direction,
    failOffsetX: -12 * direction,
    failOffsetY: [-15, 15],
    onBegin: ({ pointerType, numberOfPointers }) => {
      'worklet';
      if (
        enabled &&
        phase.get() === 'idle' &&
        pointerType === PointerType.TOUCH &&
        numberOfPointers === 1
      ) {
        phase.set('began');
      }
    },
    onActivate: () => {
      'worklet';
      if (phase.get() !== 'began') return;
      cancelAnimation(offset);
      phase.set('dragging');
    },
    onUpdate: ({ translationX, translationY }) => {
      'worklet';
      if (phase.get() !== 'dragging' || reduceMotion) return;
      const distance = translationX * direction;
      offset.set(
        distance >= Math.abs(translationY)
          ? Math.min(width, distance) * direction
          : 0,
      );
    },
    onTouchesDown: ({ numberOfTouches }) => {
      'worklet';
      if (numberOfTouches <= 1) return;
      const current = phase.get();
      if (current === 'dragging') offset.set(withTiming(0, { duration: 160 }));
      if (current === 'began' || current === 'dragging') phase.set('idle');
    },
    onDeactivate: ({ canceled, translationX, translationY, velocityX }) => {
      'worklet';
      if (phase.get() !== 'dragging') return;
      const distance = translationX * direction;
      const speed = velocityX * direction;
      const traveled = distance >= 72 || (distance >= 36 && speed >= 550);
      if (canceled || !traveled || distance < Math.abs(translationY) * 2) {
        phase.set('idle');
        offset.set(withTiming(0, { duration: 160 }));
        return;
      }

      phase.set('settling');
      if (reduceMotion) {
        scheduleOnRN(completeBack);
        return;
      }
      offset.set(
        withTiming(width * direction, { duration: 150 }, (finished) => {
          'worklet';
          if (finished) scheduleOnRN(completeBack);
        }),
      );
    },
    onFinalize: () => {
      'worklet';
      if (phase.get() === 'began') phase.set('idle');
    },
  });
  const value = useMemo(
    () => ({ register, gesture: enabled ? gesture : undefined }),
    [register, enabled, gesture],
  );

  return (
    <BackSwipeContext.Provider value={value}>
      <GestureDetector gesture={gesture}>
        <Animated.View
          {...props}
          style={enabled ? [props.style, motion] : props.style}
          collapsable={false}
        />
      </GestureDetector>
    </BackSwipeContext.Provider>
  );
}
