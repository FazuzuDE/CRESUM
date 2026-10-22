import { useLocalization } from './LocalizationProvider';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrandHeader } from './BrandHeader';
import { AppScrollView } from './AppScrollView';
import { GlassCard } from './GlassCard';
import { AppButton } from './AppButton';
import { BackupControls, type BackupControlsProps } from './BackupControls';
import { pickBackupFile } from '@/lib/backup-files';
import { parseLocalBackup, type PreparedBackup } from '@/lib/local-backup';
import { previewHistoryImport } from '@/lib/history-import';
import type { WorkoutSession } from '@/lib/workout-model';
import { emptyWorkoutState } from '@/lib/workout-repository';
import type { BackupPolicy } from '@/lib/backup-policy';
import { colors, radius, spacing, typography } from '@/lib/theme';
import { presentAppError } from '@/lib/i18n/errors';
import { formatDate, formatNumber } from '@/lib/i18n/format';
export type BackupPageOptions = {
  policy: BackupPolicy;
  lastCopy?: { createdAt: number; workouts: number; routines: number };
  settingsLoaded: boolean;
  settingsBusy: boolean;
  settingsError: string;
  automaticSupported: boolean;
  onPolicy: (policy: BackupPolicy) => Promise<void>;
  onRetrySettings: () => Promise<void>;
  onImport: (backup: PreparedBackup) => void;
  onUseSaved: () => void;
};
export function BackupPage({
  backup,
  history,
  onClose,
}: {
  backup: BackupControlsProps & Partial<BackupPageOptions>;
  history: readonly WorkoutSession[];
  onClose: () => void;
}) {
  const { t, locale } = useLocalization();
  const [fullRestore, setFullRestore] = useState(false),
    [importing, setImporting] = useState(false),
    [checking, setChecking] = useState(false),
    [error, setError] = useState<{ problem: unknown }>();
  const [file, setFile] = useState<PreparedBackup>();
  const [filename, setFilename] = useState('');
  const pickBusy = useRef(false);
  const busy = backup.disabled || checking || !!backup.settingsBusy;
  const choose = async () => {
    if (busy || pickBusy.current || backup.hasActiveWorkout) return;
    pickBusy.current = true;
    setChecking(true);
    setError(undefined);
    try {
      let selectedName = '';
      const text = await pickBackupFile((name) => {
        selectedName = name;
      });
      if (text !== null) {
        setFile(await parseLocalBackup(text));
        setFilename(selectedName);
        setImporting(true);
      }
    } catch (problem) {
      setError({ problem });
    } finally {
      setChecking(false);
      pickBusy.current = false;
    }
  };
  const preview = file
    ? previewHistoryImport(
        { ...emptyWorkoutState(), history: [...history] },
        file,
      )
    : undefined;
  if (fullRestore)
    return (
      <AppScrollView contentContainerStyle={s.content}>
        <BrandHeader />
        <AppButton
          title={t('backup.back')}
          secondary
          presentation="text"
          onPress={() => setFullRestore(false)}
        />
        <BackupControls {...backup} />
      </AppScrollView>
    );
  if (importing && file && preview)
    return (
      <AppScrollView contentContainerStyle={s.content}>
        <BrandHeader />
        <AppButton
          title={t('backup.back')}
          secondary
          presentation="text"
          disabled={checking}
          onPress={() => {
            setImporting(false);
            setFile(undefined);
          }}
        />
        <Text style={s.title} accessibilityRole="header">
          {t('backup.import')}
        </Text>
        <GlassCard>
          <Text style={s.heading}>{filename || t('backup.filename')}</Text>
          <Text style={s.copy}>
            {formatDate(locale, file.summary.createdAt, {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </Text>
          <Text style={s.success}>{t('backup.checked')}</Text>
        </GlassCard>
        <GlassCard style={s.card}>
          {[
            [t('backup.total'), preview.total],
            [t('backup.new'), preview.added],
            [t('backup.existing'), preview.existing],
          ].map(([name, value]) => (
            <View key={name} style={s.row}>
              <Text style={s.body}>{name}</Text>
              <Text style={s.heading}>
                {typeof value === 'number'
                  ? formatNumber(locale, value)
                  : value}
              </Text>
            </View>
          ))}
        </GlassCard>
        <GlassCard style={s.info}>
          <Text style={s.heading}>{t('backup.historyStays')}</Text>
          <Text style={s.copy}>{t('backup.importHint')}</Text>
        </GlassCard>
        <AppButton
          title={t('backup.importCount', { count: preview.added })}
          disabled={busy || preview.added === 0 || backup.hasActiveWorkout}
          onPress={() => {
            if (!busy && !backup.hasActiveWorkout) {
              const selected = file;
              setFile(undefined);
              setImporting(false);
              backup.onImport?.(selected);
            }
          }}
        />
        <AppButton
          title={
            checking ? t('backup.checkingFile') : t('backup.chooseAnother')
          }
          secondary
          presentation="text"
          disabled={busy}
          onPress={() => void choose()}
        />
        {error ? (
          <Text accessibilityRole="alert" style={s.copy}>
            {presentAppError(t, error.problem, 'error.backupOpen')}
          </Text>
        ) : null}
      </AppScrollView>
    );
  return (
    <AppScrollView contentContainerStyle={s.content}>
      <BrandHeader />
      <AppButton
        title={t('profile.back')}
        secondary
        presentation="text"
        disabled={busy}
        onPress={onClose}
      />
      <Text style={s.title} accessibilityRole="header">
        {t('backup.title')}
      </Text>
      <GlassCard style={s.card}>
        <View style={s.row}>
          <Ionicons
            name="archive-outline"
            size={28}
            color={colors.textSecondary}
          />
          <View style={s.flex}>
            <Text style={s.copy}>{t('backup.last')}</Text>
            <Text style={s.heading}>
              {backup.lastCopy
                ? formatDate(locale, backup.lastCopy.createdAt, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })
                : t('backup.noCopy')}
            </Text>
            {backup.lastCopy ? (
              <Text style={s.copy}>
                {t('backup.copyCounts', {
                  workouts: formatNumber(locale, backup.lastCopy.workouts),
                  routines: formatNumber(locale, backup.lastCopy.routines),
                })}
              </Text>
            ) : null}
          </View>
        </View>
        <AppButton
          title={t('backup.export')}
          disabled={busy}
          onPress={backup.onExport}
        />
        <AppButton
          title={checking ? t('backup.checkingFile') : t('backup.import')}
          secondary
          disabled={busy || backup.hasActiveWorkout}
          onPress={() => void choose()}
        />
        {backup.lastCopy ? (
          <AppButton
            title={t('backup.exportSaved')}
            secondary
            presentation="text"
            disabled={busy || backup.hasActiveWorkout}
            onPress={backup.onUseSaved ?? (() => {})}
          />
        ) : null}
      </GlassCard>
      <Text style={s.heading} accessibilityRole="header">
        {t('backup.automaticTitle')}
      </Text>
      <GlassCard style={s.card}>
        <View style={s.row}>
          <Text style={[s.body, s.flex]}>{t('backup.automatic')}</Text>
          <Switch
            accessibilityLabel={t('backup.automatic')}
            value={!!backup.policy?.enabled}
            disabled={
              busy || !backup.settingsLoaded || !backup.automaticSupported
            }
            onValueChange={(enabled) => {
              if (backup.policy)
                void backup.onPolicy?.({ ...backup.policy, enabled });
            }}
            trackColor={{ true: colors.primary }}
          />
        </View>
        <Text style={s.heading}>{t('backup.frequency')}</Text>
        {(
          [
            ['workout', t('backup.everyWorkout')],
            ['weekly', t('backup.weekly')],
            ['monthly', t('backup.monthly')],
          ] as const
        ).map(([frequency, label]) => (
          <Pressable
            key={frequency}
            accessibilityRole="radio"
            accessibilityLabel={t('backup.frequencyLabel', {
              frequency: label,
            })}
            accessibilityState={{
              checked: backup.policy?.frequency === frequency,
              disabled:
                busy || !backup.settingsLoaded || !backup.automaticSupported,
            }}
            disabled={
              busy || !backup.settingsLoaded || !backup.automaticSupported
            }
            onPress={() => {
              if (backup.policy)
                void backup.onPolicy?.({ ...backup.policy, frequency });
            }}
            style={s.frequency}
          >
            <Ionicons
              name={
                backup.policy?.frequency === frequency
                  ? 'radio-button-on'
                  : 'radio-button-off'
              }
              size={24}
              color={
                backup.policy?.frequency === frequency
                  ? colors.primary
                  : colors.textSecondary
              }
            />
            <Text style={s.body}>{label}</Text>
          </Pressable>
        ))}
      </GlassCard>
      <Text style={s.copy}>
        {backup.automaticSupported
          ? t('backup.automaticHint')
          : t('backup.nativeOnly')}
      </Text>
      {backup.settingsError ? (
        <>
          <Text accessibilityRole="alert" style={s.copy}>
            {t('error.backupSettings')}
          </Text>
          <AppButton
            title={t('backup.retrySettings')}
            secondary
            onPress={() => void backup.onRetrySettings?.()}
          />
        </>
      ) : null}
      <GlassCard>
        <AppButton
          title={t('backup.restoreAll')}
          secondary
          presentation="row"
          disabled={busy}
          onPress={() => setFullRestore(true)}
        />
        <Text style={s.copy}>{t('backup.fullHint')}</Text>
      </GlassCard>
      <Text style={s.copy}>{t('backup.privacy')}</Text>
      {backup.hasActiveWorkout ? (
        <Text style={s.copy}>{t('backup.activeImport')}</Text>
      ) : null}
      {error ? (
        <Text accessibilityRole="alert" style={s.copy}>
          {presentAppError(t, error.problem, 'error.backupOpen')}
        </Text>
      ) : null}
    </AppScrollView>
  );
}
const s = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    padding: spacing.md,
    gap: spacing.lg,
  },
  title: { ...typography.largeTitle, color: colors.textPrimary },
  heading: { ...typography.headline, color: colors.textPrimary },
  body: { ...typography.body, color: colors.textPrimary },
  copy: { ...typography.footnote, color: colors.textSecondary },
  success: { ...typography.footnote, color: colors.success },
  card: { gap: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  flex: { flex: 1 },
  frequency: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    paddingVertical: spacing.xs,
  },
  info: {
    backgroundColor: colors.primaryTint,
    borderRadius: radius.xl,
    gap: spacing.xs,
  },
});
