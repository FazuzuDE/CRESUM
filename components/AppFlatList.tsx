import {
  createElement,
  isValidElement,
  useContext,
  useRef,
  type ComponentType,
  type ReactNode,
} from 'react';
import { FlatList, View, type FlatListProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '@/lib/theme';
import { useScrollReturn } from './useScrollReturn';
import { ScrollReturnButton } from './ScrollReturnButton';
import { ContentScrollView } from './ContentScrollView';
import { DockSpace } from './DockSpace';

export function AppFlatList<T>({
  style,
  contentContainerStyle,
  onScroll,
  onScrollBeginDrag,
  ListFooterComponent,
  fixedHeader,
  dockAware = false,
  ...props
}: FlatListProps<T> & { fixedHeader?: ReactNode; dockAware?: boolean }) {
  const dockSpace = useContext(DockSpace);
  const bottomOverlay = dockAware ? dockSpace : 0;
  const ref = useRef<FlatList<T>>(null);
  const control = useScrollReturn((offset, animated) =>
    ref.current?.scrollToOffset({ offset, animated }),
  );
  return (
    <View style={[{ flex: 1 }, style]}>
      <FlatList
        {...props}
        ref={ref}
        renderScrollComponent={
          fixedHeader
            ? (scrollProps) => (
                <ContentScrollView
                  {...scrollProps}
                  fixedHeader={fixedHeader}
                  safeAreaEdges={['top']}
                  animateTabContent={dockAware}
                />
              )
            : props.renderScrollComponent
        }
        contentInsetAdjustmentBehavior={
          props.contentInsetAdjustmentBehavior ?? 'never'
        }
        automaticallyAdjustContentInsets={
          props.automaticallyAdjustContentInsets ?? false
        }
        ListFooterComponent={
          <SafeAreaView edges={dockAware ? [] : ['bottom']}>
            {ListFooterComponent && !isValidElement(ListFooterComponent)
              ? createElement(ListFooterComponent as ComponentType)
              : ListFooterComponent}
          </SafeAreaView>
        }
        style={{ flex: 1 }}
        contentContainerStyle={[
          contentContainerStyle,
          { paddingBottom: spacing.xxxl + spacing.lg + bottomOverlay },
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
        bottomOverlay={bottomOverlay}
        safeAreaBottom={!dockAware}
        disabled={props.scrollEnabled === false}
      />
    </View>
  );
}
