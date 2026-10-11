import { useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { colors, radius, spacing, typography } from '@/lib/theme';

/** Local iOS-style wheel; no platform picker dependency or stored-data changes. */
export function HistoryCountWheel({
  maximum,
  value,
  onChange,
}: {
  maximum: number;
  value: number;
  onChange: (value: number) => void;
}) {
  const list = useRef<FlatList<number>>(null);
  const { fontScale } = useWindowDimensions();
  const height = Math.max(
    48,
    Math.ceil(typography.title2.lineHeight * fontScale + spacing.md),
  );
  const [viewport, setViewport] = useState(height * 5);
  const padding = Math.max(0, (viewport - height) / 2);
  const selected = Math.min(Math.max(0, value), maximum);
  const options = Array.from({ length: maximum + 1 }, (_, index) => index);
  const choose = (index: number) => {
    const next = Math.min(maximum, Math.max(0, index));
    onChange(next);
    list.current?.scrollToOffset({ offset: next * height, animated: false });
  };
  return (
    <View
      style={{ flex: 1, minHeight: height, maxHeight: height * 5 }}
      onLayout={({ nativeEvent }) => setViewport(nativeEvent.layout.height)}
    >
      <View pointerEvents="none" style={[s.band, { top: padding, height }]} />
      <FlatList
        ref={list}
        key={`${height}-${padding}`}
        accessible
        accessibilityHint="Swipe up or down to change the count; zero means All workouts"
        data={options}
        accessibilityRole="adjustable"
        accessibilityLabel="Number of recent workouts"
        accessibilityValue={{
          min: 0,
          max: maximum,
          now: selected,
          text: selected === 0 ? 'All workouts' : String(selected),
        }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={({ nativeEvent }) =>
          choose(selected + (nativeEvent.actionName === 'increment' ? 1 : -1))
        }
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
        onScroll={({ nativeEvent }) =>
          onChange(
            Math.min(
              maximum,
              Math.max(0, Math.round(nativeEvent.contentOffset.y / height)),
            ),
          )
        }
        scrollEventThrottle={16}
        keyExtractor={(item) => String(item)}
        renderItem={({ item }) => (
          <Pressable
            accessible={false}
            onPress={() => choose(item)}
            style={[s.row, { height }]}
          >
            <Text style={[s.text, item !== selected && s.quiet]}>
              {item === 0 ? 'All' : item}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}
const s = StyleSheet.create({
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
  },
  row: { alignItems: 'center', justifyContent: 'center' },
  text: {
    ...typography.title2,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  quiet: { color: colors.textSecondary, fontWeight: '400' },
});
