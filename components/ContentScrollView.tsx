import { forwardRef, useState, type ComponentRef, type ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

export type SafeAreaScrollProps = {
  safeAreaEdges?: readonly Edge[];
  fixedHeader?: ReactNode;
};

export const ContentScrollView = forwardRef<
  ComponentRef<typeof ScrollView>,
  ScrollViewProps & SafeAreaScrollProps
>(function ContentScrollView(
  {
    bounces = false,
    children,
    contentContainerStyle,
    safeAreaEdges: requestedEdges,
    fixedHeader,
    contentInsetAdjustmentBehavior,
    automaticallyAdjustContentInsets,
    horizontal,
    scrollEnabled,
    onContentSizeChange,
    onLayout,
    ...props
  },
  ref,
) {
  const [viewport, setViewport] = useState<number>();
  const [headerHeight, setHeaderHeight] = useState(0);
  const [content, setContent] = useState<number>();
  const fits =
    viewport !== undefined && content !== undefined && content <= viewport + 1;
  const safeAreaEdges = fixedHeader
    ? requestedEdges?.filter((edge) => edge !== 'top')
    : requestedEdges;
  const insetContent = !!safeAreaEdges?.length;
  const wrapsContent = insetContent || Boolean(fixedHeader);
  const flexGrow = wrapsContent
    ? StyleSheet.flatten(contentContainerStyle)?.flexGrow
    : undefined;
  const scroll = (
    <ScrollView
      {...props}
      ref={ref}
      contentInsetAdjustmentBehavior={
        contentInsetAdjustmentBehavior ??
        (insetContent || fixedHeader ? 'never' : undefined)
      }
      automaticallyAdjustContentInsets={
        automaticallyAdjustContentInsets ??
        (insetContent || fixedHeader ? false : undefined)
      }
      contentContainerStyle={
        wrapsContent
          ? { flexGrow, paddingTop: headerHeight }
          : contentContainerStyle
      }
      bounces={bounces}
      horizontal={horizontal}
      scrollEnabled={scrollEnabled !== false && !fits}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setViewport(horizontal ? width : height);
        onLayout?.(event);
      }}
      onContentSizeChange={(width, height) => {
        setContent(horizontal ? width : height);
        onContentSizeChange?.(width, height);
      }}
    >
      {wrapsContent ? (
        <SafeAreaView edges={safeAreaEdges ?? []} style={contentContainerStyle}>
          {children}
        </SafeAreaView>
      ) : (
        children
      )}
    </ScrollView>
  );
  return fixedHeader ? (
    <SafeAreaView
      edges={requestedEdges?.filter((edge) => edge === 'top') ?? []}
      style={s.fixedPage}
    >
      <View style={s.layer}>
        {scroll}
        <View
          pointerEvents="box-none"
          style={s.overlay}
          onLayout={({ nativeEvent }) =>
            setHeaderHeight(nativeEvent.layout.height)
          }
        >
          {fixedHeader}
        </View>
      </View>
    </SafeAreaView>
  ) : (
    scroll
  );
});

const s = StyleSheet.create({
  fixedPage: { flex: 1 },
  layer: { flex: 1 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0 },
});
