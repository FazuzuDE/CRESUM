import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/lib/theme';

export function BrandHeader({ tagline = true }: { tagline?: boolean }) {
  return (
    <View style={s.root}>
      <Text style={s.wordmark}>CRESUM</Text>
      {tagline ? <Text style={s.tagline}>TRAIN. TRACK. GROW.</Text> : null}
    </View>
  );
}
const s = StyleSheet.create({
  root: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xxs,
  },
  wordmark: {
    ...typography.footnote,
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
    color: colors.textPrimary,
  },
  tagline: {
    ...typography.caption,
    letterSpacing: 1,
    textAlign: 'center',
    color: colors.textSecondary,
  },
});
