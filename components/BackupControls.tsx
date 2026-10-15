import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { parseLocalBackup, type PreparedBackup } from '@/lib/local-backup';
import { pickBackupFile } from '@/lib/backup-files';
import { colors, spacing, typography } from '@/lib/theme';
import { AppButton } from './AppButton';
import { Confirmation } from './Confirmation';
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
  const [picking, setPicking] = useState(false),
    [error, setError] = useState('');
  const [backup, setBackup] = useState<PreparedBackup>();
  const pickingRef = useRef(false);
  const choose = async () => {
    if (pickingRef.current || disabled || hasActiveWorkout) return;
    pickingRef.current = true;
    setPicking(true);
    setError('');
    try {
      const text = await pickBackupFile();
      if (text !== null) setBackup(await parseLocalBackup(text));
    } catch (problem) {
      setError(
        problem instanceof Error
          ? problem.message
          : 'Backup could not be opened. Try again.',
      );
    } finally {
      pickingRef.current = false;
      setPicking(false);
    }
  };
  const summary = backup?.summary;
  return (
    <View style={s.root}>
      <Text style={s.title} accessibilityRole="header">
        Backup & restore
      </Text>
      <Text style={s.text}>
        Keep a file copy of your workouts, active session, programs, profile and
        body-weight measurements. The file contains personal data and is not
        encrypted.
      </Text>
      <AppButton
        title="Export backup"
        secondary
        disabled={disabled || picking}
        onPress={onExport}
      />
      <Text style={s.text}>
        Choose Save to Files or another destination in the share sheet to keep
        the copy.
      </Text>
      <AppButton
        title={picking ? 'Checking backup…' : 'Restore backup'}
        secondary
        disabled={disabled || picking || hasActiveWorkout}
        onPress={() => void choose()}
      />
      {hasActiveWorkout ? (
        <Text style={s.text}>
          Finish or discard your active workout before restoring. You can still
          export it.
        </Text>
      ) : null}
      {error ? (
        <Text accessibilityRole="alert" style={s.text}>
          {error}
        </Text>
      ) : null}
      <Confirmation
        visible={!!backup}
        title="Replace local data?"
        message={
          summary
            ? `Backup: ${new Date(summary.createdAt).toLocaleString()}. ${summary.workouts} completed workouts, ${summary.routines} saved routines, ${summary.measurements} body-weight measurements. Active workout: ${summary.activeWorkout ? 'yes' : 'no'}. This replaces all CRESUM data on this device with the backup, including profile and program settings. It does not merge the two copies.`
            : ''
        }
        confirmLabel="Replace with backup"
        cancelLabel="Keep current data"
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
