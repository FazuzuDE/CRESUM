import { createThemedStyles } from '@/components/AppThemeProvider';
import { View, ViewStyle, type ViewProps } from 'react-native';
import { cardShadow, radius, spacing } from '@/lib/theme';
export function GlassCard({
  children,
  style,
  onLayout,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  onLayout?: ViewProps['onLayout'];
}) {
  const styles = useStyles();
  return (
    <View onLayout={onLayout} style={[styles.card, style]}>
      {children}
    </View>
  );
}
const useStyles = createThemedStyles((colors) => ({
  card: {
    ...cardShadow,
    borderRadius: radius.xl,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
}));
