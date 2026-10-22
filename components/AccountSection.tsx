import { useLocalization } from './LocalizationProvider';
import type { AuthRepository } from '@/lib/auth-repository';
import { HistorySyncPanel, type HistorySyncControls } from './HistorySyncPanel';
import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { AppButton } from './AppButton';
import { GlassCard } from './GlassCard';
import { type AuthSnapshot } from '@/lib/auth-store';
import { presentAppError } from '@/lib/i18n/errors';
import { AppError } from '@/lib/app-error';
import { colors, radius, spacing, typography } from '@/lib/theme';
import { AccountDeletionSection } from './AccountDeletionSection';

export type AccountSectionProps = {
  snapshot: AuthSnapshot;
  historyRpc?: AuthRepository['historyRpc'];
  isCurrentAccount?: (userId: string) => boolean;
  sync?: HistorySyncControls;
  sendEmailOtp(email: string): Promise<void>;
  verifyEmailOtp(email: string, code: string): Promise<void>;
  signOut(): Promise<void>;
  deleteAccount?(
    userId: string,
    prepare?: () => Promise<() => void>,
  ): Promise<void>;
  retryAccount?(): Promise<void>;
};

export function AccountSection({ snapshot, ...actions }: AccountSectionProps) {
  return (
    <AccountSectionContent
      key={snapshot.status === 'signed_in' ? 'signed-in' : 'signed-out'}
      snapshot={snapshot}
      {...actions}
    />
  );
}

function AccountSectionContent({
  snapshot,
  sendEmailOtp,
  verifyEmailOtp,
  signOut,
  sync,
  deleteAccount,
  retryAccount,
}: AccountSectionProps) {
  const { t } = useLocalization();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [phase, setPhase] = useState<'email' | 'code'>('email');
  const [localBusy, setLocalBusy] = useState(false);
  const [message, setMessage] = useState<
    'account.resent' | 'account.sent' | ''
  >('');
  const [localError, setLocalError] = useState<{
    problem: unknown;
    fallback: 'error.authSend' | 'error.authGeneric' | 'error.authSignOut';
  }>();
  const inFlight = useRef(false);
  const busy = localBusy || snapshot.busy !== null;
  const deletionPending =
    snapshot.deletion?.status === 'pending' &&
    snapshot.deletion.userId === snapshot.identity?.id;
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  async function send(resend: boolean) {
    if (!snapshot.configured || !validEmail || busy || inFlight.current) return;
    inFlight.current = true;
    setLocalBusy(true);
    setLocalError(undefined);
    setMessage('');
    try {
      await sendEmailOtp(email.trim());
      setPhase('code');
      setCode('');
      setMessage(resend ? 'account.resent' : 'account.sent');
    } catch (error) {
      setLocalError({ problem: error, fallback: 'error.authSend' });
    } finally {
      inFlight.current = false;
      setLocalBusy(false);
    }
  }
  async function verify() {
    if (code.length !== 6 || busy || inFlight.current) return;
    inFlight.current = true;
    setLocalBusy(true);
    setLocalError(undefined);
    try {
      await verifyEmailOtp(email.trim(), code);
      setCode('');
    } catch (error) {
      setLocalError({ problem: error, fallback: 'error.authGeneric' });
    } finally {
      inFlight.current = false;
      setLocalBusy(false);
    }
  }
  async function disconnect() {
    if (busy || inFlight.current) return;
    inFlight.current = true;
    setLocalBusy(true);
    setLocalError(undefined);
    try {
      await signOut();
      setPhase('email');
      setCode('');
    } catch (error) {
      setLocalError({ problem: error, fallback: 'error.authSignOut' });
    } finally {
      inFlight.current = false;
      setLocalBusy(false);
    }
  }

  return (
    <GlassCard style={s.card}>
      <Text style={s.title} accessibilityRole="header">
        {t('account.cresum')}
      </Text>
      {snapshot.status === 'initializing' ? (
        <Text style={s.copy}>{t('account.checking')}</Text>
      ) : null}
      {snapshot.status === 'signed_in' ? (
        <>
          <Text style={s.copy}>
            {t('account.connected', {
              identity: snapshot.identity?.email ?? t('account.user'),
            })}
          </Text>
          {sync && !deletionPending && snapshot.busy !== 'delete' ? (
            <HistorySyncPanel {...sync} />
          ) : !sync ? (
            <Text style={s.copy}>{t('account.noCloud')}</Text>
          ) : null}
          <AppButton
            title={t('account.signOut')}
            secondary
            disabled={busy}
            onPress={() => void disconnect()}
          />
        </>
      ) : (
        <>
          <Text style={s.copy}>{t('account.optional')}</Text>
          {!snapshot.configured && snapshot.status !== 'initializing' ? (
            <Text style={s.copy}>{t('account.unavailable')}</Text>
          ) : null}
          {snapshot.configured ? (
            <>
              <TextInput
                accessibilityLabel={t('account.email')}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                editable={!busy && phase === 'email'}
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setCode('');
                  setLocalError(undefined);
                }}
                placeholder={t('account.email')}
                placeholderTextColor={colors.textSecondary}
                style={s.input}
              />
              {phase === 'email' ? (
                <AppButton
                  title={t('account.send')}
                  disabled={!validEmail || busy}
                  onPress={() => void send(false)}
                />
              ) : (
                <>
                  <Text style={s.copy}>
                    {t('account.codePrompt', { email: email.trim() })}
                  </Text>
                  <TextInput
                    accessibilityLabel={t('account.codeLabel')}
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                    autoComplete="one-time-code"
                    maxLength={6}
                    editable={!busy}
                    value={code}
                    onChangeText={(value) => {
                      setCode(value.replace(/\D/g, '').slice(0, 6));
                      setLocalError(undefined);
                    }}
                    placeholder={t('account.codePlaceholder')}
                    placeholderTextColor={colors.textSecondary}
                    style={s.input}
                  />
                  <AppButton
                    title={t('account.verify')}
                    disabled={code.length !== 6 || busy}
                    onPress={() => void verify()}
                  />
                  <AppButton
                    title={t('account.resend')}
                    secondary
                    disabled={busy}
                    onPress={() => void send(true)}
                  />
                  <AppButton
                    title={t('account.changeEmail')}
                    secondary
                    disabled={busy}
                    onPress={() => {
                      setPhase('email');
                      setCode('');
                      setMessage('');
                    }}
                  />
                </>
              )}
            </>
          ) : null}
          <Text style={s.copy}>{t('account.later')}</Text>
          <AppButton
            title={t('account.apple')}
            secondary
            disabled
            onPress={() => {}}
          />
          <AppButton
            title={t('account.google')}
            secondary
            disabled
            onPress={() => {}}
          />
        </>
      )}
      <AccountDeletionSection
        key={snapshot.identity?.id ?? 'signed-out'}
        snapshot={snapshot}
        deleteAccount={deleteAccount}
        busy={busy}
        setBusy={setLocalBusy}
      />
      {snapshot.notice ? (
        <Text style={s.copy} accessibilityRole="alert">
          {t('account.deleted')}
        </Text>
      ) : null}
      {snapshot.status === 'error' && retryAccount ? (
        <AppButton
          title={t('account.retry')}
          disabled={busy}
          onPress={() => void retryAccount()}
        />
      ) : null}
      {message ? (
        <Text accessibilityRole="alert" style={s.copy}>
          {t(message)}
        </Text>
      ) : null}
      {localError || snapshot.error ? (
        <Text accessibilityRole="alert" style={s.error}>
          {localError
            ? presentAppError(t, localError.problem, localError.fallback)
            : presentAppError(
                t,
                snapshot.errorCode
                  ? new AppError(snapshot.errorCode, snapshot.error ?? '')
                  : undefined,
                'error.authGeneric',
              )}
        </Text>
      ) : null}
    </GlassCard>
  );
}

const s = StyleSheet.create({
  card: { gap: spacing.sm },
  title: { ...typography.title3, color: colors.textPrimary },
  copy: { ...typography.footnote, color: colors.textSecondary },
  error: { ...typography.footnote, color: colors.danger },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    ...typography.body,
  },
});
