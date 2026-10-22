import { useLocalization } from './LocalizationProvider';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { parseLocalBackup, type PreparedBackup } from '@/lib/local-backup';
import { pickBackupFile } from '@/lib/backup-files';
import { colors, spacing, typography } from '@/lib/theme';
import { AppButton } from './AppButton';
import { Confirmation } from './Confirmation';
import { presentAppError } from '@/lib/i18n/errors';
import { formatDate, formatNumber } from '@/lib/i18n/format';
export type BackupControlsProps = {
  disabled: boolean;
  hasActiveWorkout: boolean;
  onExport: () => void;
  onRestore: (backup: PreparedBackup) => void;
};
export function BackupControls({
  disabled,
  hasActiveWorkout,
  onExport,
  onRestore,
}: BackupControlsProps) {
  const { t, locale } = useLocalization();
  const [picking, setPicking] = useState(false),
    [error, setError] = useState<{ problem: unknown }>();
  const [backup, setBackup] = useState<PreparedBackup>();
  const pickingRef = useRef(false);
  const choose = async () => {
    if (pickingRef.current || disabled || hasActiveWorkout) return;
    pickingRef.current = true;
    setPicking(true);
    setError(undefined);
    try {
      const text = await pickBackupFile();
      if (text !== null) setBackup(await parseLocalBackup(text));
    } catch (problem) {
      setError({ problem });
    } finally {
      pickingRef.current = false;
      setPicking(false);
    }
  };
  const summary = backup?.summary;
  return (
    <View style={s.root}>
      <Text style={s.title} accessibilityRole="header">
        {t('backup.title')}
      </Text>
      <Text style={s.text}>{t('backup.description')}</Text>
      <AppButton
        title={t('backup.export')}
        secondary
        disabled={disabled || picking}
        onPress={onExport}
      />
      <Text style={s.text}>{t('backup.destination')}</Text>
      <AppButton
        title={picking ? t('backup.checking') : t('backup.restore')}
        secondary
        disabled={disabled || picking || hasActiveWorkout}
        onPress={() => void choose()}
      />
      {hasActiveWorkout ? (
        <Text style={s.text}>{t('backup.active')}</Text>
      ) : null}
      {error ? (
        <Text accessibilityRole="alert" style={s.text}>
          {presentAppError(t, error.problem, 'error.backupOpen')}
        </Text>
      ) : null}
      <Confirmation
        visible={!!backup}
        title={t('backup.replaceTitle')}
        message={
          summary
            ? t('backup.summary', {
                date: formatDate(locale, summary.createdAt, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }),
                workouts: formatNumber(locale, summary.workouts),
                routines: formatNumber(locale, summary.routines),
                measurements: formatNumber(locale, summary.measurements),
                active: summary.activeWorkout
                  ? t('backup.yes')
                  : t('backup.no'),
              })
            : ''
        }
        confirmLabel={t('backup.replace')}
        cancelLabel={t('backup.keep')}
        destructive
        onConfirm={() => {
          if (backup && !disabled && !hasActiveWorkout) {
            const selected = backup;
            setBackup(undefined);
            onRestore(selected);
          }
        }}
        onCancel={() => setBackup(undefined)}
      />
    </View>
  );
}
const s = StyleSheet.create({
  root: { gap: spacing.sm },
  title: { ...typography.headline, color: colors.textPrimary },
  text: { ...typography.footnote, color: colors.textSecondary },
});
