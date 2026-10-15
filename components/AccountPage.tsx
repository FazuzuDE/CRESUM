import { StyleSheet, Text } from 'react-native';
import { AppScrollView } from './AppScrollView';
import { BrandHeader } from './BrandHeader';
import { AppButton } from './AppButton';
import { AccountSection, type AccountSectionProps } from './AccountSection';
import { colors, spacing, typography } from '@/lib/theme';

export function AccountPage({
  account,
  onClose,
}: {
  account: AccountSectionProps;
  onClose: () => void;
}) {
  return (
    <AppScrollView contentContainerStyle={s.content}>
      <BrandHeader />
      <AppButton
        title="Back to Profile"
        secondary
        presentation="text"
        onPress={onClose}
      />
      <Text style={s.title} accessibilityRole="header">
        Account
      </Text>
      <AccountSection {...account} />
    </AppScrollView>
  );
}
const s = StyleSheet.create({
  title: { ...typography.largeTitle, color: colors.textPrimary },
  content: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    padding: spacing.md,
    gap: spacing.lg,
  },
});
