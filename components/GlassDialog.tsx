import { LocalizedModal as Modal } from '@/components/LayoutDirection';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassMaterial } from './GlassMaterial';
import { cardShadow, radius, spacing } from '@/lib/theme';
import { useReducedTransparency } from './useReducedTransparency';
import { useAppColors } from './AppThemeProvider';

export function GlassDialog({
  children,
  onClose,
  visible = true,
  opaque = false,
  transparency = 26.5,
  avoidKeyboard = false,
}: {
  children: ReactNode;
  onClose: () => void;
  visible?: boolean;
  opaque?: boolean;
  transparency?: number;
  avoidKeyboard?: boolean;
}) {
  const reduceTransparency = useReducedTransparency(visible && !opaque);
  const { dialogScrim } = useAppColors();
  const Overlay = avoidKeyboard ? KeyboardAvoidingView : View;
  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView style={[s.safeArea, { backgroundColor: dialogScrim }]}>
        <Overlay
          style={s.overlay}
          {...(avoidKeyboard
            ? {
                behavior:
                  Platform.OS === 'ios'
                    ? ('padding' as const)
                    : ('height' as const),
              }
            : {})}
        >
          <Pressable
            accessible={false}
            style={StyleSheet.absoluteFill}
            onPress={onClose}
          />
          <View style={s.panel} accessibilityViewIsModal>
            <GlassMaterial
              borderRadius={radius.xxl}
              transparency={transparency}
              solid={opaque || (Platform.OS === 'ios' && reduceTransparency)}
            />
            {children}
          </View>
        </Overlay>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
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
