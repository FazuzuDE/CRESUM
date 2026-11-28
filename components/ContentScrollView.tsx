import {
  forwardRef,
  useContext,
  useState,
  type ComponentRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { ScrollView, StyleSheet, type ScrollViewProps } from 'react-native';
import {
  GestureDetector,
  useNativeGesture,
} from 'react-native-gesture-handler';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { BackSwipeBoundary, useBackSwipeGesture } from './BackSwipe';
import { BrandHeaderBackdrop, HeaderBackdropProvided } from './BrandHeader';

import { TabContentOffset } from './TabContentMotion';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

export type SafeAreaScrollProps = {
  safeAreaEdges?: readonly Edge[];
  fixedHeader?: ReactNode;
};

export const ContentScrollView = forwardRef<
  ComponentRef<typeof ScrollView>,
  ScrollViewProps & SafeAreaScrollProps & { animateTabContent?: boolean }
>(function ContentScrollView(
  {
    bounces = false,
    animateTabContent = false,
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
  const tabOffset = useContext(TabContentOffset);
  const tabStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabOffset?.get() ?? 0 }],
  }));
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
  const canScroll = scrollEnabled !== false && !fits;
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
      scrollEnabled={canScroll}
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
  const scroll = horizontal ? (
    <HorizontalScrollGesture enabled={canScroll}>
      {scrollView}
    </HorizontalScrollGesture>
  ) : (
    scrollView
  );
  return fixedHeader ? (
    <BackSwipeBoundary
      style={animateTabContent && tabOffset ? s.clippedLayer : s.layer}
    >
      {animateTabContent && tabOffset ? (
        <Animated.View testID="tab-content-motion" style={[s.layer, tabStyle]}>
          {scroll}
        </Animated.View>
      ) : (
        scroll
      )}
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

function HorizontalScrollGesture({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactElement;
}) {
  const back = useBackSwipeGesture();
  const nativeScroll = useNativeGesture({
    enabled: enabled && !!back,
    block: enabled ? back : undefined,
    disallowInterruption: true,
  });
  return back ? (
    <GestureDetector gesture={nativeScroll}>{children}</GestureDetector>
  ) : (
    children
  );
}

const s = StyleSheet.create({
  layer: { flex: 1 },
  clippedLayer: { flex: 1, overflow: 'hidden' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0 },
});
