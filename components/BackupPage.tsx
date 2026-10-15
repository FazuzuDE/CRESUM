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
  const [fullRestore, setFullRestore] = useState(false),
    [importing, setImporting] = useState(false),
    [checking, setChecking] = useState(false),
    [error, setError] = useState('');
  const [file, setFile] = useState<PreparedBackup>();
  const [filename, setFilename] = useState('CRESUM backup file');
  const pickBusy = useRef(false);
  const busy = backup.disabled || checking || !!backup.settingsBusy;
  const choose = async () => {
    if (busy || pickBusy.current || backup.hasActiveWorkout) return;
    pickBusy.current = true;
    setChecking(true);
    setError('');
    try {
      let selectedName = 'CRESUM backup file';
      const text = await pickBackupFile((name) => {
        selectedName = name;
      });
      if (text !== null) {
        setFile(await parseLocalBackup(text));
        setFilename(selectedName);
        setImporting(true);
      }
    } catch (problem) {
      setError((problem as Error).message);
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
          title="Back to Backup"
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
          title="Back to Backup"
          secondary
          presentation="text"
          disabled={checking}
          onPress={() => {
            setImporting(false);
            setFile(undefined);
          }}
        />
        <Text style={s.title} accessibilityRole="header">
          Import history
        </Text>
        <GlassCard>
          <Text style={s.heading}>{filename}</Text>
          <Text style={s.copy}>
            {new Date(file.summary.createdAt).toLocaleString()}
          </Text>
          <Text style={s.success}>✓ File checked</Text>
        </GlassCard>
        <GlassCard style={s.card}>
          {[
            ['Workouts in file', preview.total],
            ['New workouts', preview.added],
            ['Already in history', preview.existing],
          ].map(([name, value]) => (
            <View key={name} style={s.row}>
              <Text style={s.body}>{name}</Text>
              <Text style={s.heading}>{value}</Text>
            </View>
          ))}
        </GlassCard>
        <GlassCard style={s.info}>
          <Text style={s.heading}>Your current history stays.</Text>
          <Text style={s.copy}>
            Existing workout IDs are skipped. Only completed workouts are added;
            routines, active sessions and profile settings are not imported.
          </Text>
        </GlassCard>
        <AppButton
          title={`Import ${preview.added} ${preview.added === 1 ? 'workout' : 'workouts'}`}
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
          title={checking ? 'Checking file…' : 'Choose another file'}
          secondary
          presentation="text"
          disabled={busy}
          onPress={() => void choose()}
        />
        {error ? (
          <Text accessibilityRole="alert" style={s.copy}>
            {error}
          </Text>
        ) : null}
      </AppScrollView>
    );
  return (
    <AppScrollView contentContainerStyle={s.content}>
      <BrandHeader />
      <AppButton
        title="Back to Profile"
        secondary
        presentation="text"
        disabled={busy}
        onPress={onClose}
      />
      <Text style={s.title} accessibilityRole="header">
        Backup & restore
      </Text>
      <GlassCard style={s.card}>
        <View style={s.row}>
          <Ionicons
            name="archive-outline"
            size={28}
            color={colors.textSecondary}
          />
          <View style={s.flex}>
            <Text style={s.copy}>Last local copy</Text>
            <Text style={s.heading}>
              {backup.lastCopy
                ? new Date(backup.lastCopy.createdAt).toLocaleString()
                : 'No saved copy yet'}
            </Text>
            {backup.lastCopy ? (
              <Text style={s.copy}>
                {backup.lastCopy.workouts} workouts · {backup.lastCopy.routines}{' '}
                routines
              </Text>
            ) : null}
          </View>
        </View>
        <AppButton
          title="Export backup"
          disabled={busy}
          onPress={backup.onExport}
        />
        <AppButton
          title={checking ? 'Checking file…' : 'Import history'}
          secondary
          disabled={busy || backup.hasActiveWorkout}
          onPress={() => void choose()}
        />
        {backup.lastCopy ? (
          <AppButton
            title="Export saved copy"
            secondary
            presentation="text"
            disabled={busy || backup.hasActiveWorkout}
            onPress={backup.onUseSaved ?? (() => {})}
          />
        ) : null}
      </GlassCard>
      <Text style={s.heading} accessibilityRole="header">
        Automatic backups
      </Text>
      <GlassCard style={s.card}>
        <View style={s.row}>
          <Text style={[s.body, s.flex]}>Automatic backup</Text>
          <Switch
            accessibilityLabel="Automatic backup"
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
        <Text style={s.heading}>Frequency</Text>
        {(
          [
            ['workout', 'Every workout'],
            ['weekly', 'Weekly'],
            ['monthly', 'Monthly'],
          ] as const
        ).map(([frequency, label]) => (
          <Pressable
            key={frequency}
            accessibilityRole="radio"
            accessibilityLabel={`Backup frequency ${label}`}
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
          ? 'Every workout copies follow a successful save. Weekly/monthly copies run while the app is open or next opened; active workouts are allowed to finish first. Copies stay in this app and do not protect against device loss or uninstall. Export a file for that.'
          : 'Automatic file copies are available in the iOS and Android app. You can export and import files here.'}
      </Text>
      {backup.settingsError ? (
        <>
          <Text accessibilityRole="alert" style={s.copy}>
            {backup.settingsError}
          </Text>
          <AppButton
            title="Retry backup settings"
            secondary
            onPress={() => void backup.onRetrySettings?.()}
          />
        </>
      ) : null}
      <GlassCard>
        <AppButton
          title="Restore all data"
          secondary
          presentation="row"
          disabled={busy}
          onPress={() => setFullRestore(true)}
        />
        <Text style={s.copy}>Replace this device with a full backup.</Text>
      </GlassCard>
      <Text style={s.copy}>
        Backup files contain personal data and are not encrypted. Choose a save
        destination in the export share sheet.
      </Text>
      {backup.hasActiveWorkout ? (
        <Text style={s.copy}>
          Finish or discard your active workout before importing or restoring.
          Export stays available.
        </Text>
      ) : null}
      {error ? (
        <Text accessibilityRole="alert" style={s.copy}>
          {error}
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
