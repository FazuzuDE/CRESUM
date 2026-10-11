import { useRef } from 'react';
import { FlatList, View, type FlatListProps } from 'react-native';
import { spacing } from '@/lib/theme';
import { useScrollReturn } from './useScrollReturn';
import { ScrollReturnButton } from './ScrollReturnButton';

export function AppFlatList<T>({
  style,
  contentContainerStyle,
  onScroll,
  onScrollBeginDrag,
  ...props
}: FlatListProps<T>) {
  const ref = useRef<FlatList<T>>(null);
  const control = useScrollReturn((offset, animated) =>
    ref.current?.scrollToOffset({ offset, animated }),
  );
  return (
    <View style={[{ flex: 1 }, style]}>
      <FlatList
        {...props}
        ref={ref}
        style={{ flex: 1 }}
        contentContainerStyle={[
          contentContainerStyle,
          { paddingBottom: spacing.xxxl + spacing.lg },
        ]}
        scrollEventThrottle={props.scrollEventThrottle ?? 16}
        onScroll={(event) => {
          control.onScroll(event);
          onScroll?.(event);
        }}
        onScrollBeginDrag={(event) => {
          control.reset();
          onScrollBeginDrag?.(event);
        }}
      />
      <ScrollReturnButton
        control={control}
        disabled={props.scrollEnabled === false}
      />
    </View>
  );
}
