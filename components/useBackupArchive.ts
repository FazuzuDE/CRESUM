import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BackupPolicyRepository,
  defaultBackupPolicy,
  type BackupPolicy,
} from '@/lib/backup-policy';
import {
  AutomaticBackupRepository,
  type AutomaticBackup,
} from '@/lib/automatic-backup';
import {
  automaticBackupFiles,
  supportsAutomaticBackups,
} from '@/lib/automatic-backup-files';
export function useBackupArchive() {
  const [repository] = useState(() => new BackupPolicyRepository(AsyncStorage));
  const [archive] = useState(
    () => new AutomaticBackupRepository(automaticBackupFiles),
  );
  const [policy, setPolicy] = useState<BackupPolicy>(defaultBackupPolicy),
    [copy, setCopy] = useState<AutomaticBackup>();
  const [loaded, setLoaded] = useState(false),
    [saving, setSaving] = useState(false),
    [error, setError] = useState('');
  const liveError = useRef('');
  const report = useCallback((message: string) => {
    liveError.current = message;
    setError(message);
  }, []);
  const refresh = useCallback(async () => {
    try {
      const nextPolicy = await repository.load();
      const nextCopy = supportsAutomaticBackups
        ? await archive.load()
        : undefined;
      setPolicy(nextPolicy);
      setCopy(nextCopy);
      report('');
      setLoaded(true);
    } catch (problem) {
      setLoaded(false);
      report(
        problem instanceof Error
          ? problem.message
          : 'Backup settings are unavailable.',
      );
    }
  }, [repository, archive, report]);
  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, [refresh]);
  const savePolicy = async (next: BackupPolicy) => {
    if (saving) return;
    setSaving(true);
    try {
      await repository.save(next);
      setPolicy(next);
      report('');
    } catch (problem) {
      report((problem as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return {
    repository,
    archive,
    policy,
    copy,
    setCopy,
    loaded,
    saving,
    error,
    liveError,
    savePolicy,
    refresh,
    supported: supportsAutomaticBackups,
  };
}
