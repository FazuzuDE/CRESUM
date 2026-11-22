import { LocalizedText as Text } from '@/components/LayoutDirection';
import { StyleSheet, View } from 'react-native';
import { colors, spacing, typography } from '@/lib/theme';
import { BrandWordmark } from './BrandWordmark';
import { useLocalization } from './LocalizationProvider';

export function BrandHeader() {
  const { t } = useLocalization();
  return (
    <View testID="brand-header" style={s.root}>
      <BrandWordmark />
      <Text style={s.tagline}>{t('brand.tagline')}</Text>
    </View>
  );
}
const s = StyleSheet.create({
  root: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xxs,
  },
  tagline: {
    ...typography.caption,
    letterSpacing: 1,
    textAlign: 'center',
    color: colors.textSecondary,
  },
});
