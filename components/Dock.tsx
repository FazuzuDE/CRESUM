import { BlurView } from 'expo-blur';
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
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

export function Dock({
  active,
  onChange,
  onHeightChange,
}: {
  active: string;
  onChange: (tab: string) => void;
  onHeightChange?: (height: number) => void;
}) {
  const { t } = useLocalization();
  const reduced = useReducedTransparency();
  const translucent = Platform.OS === 'ios' && !reduced;
  const nativeGlass =
    translucent && isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
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
              glassEffectStyle="regular"
              colorScheme="light"
              style={s.material}
            />
          ) : translucent ? (
            <BlurView
              pointerEvents="none"
              intensity={58}
              tint="light"
              style={s.material}
            />
          ) : null}
          <View
            pointerEvents="none"
            style={[
              s.material,
              s.edge,
              translucent
                ? s.glassTint
                : Platform.OS === 'ios'
                  ? s.solid
                  : s.platformTint,
            ]}
          />
          {tabs.map(([id, label, icon]) => {
            const selected = active === id;
            return (
              <Pressable
                key={id}
                accessibilityRole="tab"
                accessibilityLabel={t(label)}
                accessibilityState={{ selected }}
                onPress={() => onChange(id)}
                style={({ pressed }) => [
                  s.item,
                  selected && s.selectedItem,
                  pressed && s.pressed,
                ]}
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
    flexDirection: 'row',
    borderRadius: radius.pill,
    overflow: 'hidden',
    padding: spacing.xxs,
  },
  material: { ...StyleSheet.absoluteFill, borderRadius: radius.pill },
  edge: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
  },
  glassTint: { backgroundColor: 'rgba(255, 255, 255, 0.34)' },
  platformTint: { backgroundColor: 'rgba(255, 255, 255, 0.88)' },
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
  selectedItem: { backgroundColor: colors.primaryTint },
  pressed: { opacity: 0.64 },
  label: {
    ...typography.caption,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  selected: { color: colors.primary },
});
