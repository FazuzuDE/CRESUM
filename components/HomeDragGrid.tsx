import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  AccessibilityInfo,
  Animated,
  AppState,
  StyleSheet,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { DashboardGrid, type DashboardGridItem } from './DashboardGrid';
import type { ProgramScroll } from './useProgramScroll';
import { cardShadow, spacing } from '@/lib/theme';
import { type HomeWidgetId } from '@/lib/home-layout';
import { useLocalization } from './LocalizationProvider';

type Layout = { y: number; height: number; width: number };
type Held = {
  id: string;
  from: number;
  target: number;
  translation: number;
  scroll: number;
  order: string[];
  layouts: Layout[];
};
type Position = { id: string; from: number; target: number; height: number };
const feedback = () => {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};

// Presentation-only dragging. The parent owns the draft and durable Save/Cancel.
export function HomeDragGrid({
  items,
  editing,
  disabled,
  scroll,
  onBegin,
  onMove,
  onLayout,
  onRowLayout,
}: {
  items: DashboardGridItem[];
  editing: boolean;
  disabled: boolean;
  scroll: ProgramScroll;
  onBegin: () => boolean;
  onMove: (id: HomeWidgetId, target: HomeWidgetId) => void;
  onLayout: NonNullable<React.ComponentProps<typeof View>['onLayout']>;
  onRowLayout: (id: string, y: number) => void;
}) {
  const { t } = useLocalization();
  const translate = useRef(t);
  useLayoutEffect(() => {
    translate.current = t;
  }, [t]);
  const latest = useRef({ items, disabled, onBegin, onMove });
  useLayoutEffect(() => {
    latest.current = { items, disabled, onBegin, onMove };
  }, [items, disabled, onBegin, onMove]);
  const layouts = useRef(new Map<string, Partial<Layout>>());
  const held = useRef<Held | null>(null);
  const alive = useRef(true);
  const [offset] = useState(() => new Animated.Value(0));
  const [position, setPosition] = useState<Position | null>(null);
  const [reduceMotion, setReduceMotion] = useState(true);
  const cancel = useCallback(
    (id?: string) => {
      if (!alive.current || (id && held.current?.id !== id)) return;
      held.current = null;
      scroll.stop();
      offset.setValue(0);
      setPosition(null);
    },
    [offset, scroll],
  );
  useEffect(() => {
    alive.current = true;
    let current = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (current) setReduceMotion(v);
      })
      .catch(() => {});
    const motion = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    const app = AppState.addEventListener('change', (state) => {
      if (state !== 'active') cancel();
    });
    return () => {
      current = false;
      alive.current = false;
      motion.remove();
      app.remove();
      held.current = null;
      scroll.stop();
      offset.setValue(0);
    };
  }, [cancel, offset, scroll]);
  // Saving, opening the list editor, or content changing invalidates an in-flight drop.
  const orderKey = JSON.stringify(items.map((x) => x.id));
  useEffect(() => {
    cancel();
  }, [disabled, orderKey, cancel]);
  useEffect(() => {
    if (!editing) cancel();
  }, [editing, cancel]);
  const move = useCallback(() => {
    const drag = held.current;
    if (!drag) return;
    const source = drag.layouts[drag.from],
      first = drag.layouts[0],
      last = drag.layouts.at(-1)!;
    const min = first.y - source.y,
      max = last.y + last.height - source.height - source.y;
    scroll.range(min - drag.translation, max - drag.translation);
    const delta = Math.max(min, Math.min(max, drag.translation + drag.scroll));
    let target = drag.from;
    drag.layouts.forEach((layout, index) => {
      const middle = layout.y + layout.height / 2;
      if (index < drag.from && source.y + delta <= middle)
        target = Math.min(target, index);
      if (index > drag.from && source.y + source.height + delta >= middle)
        target = Math.max(target, index);
    });
    offset.setValue(delta);
    if (target !== drag.target) {
      drag.target = target;
      setPosition({
        id: drag.id,
        from: drag.from,
        target,
        height: source.height,
      });
    }
  }, [offset, scroll]);
  const start = useCallback(
    (id: string, y: number) => {
      const current = latest.current;
      if (
        !alive.current ||
        current.disabled ||
        held.current ||
        ['inactive', 'background'].includes(AppState.currentState)
      )
        return;
      if (!current.onBegin()) return;
      feedback();
      const ids = current.items.map((x) => x.id),
        measured = ids.map((key) => layouts.current.get(key));
      if (
        measured.some(
          (row) => row?.y === undefined || !row.height || !row.width,
        )
      )
        return;
      const from = ids.indexOf(id);
      if (from < 0) return;
      held.current = {
        id,
        from,
        target: from,
        translation: 0,
        scroll: 0,
        order: ids,
        layouts: measured as Layout[],
      };
      setPosition({ id, from, target: from, height: measured[from]!.height! });
      scroll.start(
        y,
        (delta) => {
          if (held.current) {
            held.current.scroll = delta;
            move();
          }
        },
        cancel,
      );
      move();
      AccessibilityInfo.announceForAccessibility?.(
        translate.current('home.editAnnounce'),
      );
    },
    [cancel, move, scroll],
  );
  const change = useCallback(
    (id: string, translation: number, y: number) => {
      if (!alive.current || held.current?.id !== id) return;
      held.current.translation = translation;
      scroll.finger(y);
      move();
    },
    [move, scroll],
  );
  const end = useCallback(
    (id: string, success: boolean) => {
      const drag = held.current,
        current = latest.current;
      if (!alive.current || !drag || drag.id !== id) return;
      if (
        success &&
        !current.disabled &&
        drag.from !== drag.target &&
        JSON.stringify(current.items.map((x) => x.id)) ===
          JSON.stringify(drag.order)
      ) {
        current.onMove(
          id as HomeWidgetId,
          drag.order[drag.target] as HomeWidgetId,
        );
        AccessibilityInfo.announceForAccessibility?.(
          translate.current('home.moved', {
            index: drag.target + 1,
            total: drag.order.length,
          }),
        );
      }
      cancel();
    },
    [cancel],
  );
  const measure = useCallback(
    (id: string, patch: Partial<Layout>) => {
      const previous = layouts.current.get(id);
      if (
        held.current &&
        previous &&
        Object.entries(patch).some(
          ([key, value]) => previous[key as keyof Layout] !== value,
        )
      )
        cancel();
      layouts.current.set(id, { ...previous, ...patch });
    },
    [cancel],
  );
  return (
    <DashboardGrid
      activeItemId={position?.id}
      items={items.map((item, index) => {
        let shift = 0;
        if (position && position.id !== item.id) {
          if (index > position.from && index <= position.target)
            shift = -(position.height + spacing.lg);
          if (index < position.from && index >= position.target)
            shift = position.height + spacing.lg;
        }
        return {
          ...item,
          content: (
            <DragCard
              id={item.id as HomeWidgetId}
              index={index}
              count={items.length}
              editing={editing}
              disabled={disabled}
              reduceMotion={reduceMotion}
              held={position?.id === item.id}
              offset={offset}
              shift={shift}
              measure={measure}
              start={start}
              change={change}
              end={end}
              cancel={cancel}
              onAccessibleMove={(direction) => {
                const current = latest.current;
                if (current.disabled || held.current || !current.onBegin())
                  return;
                const target = current.items[index + direction];
                if (!target) return;
                current.onMove(
                  item.id as HomeWidgetId,
                  target.id as HomeWidgetId,
                );
                feedback();
              }}
            >
              {item.content}
            </DragCard>
          ),
        };
      })}
      onLayout={onLayout}
      onRowLayout={(id, y) => {
        measure(id, { y });
        onRowLayout(id, y);
      }}
    />
  );
}

type CardProps = {
  id: HomeWidgetId;
  index: number;
  count: number;
  editing: boolean;
  disabled: boolean;
  reduceMotion: boolean;
  held: boolean;
  offset: Animated.Value;
  shift: number;
  children: ReactNode;
  measure: (id: string, patch: Partial<Layout>) => void;
  start: (id: string, y: number) => void;
  change: (id: string, translation: number, y: number) => void;
  end: (id: string, success: boolean) => void;
  cancel: (id?: string) => void;
  onAccessibleMove: (direction: number) => void;
};
function DragCard({
  id,
  index,
  count,
  editing,
  disabled,
  reduceMotion,
  held,
  offset,
  shift,
  children,
  measure,
  start,
  change,
  end,
  cancel,
  onAccessibleMove,
}: CardProps) {
  const { t } = useLocalization();
  const [rotation] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!editing || reduceMotion) {
      rotation.setValue(0);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(rotation, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(rotation, {
          toValue: -1,
          duration: 160,
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
    );
    animation.start();
    return () => {
      animation.stop();
      rotation.setValue(0);
    };
  }, [editing, reduceMotion, rotation]);
  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!disabled && count > 1)
        .maxPointers(1)
        .activateAfterLongPress(450)
        .runOnJS(true)
        .onStart((e) => start(id, e.absoluteY))
        .onUpdate((e) => change(id, e.translationY, e.absoluteY))
        .onEnd((_e, success) => end(id, success))
        .onFinalize(() => cancel(id)),
    [disabled, count, start, id, change, end, cancel],
  );
  return (
    <Animated.View
      testID={`home-drag-${id}`}
      onLayout={(e) =>
        measure(id, {
          height: e.nativeEvent.layout.height,
          width: e.nativeEvent.layout.width,
        })
      }
      style={[
        {
          transform: [{ translateY: held ? offset : shift }],
          zIndex: held ? 1 : 0,
        },
        held && cardShadow,
      ]}
    >
      <GestureDetector gesture={gesture}>
        <Animated.View
          accessible={editing}
          accessibilityRole={editing ? 'adjustable' : undefined}
          accessibilityLabel={
            editing
              ? t('home.position', {
                  label: t(`home.widget.${id}`),
                  index: index + 1,
                  total: count,
                })
              : undefined
          }
          accessibilityHint={t('home.dragHint')}
          accessibilityActions={
            editing && !disabled
              ? [
                  ...(index > 0
                    ? [{ name: 'moveUp', label: t('workout.moveUp') }]
                    : []),
                  ...(index < count - 1
                    ? [{ name: 'moveDown', label: t('workout.moveDown') }]
                    : []),
                ]
              : []
          }
          onAccessibilityAction={(e) => {
            if (e.nativeEvent.actionName === 'moveUp') onAccessibleMove(-1);
            if (e.nativeEvent.actionName === 'moveDown') onAccessibleMove(1);
          }}
          style={{
            transform: [
              {
                rotate: rotation.interpolate({
                  inputRange: [-1, 1],
                  outputRange: ['-0.4deg', '0.4deg'],
                }),
              },
            ],
          }}
        >
          <View
            pointerEvents={editing ? 'none' : 'auto'}
            importantForAccessibility={editing ? 'no-hide-descendants' : 'auto'}
            accessibilityElementsHidden={editing}
            style={s.content}
          >
            {children}
          </View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}
const s = StyleSheet.create({ content: { gap: spacing.lg } });
