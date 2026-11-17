import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, cardShadow } from '@/lib/theme';
import type { ScrollReturn } from './useScrollReturn';
import { useLocalization } from './LocalizationProvider';

export function ScrollReturnButton({
  control,
  disabled = false,
  bottomOverlay = 0,
  safeAreaBottom = false,
}: {
  control: ScrollReturn;
  disabled?: boolean;
  bottomOverlay?: number;
  safeAreaBottom?: boolean;
}) {
  const { t } = useLocalization();
  if (!control.visible || disabled) return null;
  return (
    <SafeAreaView
      pointerEvents="box-none"
      edges={safeAreaBottom ? ['bottom'] : []}
      style={[s.anchor, { bottom: spacing.sm + bottomOverlay }]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          control.toTop ? t('scroll.top') : t('scroll.section')
        }
        accessibilityHint={t('scroll.hint')}
        style={({ pressed }) => [s.up, pressed && s.pressed]}
        onPress={control.jump}
      >
        <Ionicons
          name="arrow-up"
          size={24}
          color={colors.textPrimary}
          accessible={false}
        />
      </Pressable>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  anchor: { position: 'absolute', right: spacing.md },
  up: {
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
