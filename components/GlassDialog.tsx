import type { ReactNode } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassMaterial } from './GlassMaterial';
import { cardShadow, radius, spacing } from '@/lib/theme';
import { useReducedTransparency } from './useReducedTransparency';

export function GlassDialog({
  children,
  onClose,
  visible = true,
  opaque = false,
}: {
  children: ReactNode;
  onClose: () => void;
  visible?: boolean;
  opaque?: boolean;
}) {
  const reduceTransparency = useReducedTransparency(visible && !opaque);
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
            <GlassMaterial
              borderRadius={radius.xxl}
              transparency={26.5}
              solid={opaque || (Platform.OS === 'ios' && reduceTransparency)}
            />
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
});
