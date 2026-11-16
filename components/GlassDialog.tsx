import { useEffect, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import { cardShadow, colors, radius, spacing } from '@/lib/theme';

export function GlassDialog({
  children,
  onClose,
  visible = true,
}: {
  children: ReactNode;
  onClose: () => void;
  visible?: boolean;
}) {
  const [reduceTransparency, setReduceTransparency] = useState(true);
  useEffect(() => {
    if (!visible || Platform.OS !== 'ios') return;
    let active = true;
    void AccessibilityInfo.isReduceTransparencyEnabled()
      .then((reduced) => {
        if (active) setReduceTransparency(reduced);
      })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setReduceTransparency,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, [visible]);

  const translucent = Platform.OS === 'ios' && !reduceTransparency;
  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView style={s.safeArea}>
        <View style={s.overlay}>
          <Pressable
            accessible={false}
            style={StyleSheet.absoluteFill}
            onPress={onClose}
          />
          <View style={s.panel} accessibilityViewIsModal>
            {translucent ? (
              <>
                {isGlassEffectAPIAvailable() && isLiquidGlassAvailable() ? (
                  <GlassView
                    pointerEvents="none"
                    glassEffectStyle="regular"
                    colorScheme="light"
                    style={s.material}
                  />
                ) : (
                  <BlurView
                    pointerEvents="none"
                    intensity={85}
                    tint="light"
                    style={s.material}
                  />
                )}
                <View pointerEvents="none" style={[s.material, s.glassVeil]} />
              </>
            ) : (
              <View pointerEvents="none" style={[s.material, s.solid]} />
            )}
            {children}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.14)',
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  panel: {
    ...cardShadow,
    width: '100%',
    maxWidth: 380,
    maxHeight: '100%',
    borderRadius: radius.xxl,
    padding: spacing.md,
    gap: spacing.sm,
  },
  material: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.xxl,
    overflow: 'hidden',
  },
  glassVeil: {
    backgroundColor: 'rgba(255, 255, 255, 0.62)',
    borderColor: 'rgba(255, 255, 255, 0.84)',
    borderWidth: StyleSheet.hairlineWidth,
  },
  solid: { backgroundColor: colors.surface },
});
