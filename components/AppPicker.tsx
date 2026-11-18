import { useEffect, useRef, useReducer, useState, useMemo } from 'react';
import type { ComponentType } from 'react';
import {
  Animated,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useAnimatedValue,
  useWindowDimensions,
  type ViewProps,
} from 'react-native';
import { requireNativeView, requireOptionalNativeModule } from 'expo';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography } from '@/lib/theme';
import { useLocalization } from './LocalizationProvider';
import { useWheelClick } from './useWheelClick';

type Props = {
  flexible?: boolean;
  cyclic?: boolean;
  audible?: boolean;
  columns: string[][];
  selected: number[];
  labels: string[];
  onChange: (component: number, row: number) => void;
  onInteractionChange?: (active: boolean) => void;
};
type NativeProps = Omit<
  Props,
  'onChange' | 'onInteractionChange' | 'cyclic' | 'audible'
> &
  ViewProps & {
    selectionRevision: number;
    wheelRowHeight: number;
    onInteraction: (event: { nativeEvent: { active: boolean } }) => void;
    onSelect: (event: {
      nativeEvent: { component: number; row: number };
    }) => void;
  };
// Expo Go/web do not contain our local UIKit module. Never require a missing view.
const NativePicker: ComponentType<NativeProps> | null =
  Platform.OS === 'ios' && requireOptionalNativeModule('CresumPicker')
    ? requireNativeView<NativeProps>('CresumPicker')
    : null;

/** All app wheels share this seam: native Apple wheels on iOS, accessible fallback elsewhere. */
export function AppPicker({
  columns,
  selected,
  labels,
  onChange,
  onInteractionChange,
  flexible = false,
  cyclic = false,
  audible = false,
}: Props) {
  const [revision, refreshSelection] = useReducer((n: number) => n + 1, 0);
  const [available, setAvailable] = useState<number | null>(null);
  const changed = (component: number, row: number) => {
    onChange(component, row);
    refreshSelection();
  };
  const { fontScale } = useWindowDimensions();
  const height = Math.max(
    44,
    Math.ceil(typography.title2.lineHeight * fontScale + spacing.sm),
  );
  const viewport = flexible
    ? Math.max(height, available ?? height * 5)
    : height * 5;
  const geometry = flexible
    ? { flex: 1, minHeight: height, maxHeight: height * 5 }
    : { height: height * 5 };
  return (
    <View
      testID="picker-viewport"
      style={[s.columns, geometry]}
      onLayout={({ nativeEvent }) => setAvailable(nativeEvent.layout.height)}
    >
      {NativePicker && !cyclic ? (
        <NativePicker
          columns={columns}
          selected={selected}
          labels={labels}
          selectionRevision={revision}
          wheelRowHeight={height}
          onInteraction={({ nativeEvent }) =>
            onInteractionChange?.(nativeEvent.active)
          }
          style={s.nativePicker}
          onSelect={({ nativeEvent }) =>
            changed(nativeEvent.component, nativeEvent.row)
          }
        />
      ) : (
        columns.map((options, component) => (
          <WheelColumn
            key={component}
            options={options}
            cyclic={cyclic}
            audible={audible}
            selected={selected[component] ?? 0}
            label={labels[component]}
            height={height}
            viewport={viewport}
            revision={revision}
            onInteractionChange={onInteractionChange}
            onChange={(row) => changed(component, row)}
          />
        ))
      )}
      <View
        testID="wheel-selection-lines"
        pointerEvents="none"
        style={[s.selectionLines, { height, marginTop: -height / 2 }]}
      />
    </View>
  );
}
function WheelColumn({
  options,
  cyclic,
  audible,
  selected,
  label,
  height,
  viewport,
  revision,
  onChange,
  onInteractionChange,
}: {
  options: string[];
  cyclic: boolean;
  audible: boolean;
  selected: number;
  label: string;
  height: number;
  viewport: number;
  revision: number;
  onChange: (row: number) => void;
  onInteractionChange?: (active: boolean) => void;
}) {
  const { t } = useLocalization();
  // Keep a large virtualized runway in both directions, then silently move back
  // to its middle when scrolling stops. Only logical option indices escape.
  const looping = cyclic && options.length > 1;
  const click = useWheelClick(cyclic && audible);
  const origin = looping ? options.length * 100 : 0;
  const rows = useMemo(
    () =>
      looping
        ? Array.from(
            { length: options.length * 201 },
            (_, i) => options[i % options.length],
          )
        : options,
    [options, looping],
  );
  const list = useRef<FlatList<string>>(null);
  const physical = useRef(origin + selected);
  const scrollOffset = useAnimatedValue((origin + selected) * height);
  const last = useRef(selected);
  const dragging = useRef(false);
  const momentum = useRef(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const released = useRef(false);
  const signature = JSON.stringify([height, viewport, looping, options]);
  const geometry = useRef(signature);
  const padding = Math.max(0, (viewport - height) / 2);
  const clearSettle = () => {
    if (settleTimer.current !== null) clearTimeout(settleTimer.current);
    settleTimer.current = null;
  };
  useEffect(
    () => () => {
      if (settleTimer.current !== null) clearTimeout(settleTimer.current);
    },
    [],
  );
  useEffect(() => {
    if (last.current !== selected || geometry.current !== signature) {
      geometry.current = signature;
      momentum.current = false;
      released.current = false;
      last.current = selected;
      dragging.current = false;
      clearSettle();
      physical.current = origin + selected;
      scrollOffset.setValue(physical.current * height);
      list.current?.scrollToOffset({
        offset: physical.current * height,
        animated: false,
      });
      onInteractionChange?.(false);
    }
  }, [
    selected,
    height,
    signature,
    origin,
    revision,
    scrollOffset,
    onInteractionChange,
  ]);
  const recenter = () => {
    if (!looping) return;
    physical.current = origin + last.current;
    scrollOffset.setValue(physical.current * height);
    list.current?.scrollToOffset({
      offset: physical.current * height,
      animated: false,
    });
  };
  const choose = (row: number) => {
    if (!options.length) return;
    physical.current = Math.max(0, Math.min(rows.length - 1, row));
    const next = looping ? physical.current % options.length : physical.current;
    if (next === last.current) return;
    last.current = next;
    // No feedback on mount or prop synchronization; unsupported/muted feedback is harmless.
    void Haptics.selectionAsync?.().catch(() => {});
    onChange(next);
  };
  const track = (offset: number) => {
    const row = Math.max(
      0,
      Math.min(rows.length - 1, Math.round(offset / height)),
    );
    if (row !== physical.current) click();
    physical.current = row;
  };
  const finish = () => {
    clearSettle();
    const userMotion = dragging.current || momentum.current;
    dragging.current = false;
    momentum.current = false;
    released.current = false;
    if (userMotion) choose(physical.current);
    recenter();
    onInteractionChange?.(false);
  };
  const waitForIdle = () => {
    clearSettle();
    // Some platforms omit momentum callbacks. Every coast event extends the
    // idle fallback; release alone must never interrupt a moving native wheel.
    settleTimer.current = setTimeout(finish, 200);
  };
  const scroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollOffset } } }],
    // Animated.event only registers this deferred listener (AnimatedEvent.js);
    // it never invokes the callback or reads these refs during render.
    // eslint-disable-next-line react-hooks/refs
    {
      useNativeDriver: Platform.OS !== 'web',
      listener: (event: { nativeEvent: { contentOffset: { y: number } } }) => {
        const offset = event.nativeEvent.contentOffset.y;
        if (looping) {
          if (dragging.current || momentum.current) {
            track(offset);
            if (released.current) waitForIdle();
          }
        } else if (dragging.current) choose(Math.round(offset / height));
      },
    },
  );
  return (
    <View style={{ flex: 1, height: viewport }}>
      <Animated.FlatList
        ref={list}
        data={rows}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityHint={t('picker.hint')}
        accessibilityValue={{
          min: 0,
          max: Math.max(0, options.length - 1),
          now: selected,
          text: options[selected],
        }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={({ nativeEvent }) => {
          if (
            nativeEvent.actionName !== 'increment' &&
            nativeEvent.actionName !== 'decrement'
          )
            return;
          clearSettle();
          dragging.current = false;
          momentum.current = false;
          if (options.length > 1) click();
          choose(
            physical.current +
              (nativeEvent.actionName === 'increment' ? 1 : -1),
          );
          recenter();
          scrollOffset.setValue(physical.current * height);
          list.current?.scrollToOffset({
            offset: physical.current * height,
            animated: false,
          });
          onInteractionChange?.(false);
        }}
        initialScrollIndex={origin + selected}
        getItemLayout={(_, index) => ({
          length: height,
          offset: index * height,
          index,
        })}
        contentContainerStyle={{ paddingVertical: padding }}
        snapToInterval={height}
        decelerationRate={looping ? 'normal' : 'fast'}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => {
          clearSettle();
          onInteractionChange?.(true);
          dragging.current = true;
          momentum.current = true;
          released.current = false;
        }}
        onScroll={scroll}
        onScrollEndDrag={({ nativeEvent }) => {
          if (looping) {
            track(nativeEvent.contentOffset.y);
            dragging.current = false;
            released.current = true;
            waitForIdle();
          } else {
            if (dragging.current)
              choose(Math.round(nativeEvent.contentOffset.y / height));
            dragging.current = false;
            onInteractionChange?.(false);
          }
        }}
        onMomentumScrollBegin={() => {
          clearSettle();
          if (momentum.current) onInteractionChange?.(true);
          if (looping && momentum.current) waitForIdle();
          else if (!looping) dragging.current = momentum.current;
        }}
        onMomentumScrollEnd={({ nativeEvent }) => {
          if (looping) {
            if (dragging.current || momentum.current)
              track(nativeEvent.contentOffset.y);
            finish();
          } else {
            clearSettle();
            if (dragging.current)
              choose(Math.round(nativeEvent.contentOffset.y / height));
            dragging.current = false;
            momentum.current = false;
            onInteractionChange?.(false);
          }
        }}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item, index }) => {
          const inputRange = [-2.5, -1, 0, 1, 2.5].map(
            (distance) => (index + distance) * height,
          );
          const tilt = scrollOffset.interpolate({
            inputRange,
            outputRange: [58, 22, 0, -22, -58].map((angle) => `${angle}deg`),
            extrapolate: 'clamp',
          });
          const opacity = scrollOffset.interpolate({
            inputRange,
            outputRange: [0.14, 0.58, 1, 0.58, 0.14],
            extrapolate: 'clamp',
          });
          return (
            <Pressable
              accessible={false}
              style={[s.row, { height }]}
              onPress={() => {
                clearSettle();
                dragging.current = false;
                momentum.current = false;
                if (index % options.length !== last.current) click();
                choose(index);
                list.current?.scrollToOffset({
                  offset: index * height,
                  animated: true,
                });
                onInteractionChange?.(false);
              }}
            >
              <Animated.Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[
                  s.text,
                  {
                    opacity,
                    transform: [{ perspective: 480 }, { rotateX: tilt }],
                  },
                ]}
              >
                {item}
              </Animated.Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
const s = StyleSheet.create({
  columns: {
    direction: 'ltr',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  nativePicker: { flex: 1, alignSelf: 'stretch' },
  selectionLines: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.wheelSelectionSeparator,
  },
  row: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxs,
  },
  text: {
    ...typography.title2,
    fontWeight: '400',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
});
