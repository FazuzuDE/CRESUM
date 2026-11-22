import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  useContext,
  useImperativeHandle,
  useEffect,
  useRef,
  type ComponentRef,
  type ReactElement,
} from 'react';
import {
  ScrollView,
  View,
  type ScrollViewProps,
  type ViewProps,
} from 'react-native';
import type { ProgressSectionPosition } from '@/lib/progress-scroll';
import { spacing } from '@/lib/theme';
import {
  ContentScrollView,
  type SafeAreaScrollProps,
} from './ContentScrollView';
import { BrandHeader, type BrandBackAction } from './BrandHeader';
import { DockSpace } from './DockSpace';
import { GlassCard } from './GlassCard';
import { useScrollReturn } from './useScrollReturn';
import { ScrollReturnButton } from './ScrollReturnButton';

// Keep the native ref and event callbacks usable by workout drag/edge scrolling.
export const AppScrollView = forwardRef<
  ComponentRef<typeof ScrollView>,
  ScrollViewProps &
    SafeAreaScrollProps & {
      sectionPositions?: ProgressSectionPosition[];
      dockAware?: boolean;
      branded?: boolean;
      back?: BrandBackAction;
    }
>(function AppScrollView(
  {
    children,
    dockAware = false,
    branded = false,
    back,
    fixedHeader,
    safeAreaEdges = dockAware ? ['top'] : ['top', 'bottom'],
    style,
    contentContainerStyle,
    onScroll,
    onScrollBeginDrag,
    sectionPositions,
    ...props
  },
  forwardedRef,
) {
  const dockSpace = useContext(DockSpace);
  const bottomOverlay = dockAware ? dockSpace : 0;
  const ref = useRef<ComponentRef<typeof ScrollView>>(null);
  useImperativeHandle(forwardedRef, () => ref.current!, []);
  const control = useScrollReturn((y, animated) =>
    ref.current?.scrollTo({ y, animated }),
  );
  const items = Children.toArray(children);
  const register = control.register;
  useEffect(() => {
    for (const section of sectionPositions ?? [])
      register(section.id, section.y);
  }, [sectionPositions, register]);
  control.retain([
    ...(sectionPositions ?? []).map((section) => section.id),
    ...items.map((child, i) =>
      isValidElement(child) ? String(child.key ?? i) : String(i),
    ),
  ]);
  return (
    <View style={[{ flex: 1 }, style]}>
      <ContentScrollView
        {...props}
        ref={ref}
        safeAreaEdges={safeAreaEdges}
        fixedHeader={branded ? <BrandHeader back={back} /> : fixedHeader}
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
      >
        {items.map((child, i) => {
          if (
            !isValidElement(child) ||
            (child.type !== View && child.type !== GlassCard)
          )
            return child;
          const element = child as ReactElement<ViewProps>;
          return cloneElement(element, {
            onLayout: (event) => {
              control.register(
                String(child.key ?? i),
                event.nativeEvent.layout.y,
              );
              element.props.onLayout?.(event);
            },
          });
        })}
      </ContentScrollView>
      <ScrollReturnButton
        control={control}
        bottomOverlay={bottomOverlay}
        safeAreaBottom={safeAreaEdges.includes('bottom')}
        disabled={props.scrollEnabled === false}
      />
    </View>
  );
});
