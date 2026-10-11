import { useEffect, useRef, useReducer, useState } from 'react';
import type { ComponentType } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ViewProps,
} from 'react-native';
import { requireNativeView, requireOptionalNativeModule } from 'expo';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, typography } from '@/lib/theme';

type Props = {
  flexible?: boolean;
  columns: string[][];
  selected: number[];
  labels: string[];
  onChange: (component: number, row: number) => void;
};
type NativeProps = Omit<Props, 'onChange'> &
  ViewProps & {
    selectionRevision: number;
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
  flexible = false,
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
  if (NativePicker)
    return (
      <NativePicker
        columns={columns}
        selected={selected}
        labels={labels}
        selectionRevision={revision}
        style={[{ width: '100%' }, geometry]}
        onSelect={({ nativeEvent }) =>
          changed(nativeEvent.component, nativeEvent.row)
        }
      />
    );
  return (
    <View
      testID="picker-viewport"
      style={[s.columns, geometry]}
      onLayout={({ nativeEvent }) => setAvailable(nativeEvent.layout.height)}
    >
      {columns.map((options, component) => (
        <WheelColumn
          key={component}
          options={options}
          selected={selected[component] ?? 0}
          label={labels[component]}
          height={height}
          viewport={viewport}
          revision={revision}
          onChange={(row) => changed(component, row)}
        />
      ))}
    </View>
  );
}
function WheelColumn({
  options,
  selected,
  label,
  height,
  viewport,
  revision,
  onChange,
}: {
  options: string[];
  selected: number;
  label: string;
  height: number;
  viewport: number;
  revision: number;
  onChange: (row: number) => void;
}) {
  const list = useRef<FlatList<string>>(null);
  const last = useRef(selected);
  const dragging = useRef(false);
  const momentum = useRef(false);
  const geometry = useRef(`${height}:${viewport}`);
  const padding = Math.max(0, (viewport - height) / 2);
  useEffect(() => {
    if (
      last.current !== selected ||
      geometry.current !== `${height}:${viewport}`
    ) {
      geometry.current = `${height}:${viewport}`;
      momentum.current = false;
      last.current = selected;
      dragging.current = false;
      list.current?.scrollToOffset({
        offset: selected * height,
        animated: false,
      });
    }
  }, [selected, height, viewport, revision]);
  const choose = (row: number) => {
    const next = Math.max(0, Math.min(options.length - 1, row));
    if (next === last.current) return;
    last.current = next;
    // No feedback on mount or prop synchronization; unsupported/muted feedback is harmless.
    void Haptics.selectionAsync?.().catch(() => {});
    onChange(next);
  };
  return (
    <View style={{ flex: 1, height: viewport }}>
      <View pointerEvents="none" style={[s.band, { top: padding, height }]} />
      <FlatList
        ref={list}
        data={options}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityHint="Swipe up or down to change the selected value"
        accessibilityValue={{
          min: 0,
          max: options.length - 1,
          now: selected,
          text: options[selected],
        }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={({ nativeEvent }) => {
          dragging.current = false;
          momentum.current = false;
          choose(selected + (nativeEvent.actionName === 'increment' ? 1 : -1));
          list.current?.scrollToOffset({
            offset: last.current * height,
            animated: false,
          });
        }}
        initialScrollIndex={selected}
        getItemLayout={(_, index) => ({
          length: height,
          offset: index * height,
          index,
        })}
        contentContainerStyle={{ paddingVertical: padding }}
        snapToInterval={height}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => {
          dragging.current = true;
          momentum.current = true;
        }}
        onScroll={({ nativeEvent }) => {
          if (dragging.current)
            choose(Math.round(nativeEvent.contentOffset.y / height));
        }}
        onScrollEndDrag={({ nativeEvent }) => {
          if (dragging.current)
            choose(Math.round(nativeEvent.contentOffset.y / height));
          dragging.current = false;
        }}
        onMomentumScrollBegin={() => {
          dragging.current = momentum.current;
        }}
        onMomentumScrollEnd={({ nativeEvent }) => {
          if (dragging.current)
            choose(Math.round(nativeEvent.contentOffset.y / height));
          dragging.current = false;
          momentum.current = false;
        }}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item, index }) => (
          <Pressable
            accessible={false}
            style={[s.row, { height }]}
            onPress={() => {
              dragging.current = false;
              momentum.current = false;
              choose(index);
              list.current?.scrollToOffset({
                offset: index * height,
                animated: true,
              });
            }}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[s.text, index !== selected && s.quiet]}
            >
              {item}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}
const s = StyleSheet.create({
  columns: { flexDirection: 'row' },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.sm,
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
  quiet: { color: colors.textSecondary },
});
