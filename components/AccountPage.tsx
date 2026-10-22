import { useLocalization } from './LocalizationProvider';
import { StyleSheet, Text } from 'react-native';
import { AppScrollView } from './AppScrollView';
import { BrandHeader } from './BrandHeader';
import { AppButton } from './AppButton';
import { AccountSection, type AccountSectionProps } from './AccountSection';
import { colors, spacing, typography } from '@/lib/theme';
import { useState } from 'react';
import { HistoryConflictReview } from './HistoryConflictReview';

export function AccountPage({
  account,
  onClose,
}: {
  account: AccountSectionProps;
  onClose: () => void;
}) {
  const owner =
    account.snapshot.status === 'signed_in' &&
    account.snapshot.busy !== 'sign_out'
      ? (account.snapshot.identity?.id ?? null)
      : null;
  return (
    <AccountPageContent
      key={owner ?? 'signed-out'}
      account={account}
      onClose={onClose}
      owner={owner}
    />
  );
}
function AccountPageContent({
  account,
  onClose,
  owner,
}: {
  account: AccountSectionProps;
  onClose: () => void;
  owner: string | null;
}) {
  const { t } = useLocalization();
  const [reviewOwner, setReviewOwner] = useState<string | null>(null);
  const reviewing = !!owner && reviewOwner === owner && !!account.sync?.review;
  return (
    <AppScrollView contentContainerStyle={s.content}>
      <BrandHeader />
      <AppButton
        title={reviewing ? t('account.back') : t('profile.back')}
        secondary
        presentation="text"
        onPress={reviewing ? () => setReviewOwner(null) : onClose}
      />
      <Text style={s.title} accessibilityRole="header">
        {account.sync ? t('account.syncTitle') : t('account.title')}
      </Text>
      {reviewing && account.sync?.review ? (
        <HistoryConflictReview
          key={owner}
          actions={account.sync.review}
          onClose={() => setReviewOwner(null)}
          onSignOut={account.signOut}
        />
      ) : (
        <AccountSection
          {...account}
          sync={
            account.sync
              ? {
                  ...account.sync,
                  onReview: () => setReviewOwner(owner),
                }
              : undefined
          }
        />
      )}
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
