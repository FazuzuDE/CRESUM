import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/lib/theme';
import { BrandWordmark } from './BrandWordmark';

export function BrandHeader({ tagline = true }: { tagline?: boolean }) {
  return (
    <View style={s.root}>
      <BrandWordmark />
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
  tagline: {
    ...typography.caption,
    letterSpacing: 1,
    textAlign: 'center',
    color: colors.textSecondary,
  },
});
