import { useLocalization } from './LocalizationProvider';
import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { presentAppError } from '@/lib/i18n/errors';
import { colors, radius, spacing, typography } from '@/lib/theme';
import type { AccountSectionProps } from './AccountSection';
import { AppButton } from './AppButton';

export function AccountDeletionSection({
  snapshot,
  deleteAccount,
  busy,
  setBusy,
}: Pick<AccountSectionProps, 'snapshot' | 'deleteAccount'> & {
  busy: boolean;
  setBusy(value: boolean): void;
}) {
  const { t } = useLocalization();
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState('');
  const [failure, setFailure] = useState<{ problem: unknown }>();
  const inFlight = useRef(false);
  const current = snapshot.identity;
  const recovery =
    snapshot.deletion && (!current || snapshot.deletion.userId === current.id)
      ? snapshot.deletion
      : undefined;
  async function submit(cleanup = false) {
    const userId = cleanup ? recovery?.userId : current?.id;
    if (
      !userId ||
      !deleteAccount ||
      busy ||
      inFlight.current ||
      (!cleanup && typed !== 'DELETE')
    )
      return;
    inFlight.current = true;
    setBusy(true);
    setFailure(undefined);
    try {
      await deleteAccount(userId);
      setConfirming(false);
      setTyped('');
    } catch (error) {
      setFailure({ problem: error });
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  if (!current && !recovery) return null;
  return (
    <View style={s.root}>
      {recovery?.status === 'confirmed' ? (
        <>
          <Text style={s.copy}>{t('deletion.confirmed')}</Text>
          <AppButton
            title={busy ? t('deletion.cleaning') : t('deletion.retryCleanup')}
            disabled={!deleteAccount || busy}
            onPress={() => void submit(true)}
          />
        </>
      ) : (
        <>
          {recovery ? (
            <Text style={s.copy}>{t('deletion.pending')}</Text>
          ) : null}
          {current && confirming ? (
            <>
              <Text style={s.heading}>
                {t('deletion.question', {
                  account: current.email ?? t('deletion.thisAccount'),
                })}
              </Text>
              <Text style={s.copy}>{t('deletion.warning')}</Text>
              <Text style={s.copy}>{t('deletion.exclusions')}</Text>
              <TextInput
                style={s.input}
                accessibilityLabel={t('deletion.typeLabel')}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder={t('deletion.type')}
                placeholderTextColor={colors.textSecondary}
                editable={!busy}
                value={typed}
                onChangeText={setTyped}
              />
              <AppButton
                title={busy ? t('deletion.deleting') : t('deletion.permanent')}
                destructive
                disabled={!deleteAccount || busy || typed !== 'DELETE'}
                onPress={() => void submit()}
              />
              <AppButton
                title={t('deletion.keep')}
                secondary
                disabled={busy}
                onPress={() => {
                  setConfirming(false);
                  setTyped('');
                  setFailure(undefined);
                }}
              />
            </>
          ) : current ? (
            <>
              <AppButton
                title={recovery ? t('deletion.retry') : t('deletion.delete')}
                destructive
                secondary
                presentation="text"
                disabled={!deleteAccount || busy}
                onPress={() => {
                  setConfirming(true);
                  setTyped('');
                  setFailure(undefined);
                }}
              />
              {!deleteAccount ? (
                <Text style={s.copy}>{t('deletion.disabled')}</Text>
              ) : null}
            </>
          ) : null}
        </>
      )}
      {failure && !snapshot.error ? (
        <Text style={s.error} accessibilityRole="alert">
          {presentAppError(t, failure.problem, 'error.deletionPending')}
        </Text>
      ) : null}
    </View>
  );
}
const s = StyleSheet.create({
  root: { gap: spacing.sm },
  heading: { ...typography.headline, color: colors.textPrimary },
  copy: { ...typography.footnote, color: colors.textSecondary },
  error: { ...typography.footnote, color: colors.danger },
  input: {
    minHeight: 48,
    ...typography.body,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    color: colors.textPrimary,
  },
});
