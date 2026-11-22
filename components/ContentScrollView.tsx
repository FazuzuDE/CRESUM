import { forwardRef, useState, type ComponentRef, type ReactNode } from 'react';
import { ScrollView, StyleSheet, type ScrollViewProps } from 'react-native';
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
  const [content, setContent] = useState<number>();
  const fits =
    viewport !== undefined && content !== undefined && content <= viewport + 1;
  const safeAreaEdges = fixedHeader
    ? requestedEdges?.filter((edge) => edge !== 'top')
    : requestedEdges;
  const insetContent = !!safeAreaEdges?.length;
  const flexGrow = insetContent
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
        insetContent ? { flexGrow } : contentContainerStyle
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
      {insetContent ? (
        <SafeAreaView edges={safeAreaEdges} style={contentContainerStyle}>
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
      {fixedHeader}
      {scroll}
    </SafeAreaView>
  ) : (
    scroll
  );
});

const s = StyleSheet.create({ fixedPage: { flex: 1 } });
