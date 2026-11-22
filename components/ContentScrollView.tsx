import { forwardRef, useState, type ComponentRef, type ReactNode } from 'react';
import { ScrollView, StyleSheet, type ScrollViewProps } from 'react-native';
import {
  GestureDetector,
  useNativeGesture,
} from 'react-native-gesture-handler';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { BackSwipeBoundary, useBackSwipeGesture } from './BackSwipe';
import { BrandHeaderBackdrop, HeaderBackdropProvided } from './BrandHeader';

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
  const back = useBackSwipeGesture();
  const horizontalScroll = horizontal && back;
  const nativeScroll = useNativeGesture({
    enabled: !!horizontalScroll,
    block: horizontalScroll || undefined,
    disallowInterruption: true,
  });
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
  const scrollView = (
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
  const scroll = horizontalScroll ? (
    <GestureDetector gesture={nativeScroll}>{scrollView}</GestureDetector>
  ) : (
    scrollView
  );
  return fixedHeader ? (
    <BackSwipeBoundary style={s.layer}>
      {scroll}
      <SafeAreaView
        edges={requestedEdges?.filter((edge) => edge === 'top') ?? []}
        pointerEvents="box-none"
        style={s.overlay}
        testID="fixed-header-overlay"
        onLayout={({ nativeEvent }) =>
          setHeaderHeight(nativeEvent.layout.height)
        }
      >
        <BrandHeaderBackdrop />
        <HeaderBackdropProvided.Provider value>
          {fixedHeader}
        </HeaderBackdropProvided.Provider>
      </SafeAreaView>
    </BackSwipeBoundary>
  ) : (
    scroll
  );
});

const s = StyleSheet.create({
  layer: { flex: 1 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0 },
});
