import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  progressScrollTarget,
  type ProgressSectionPosition,
} from '@/lib/progress-scroll';
import { colors, radius, spacing, cardShadow } from '@/lib/theme';

export function ProgressScrollView({
  sections,
  contentContainerStyle,
}: {
  sections: { id: string; label: string; content: ReactNode }[];
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  const reduceMotion = useRef(true);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) reduceMotion.current = value;
      })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (value) => {
        reduceMotion.current = value;
      },
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  const scroll = useRef<ScrollView>(null);
  const positions = useRef<Record<string, ProgressSectionPosition>>({});
  const y = useRef(0);
  const armed = useRef(false);
  const [scrolled, setScrolled] = useState(false);
  const [toTop, setToTop] = useState(false);
  const reset = () => {
    armed.current = false;
    setToTop(false);
  };
  return (
    <View style={s.page}>
      <ScrollView
        ref={scroll}
        contentContainerStyle={[
          contentContainerStyle,
          { paddingBottom: spacing.xxxl + spacing.lg },
        ]}
        scrollEventThrottle={16}
        onScrollBeginDrag={reset}
        onScroll={({ nativeEvent }) => {
          y.current = Math.max(0, nativeEvent.contentOffset.y);
          setScrolled(y.current > spacing.xxl);
        }}
      >
        {sections.map((section) => (
          <View
            key={section.id}
            onLayout={({ nativeEvent }) => {
              positions.current[section.id] = {
                id: section.id,
                label: section.label,
                y: nativeEvent.layout.y,
              };
              reset();
            }}
          >
            {section.content}
          </View>
        ))}
      </ScrollView>
      {scrolled && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            toTop ? 'Back to page top' : 'Back to section start'
          }
          accessibilityHint="First tap goes to the current section; the next goes to the page top"
          style={({ pressed }) => [s.up, pressed && s.pressed]}
          onPress={() => {
            const target = progressScrollTarget(
              y.current,
              Object.values(positions.current),
              armed.current,
            );
            armed.current = true;
            setToTop(true);
            y.current = target.y;
            scroll.current?.scrollTo({
              y: target.y,
              animated: !reduceMotion.current,
            });
          }}
        >
          <Ionicons
            name="arrow-up"
            size={24}
            color={colors.textPrimary}
            accessible={false}
          />
        </Pressable>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  page: { flex: 1 },
  up: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.sm,
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },
  pressed: { opacity: 0.6 },
});
