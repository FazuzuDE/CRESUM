import { StyleSheet, View, ViewStyle, type ViewProps } from 'react-native';
import { cardShadow, colors, radius, spacing } from '@/lib/theme';
export function GlassCard({
  children,
  style,
  onLayout,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  onLayout?: ViewProps['onLayout'];
}) {
  return (
    <View onLayout={onLayout} style={[styles.card, style]}>
      {children}
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    ...cardShadow,
    borderRadius: radius.xl,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
});
