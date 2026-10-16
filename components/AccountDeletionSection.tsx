import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { AuthActionError } from '@/lib/auth-store';
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
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState('');
  const [failure, setFailure] = useState('');
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
    setFailure('');
    try {
      await deleteAccount(userId);
      setConfirming(false);
      setTyped('');
    } catch (error) {
      setFailure(
        error instanceof AuthActionError
          ? error.message
          : 'Account deletion is not confirmed. Cloud backup stays paused. Your local workouts are kept.',
      );
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
          <Text style={s.copy}>
            Account deletion was confirmed. Local session cleanup is incomplete.
            Your local workouts are kept.
          </Text>
          <AppButton
            title={busy ? 'Cleaning up…' : 'Retry session cleanup'}
            disabled={!deleteAccount || busy}
            onPress={() => void submit(true)}
          />
        </>
      ) : (
        <>
          {recovery ? (
            <Text style={s.copy}>
              Account deletion is not confirmed. Cloud backup stays paused. Sign
              in to the same account to retry, or keep using your local
              workouts.
            </Text>
          ) : null}
          {current && confirming ? (
            <>
              <Text style={s.heading}>
                Delete {current.email ?? 'this account'}?
              </Text>
              <Text style={s.copy}>
                Your account and cloud workout history will be permanently
                deleted. Your local workouts, routines and saved backup files
                stay on this device.
              </Text>
              <Text style={s.copy}>
                Exported files, other devices’ local copies and provider backups
                are not erased by this action.
              </Text>
              <TextInput
                style={s.input}
                accessibilityLabel="Type DELETE to confirm account deletion"
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder="Type DELETE"
                placeholderTextColor={colors.textSecondary}
                editable={!busy}
                value={typed}
                onChangeText={setTyped}
              />
              <AppButton
                title={
                  busy ? 'Deleting account…' : 'Permanently delete account'
                }
                destructive
                disabled={!deleteAccount || busy || typed !== 'DELETE'}
                onPress={() => void submit()}
              />
              <AppButton
                title="Keep account"
                secondary
                disabled={busy}
                onPress={() => {
                  setConfirming(false);
                  setTyped('');
                  setFailure('');
                }}
              />
            </>
          ) : current ? (
            <>
              <AppButton
                title={recovery ? 'Retry account deletion' : 'Delete account'}
                destructive
                secondary
                presentation="text"
                disabled={!deleteAccount || busy}
                onPress={() => {
                  setConfirming(true);
                  setTyped('');
                  setFailure('');
                }}
              />
              {!deleteAccount ? (
                <Text style={s.copy}>
                  Account deletion is not available yet in this build.
                </Text>
              ) : null}
            </>
          ) : null}
        </>
      )}
      {failure && !snapshot.error ? (
        <Text style={s.error} accessibilityRole="alert">
          {failure}
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
