import { forwardRef, useState, type ComponentRef } from 'react';
import { ScrollView, type ScrollViewProps } from 'react-native';

export const ContentScrollView = forwardRef<
  ComponentRef<typeof ScrollView>,
  ScrollViewProps
>(function ContentScrollView(
  {
    bounces = false,
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
  return (
    <ScrollView
      {...props}
      ref={ref}
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
    />
  );
});
