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

type Action = { onPress: () => void; disabled?: boolean };
type Target = {
  action: RefObject<Action | undefined>;
  inline: boolean;
  disabled: boolean;
};
type Register = (target: Target) => () => void;

const BackSwipeContext = createContext<{
  register: Register;
  gesture?: PanGesture;
} | null>(null);

export function useBackSwipeAction(action?: Action, inline = false) {
  const register = useContext(BackSwipeContext)?.register;
  const latest = useRef(action);
  useLayoutEffect(() => {
    latest.current = action;
  }, [action]);

  const present = action !== undefined;
  const disabled = action?.disabled ?? false;
  useLayoutEffect(() => {
    if (present) return register?.({ action: latest, inline, disabled });
  }, [register, present, inline, disabled]);
}

export function useBackSwipeGesture() {
  return useContext(BackSwipeContext)?.gesture;
}

/** A native modal starts a new input surface even when it is nested in React. */
export function BackSwipeBoundary({
  isolate = false,
  ...props
}: ViewProps & { isolate?: boolean }) {
  const enclosing = useContext(BackSwipeContext);
  const supported = Platform.OS === 'ios' || Platform.OS === 'android';
  if (!supported || (enclosing && !isolate)) return <View {...props} />;
  return <BackSwipeSurface {...props} />;
}

function BackSwipeSurface(props: ViewProps) {
  const [targets, setTargets] = useState<Target[]>([]);
  const register = useCallback<Register>((target) => {
    setTargets((current) => [...current, target]);
    return () =>
      setTargets((current) => current.filter((item) => item !== target));
  }, []);
  const target = targets.filter((item) => item.inline).at(-1) ?? targets.at(-1);
  const enabled = target !== undefined && !target.disabled;
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const offset = useSharedValue(0);
  const tracking = useSharedValue(false);
  const settling = useSharedValue(false);
  const currentTarget = useRef(target);
  const [completion, setCompletion] = useState(0);
  useLayoutEffect(() => {
    currentTarget.current = target;
    cancelAnimation(offset);
    offset.set(0);
    tracking.set(false);
    settling.set(false);
  }, [target, completion, offset, tracking, settling]);
  const completeBack = () => {
    if (currentTarget.current !== target) return;
    const action = target?.action.current;
    if (action && !action.disabled) action.onPress();
    // Reset the surface after React commits the destination, including inline Back.
    setCompletion((count) => count + 1);
  };
  const motion = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.get() }],
  }));

  const gesture = usePanGesture({
    enabled,
    maxPointers: 1,
    activeOffsetX: 24,
    failOffsetX: -12,
    failOffsetY: [-15, 15],
    onActivate: ({ pointerType }) => {
      'worklet';
      if (!enabled || settling.get() || pointerType !== PointerType.TOUCH)
        return;
      cancelAnimation(offset);
      tracking.set(true);
    },
    onUpdate: ({ translationX, translationY }) => {
      'worklet';
      if (tracking.get() && !reduceMotion) {
        offset.set(
          translationX >= Math.abs(translationY)
            ? Math.min(width, Math.max(0, translationX))
            : 0,
        );
      }
    },
    onDeactivate: ({ canceled, translationX, translationY, velocityX }) => {
      'worklet';
      if (!tracking.get()) return;
      tracking.set(false);
      const traveled =
        translationX >= 72 || (translationX >= 36 && velocityX >= 550);
      if (canceled || !traveled || translationX < Math.abs(translationY) * 2) {
        offset.set(withTiming(0, { duration: 160 }));
        return;
      }

      settling.set(true);
      if (reduceMotion) {
        scheduleOnRN(completeBack);
        return;
      }
      offset.set(
        withTiming(width, { duration: 150 }, (finished) => {
          'worklet';
          if (finished) scheduleOnRN(completeBack);
        }),
      );
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
