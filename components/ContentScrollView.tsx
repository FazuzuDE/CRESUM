import { forwardRef, useState, type ComponentRef } from 'react';
import { ScrollView, StyleSheet, type ScrollViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

export type SafeAreaScrollProps = {
  safeAreaEdges?: readonly Edge[];
};

export const ContentScrollView = forwardRef<
  ComponentRef<typeof ScrollView>,
  ScrollViewProps & SafeAreaScrollProps
>(function ContentScrollView(
  {
    bounces = false,
    children,
    contentContainerStyle,
    safeAreaEdges,
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
  const insetContent = !!safeAreaEdges?.length;
  const flexGrow = insetContent
    ? StyleSheet.flatten(contentContainerStyle)?.flexGrow
    : undefined;
  return (
    <ScrollView
      {...props}
      ref={ref}
      contentInsetAdjustmentBehavior={
        contentInsetAdjustmentBehavior ?? (insetContent ? 'never' : undefined)
      }
      automaticallyAdjustContentInsets={
        automaticallyAdjustContentInsets ?? (insetContent ? false : undefined)
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
});
