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
  const swiping = useRef<Target | undefined>(undefined);
  const enabled = target !== undefined && !target.disabled;

  const gesture = usePanGesture({
    enabled,
    runOnJS: true,
    maxPointers: 1,
    activeOffsetX: 24,
    failOffsetX: -12,
    failOffsetY: [-15, 15],
    onActivate: ({ pointerType }) => {
      swiping.current = pointerType === PointerType.TOUCH ? target : undefined;
    },
    onDeactivate: ({ canceled, translationX, translationY, velocityX }) => {
      const started = swiping.current;
      swiping.current = undefined;
      const action = started?.action.current;
      const traveled =
        translationX >= 72 || (translationX >= 36 && velocityX >= 550);
      if (
        enabled &&
        started === target &&
        action &&
        !action.disabled &&
        !canceled &&
        traveled &&
        translationX >= Math.abs(translationY) * 2
      ) {
        action.onPress();
      }
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
