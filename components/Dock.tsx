import { BlurView } from 'expo-blur';
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  I18nManager,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useAnimatedValue,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cardShadow, colors, radius, spacing, typography } from '@/lib/theme';
import { useLocalization } from './LocalizationProvider';
import { useReducedTransparency } from './useReducedTransparency';

const tabs = [
  ['home', 'nav.home', 'home-outline'],
  ['workout', 'nav.workout', 'barbell-outline'],
  ['progress', 'nav.progress', 'stats-chart-outline'],
  ['profile', 'nav.profile', 'person-outline'],
] as const;

export const DEFAULT_DOCK_TRANSPARENCY = 66;

export function Dock({
  active,
  onChange,
  onHeightChange,
  transparency = DEFAULT_DOCK_TRANSPARENCY,
}: {
  active: string;
  onChange: (tab: string) => void;
  transparency?: number;
  onHeightChange?: (height: number) => void;
}) {
  const { t } = useLocalization();
  const reduced = useReducedTransparency();
  const translucent = Platform.OS === 'ios' && !reduced;
  const nativeGlass =
    translucent && isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
  const selectedIndex = tabs.findIndex(([id]) => id === active);
  const position = useAnimatedValue(Math.max(0, selectedIndex));
  const [tabWidth, setTabWidth] = useState(0);
  const translateX = useMemo(
    () => Animated.multiply(position, tabWidth * (I18nManager.isRTL ? -1 : 1)),
    [position, tabWidth],
  );
  const [reduceMotion, setReduceMotion] = useState(true);
  useEffect(() => {
    let receivedChange = false;
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (value) => {
        receivedChange = true;
        setReduceMotion(value);
      },
    );
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (!receivedChange) setReduceMotion(value);
      })
      .catch(() => {});
    return () => {
      receivedChange = true;
      subscription.remove();
    };
  }, []);
  useEffect(() => {
    if (selectedIndex < 0) return;
    if (reduceMotion || !tabWidth) {
      position.setValue(selectedIndex);
      return;
    }
    const animation = Animated.spring(position, {
      toValue: selectedIndex,
      stiffness: 285,
      damping: 30,
      mass: 1,
      overshootClamping: true,
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
  }, [position, reduceMotion, selectedIndex, tabWidth]);

  const clarity = transparency / 100;
  const tintOpacity = reduced ? 1 : 1 - clarity * (translucent ? 1 : 0.92);
  return (
    <SafeAreaView
      edges={['bottom']}
      pointerEvents="box-none"
      style={s.overlay}
      onLayout={({ nativeEvent }) =>
        onHeightChange?.(nativeEvent.layout.height)
      }
    >
      <View style={s.shadow}>
        <View style={s.dock} accessibilityRole="tablist">
          {nativeGlass ? (
            <GlassView
              pointerEvents="none"
              glassEffectStyle="clear"
              colorScheme="light"
              style={s.material}
            />
          ) : translucent ? (
            <BlurView
              pointerEvents="none"
              intensity={Math.round(84 - clarity * 48)}
              tint="light"
              style={s.material}
            />
          ) : null}
          <View
            pointerEvents="none"
            style={[s.material, s.solid, { opacity: tintOpacity }]}
          />
          <View pointerEvents="none" style={[s.material, s.edge]} />
          <View
            style={s.row}
            onLayout={({ nativeEvent }) =>
              setTabWidth(nativeEvent.layout.width / tabs.length)
            }
          >
            {tabWidth > 0 && selectedIndex >= 0 ? (
              <Animated.View
                pointerEvents="none"
                style={[
                  s.selectedItem,
                  {
                    width: tabWidth,
                    opacity: reduced ? 1 : 1 - clarity * 0.72,
                    transform: [{ translateX }],
                  },
                ]}
              />
            ) : null}
            {tabs.map(([id, label, icon]) => {
              const selected = active === id;
              return (
                <Pressable
                  key={id}
                  accessibilityRole="tab"
                  accessibilityLabel={t(label)}
                  accessibilityState={{ selected }}
                  onPress={() => onChange(id)}
                  style={({ pressed }) => [s.item, pressed && s.pressed]}
                >
                  <Ionicons
                    name={icon}
                    size={23}
                    color={selected ? colors.primary : colors.textPrimary}
                    accessible={false}
                  />
                  <Text style={[s.label, selected && s.selected]}>
                    {t(label)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    alignItems: 'center',
  },
  shadow: {
    width: '100%',
    maxWidth: 600,
    borderRadius: radius.pill,
    ...cardShadow,
  },
  dock: {
    borderRadius: radius.pill,
    overflow: 'hidden',
    padding: spacing.xxs,
  },
  material: { ...StyleSheet.absoluteFill, borderRadius: radius.pill },
  edge: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
  },
  row: { flexDirection: 'row' },
  solid: { backgroundColor: colors.surface },
  item: {
    flex: 1,
    minHeight: 54,
    minWidth: 0,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xxs,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
  },
  selectedItem: {
    position: 'absolute',
    start: 0,
    top: 0,
    bottom: 0,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryTint,
  },
  pressed: { opacity: 0.64 },
  label: {
    ...typography.caption,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  selected: { color: colors.primary },
});
