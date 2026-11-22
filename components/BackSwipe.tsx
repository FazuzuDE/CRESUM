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
import { Platform, View, type ViewProps } from 'react-native';
import {
  GestureDetector,
  PointerType,
  usePanGesture,
  type PanGesture,
} from 'react-native-gesture-handler';

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
  const destination = useRef<SwipeDestination | undefined>(undefined);
  const swiping = useRef<SwipeDestination | undefined>(undefined);
  useLayoutEffect(() => {
    destination.current = enabled ? { target, direction } : undefined;
    return () => {
      destination.current = undefined;
      swiping.current = undefined;
    };
  }, [target, enabled, direction]);

  const gesture = usePanGesture({
    enabled,
    runOnJS: true,
    maxPointers: 1,
    activeOffsetX: 24 * direction,
    failOffsetX: -12 * direction,
    failOffsetY: [-15, 15],
    onBegin: ({ pointerType, numberOfPointers }) => {
      swiping.current =
        pointerType === PointerType.TOUCH && numberOfPointers === 1
          ? destination.current
          : undefined;
    },
    onTouchesDown: ({ numberOfTouches }) => {
      // A second finger can arrive after the pan has already activated.
      if (numberOfTouches > 1) swiping.current = undefined;
    },
    onDeactivate: ({ canceled, translationX, translationY, velocityX }) => {
      const started = swiping.current;
      swiping.current = undefined;
      if (!started || started !== destination.current || canceled) return;

      const distance = translationX * started.direction;
      const speed = velocityX * started.direction;
      const traveled = distance >= 72 || (distance >= 36 && speed >= 550);
      const action = started.target.action.current;
      if (
        traveled &&
        distance >= Math.abs(translationY) * 2 &&
        action &&
        !action.disabled
      ) {
        action.onPress();
      }
    },
    onFinalize: () => {
      swiping.current = undefined;
    },
  });
  const value = useMemo(
    () => ({ register, gesture: enabled ? gesture : undefined }),
    [register, enabled, gesture],
  );

  return (
    <BackSwipeContext.Provider value={value}>
      <GestureDetector gesture={gesture}>
        <View {...props} collapsable={false} />
      </GestureDetector>
    </BackSwipeContext.Provider>
  );
}
