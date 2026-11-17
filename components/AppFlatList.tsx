import {
  createElement,
  isValidElement,
  useRef,
  type ComponentType,
} from 'react';
import { FlatList, View, type FlatListProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '@/lib/theme';
import { useScrollReturn } from './useScrollReturn';
import { ScrollReturnButton } from './ScrollReturnButton';

export function AppFlatList<T>({
  style,
  contentContainerStyle,
  onScroll,
  onScrollBeginDrag,
  ListFooterComponent,
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
        contentInsetAdjustmentBehavior={
          props.contentInsetAdjustmentBehavior ?? 'never'
        }
        automaticallyAdjustContentInsets={
          props.automaticallyAdjustContentInsets ?? false
        }
        ListFooterComponent={
          <SafeAreaView edges={['bottom']}>
            {ListFooterComponent && !isValidElement(ListFooterComponent)
              ? createElement(ListFooterComponent as ComponentType)
              : ListFooterComponent}
          </SafeAreaView>
        }
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
        safeAreaBottom
        disabled={props.scrollEnabled === false}
      />
    </View>
  );
}
