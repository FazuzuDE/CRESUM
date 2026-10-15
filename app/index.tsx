import { useAccount } from '@/components/useAccount';
import type { AccountSectionProps } from '@/components/AccountSection';
import { useBackupArchive } from '@/components/useBackupArchive';
import { automaticBackupDue } from '@/lib/backup-policy';
import { importBackupHistory } from '@/lib/history-import';
import {
  LocalDataGate,
  type RunDataOperation,
} from '@/components/LocalDataGate';
import {
  createLocalBackup,
  restoreLocalBackup,
  type PreparedBackup,
} from '@/lib/local-backup';
import { shareBackupFile } from '@/lib/backup-files';
import { BrandHeader } from '@/components/BrandHeader';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { GlassCard } from '@/components/GlassCard';
import { Dock } from '@/components/Dock';
import { AppButton } from '@/components/AppButton';
import { HomeDashboard } from '@/components/HomeDashboard';
import { ProfileSettings } from '@/components/ProfileSettings';
import { Onboarding } from '@/components/Onboarding';
import { Confirmation } from '@/components/Confirmation';
import { Workout, duration, successHaptic } from '@/components/Workout';
import { WorkoutHistory } from '@/components/WorkoutHistory';
import { ExercisePerformance } from '@/components/ExercisePerformance';
import { ProgressScrollView } from '@/components/ProgressScrollView';
import { TrainingVolume } from '@/components/TrainingVolume';
import { BodyWeight, type BodyWeightProps } from '@/components/BodyWeight';
import { BodyWeightRepository, type BodyWeightEntry } from '@/lib/body-weight';
import { volume } from '@/lib/workout-metrics';
import {
  DEFAULT_PROGRESS_PERIOD,
  PROGRESS_PERIODS,
  type ProgressPeriodId,
  projectPeriodAnalytics,
} from '@/lib/progress-periods';
import { completedSetCount, workoutIsComplete } from '@/lib/workout-engine';
import { projectVolumeComparison } from '@/lib/progress-volume-comparison';
import {
  WorkoutSession as Session,
  WorkoutTemplate as Template,
} from '@/lib/workout-model';
import { WorkoutRepository } from '@/lib/workout-repository';
import { WorkoutStore } from '@/lib/workout-store';
import {
  hasMeaningfulWorkoutData,
  initialOnboardingState,
  type OnboardingState,
} from '@/lib/onboarding';
import { OnboardingRepository } from '@/lib/onboarding-repository';
import { ProgramRepository } from '@/lib/training-programs/repository';
import { ProgramAcceptance } from '@/lib/training-programs/acceptance';
import type { ProjectedProgramSlot } from '@/lib/training-programs/schedule';
import type { ProgramAssignment } from '@/lib/training-programs/assignment';
import { resetLocalData } from '@/lib/local-data-reset';
import { HiddenBuiltInsRepository } from '@/lib/hidden-builtins';
import type { TemplateDraft } from '@/lib/workout-templates';
import {
  colors,
  progressTypography,
  radius,
  spacing,
  typography,
} from '@/lib/theme';

const blue = colors.primary;
function Stats({
  history,
  measurements,
}: {
  history: Session[];
  measurements: BodyWeightProps & { updatedAt: number };
}) {
  const { fontScale } = useWindowDimensions();
  const [period, setPeriod] = useState<ProgressPeriodId>(
    DEFAULT_PROGRESS_PERIOD,
  );
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const timer = setInterval(refresh, 60_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);
  const analytics = useMemo(
    () => projectPeriodAnalytics(history, period, now),
    [history, period, now],
  );
  const records = analytics.estimatedOneRepMaxRecords;
  const comparison = useMemo(
    () => projectVolumeComparison(history, period, now),
    [history, period, now],
  );
  return (
    <ProgressScrollView
      contentContainerStyle={[s.content, s.progressContent]}
      sections={[
        {
          id: 'overview',
          label: 'Progress',
          content: (
            <View style={{ gap: spacing.md }}>
              <View style={s.progressHeader}>
                <BrandHeader />
                <View style={s.progressHeading}>
                  <Text style={s.progressTitle} accessibilityRole="header">
                    Progress
                  </Text>
                  <Text style={s.progressSubtitle}>
                    Volume and estimated strength records
                  </Text>
                </View>
              </View>
              <View style={s.periods} accessibilityLabel="Progress period">
                {PROGRESS_PERIODS.map((option) => (
                  <Pressable
                    key={option.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Progress period ${option.id}`}
                    accessibilityHint={`Show Progress for ${option.accessibilityLabel}`}
                    accessibilityState={{ selected: period === option.id }}
                    onPress={() => setPeriod(option.id)}
                    style={({ pressed }) => [
                      s.periodChip,
                      fontScale > 1.3 && s.periodChipLargeText,
                      pressed && s.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        s.periodText,
                        period === option.id && s.periodSelectedText,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ),
        },
        {
          id: 'volume',
          label: 'Training Volume',
          content: (
            <>
              <TrainingVolume
                totalVolume={analytics.totalVolume}
                workoutVolumes={analytics.workoutVolumes}
                period={period}
                comparison={comparison}
                now={now}
              />
            </>
          ),
        },
        {
          id: 'records',
          label: 'Estimated 1RM',
          content: (
            <>
              <GlassCard style={s.progressCard}>
                <Text style={s.progressCardTitle} accessibilityRole="header">
                  Estimated 1RM
                </Text>
                <Text style={s.estimateContext}>
                  Epley formula · based on completed sets
                </Text>
                {analytics.excludedSampleCount > 0 ? (
                  <Text style={s.sub}>
                    Some saved sets could not be included.
                  </Text>
                ) : null}
                {records.length === 0 ? (
                  <Text style={s.sub}>
                    No estimated records in this period.
                  </Text>
                ) : (
                  records.slice(0, 6).map((r, i) => (
                    <View
                      key={r.identityKey}
                      style={[
                        s.history,
                        i === Math.min(records.length, 6) - 1 && s.lastRecord,
                      ]}
                    >
                      <View style={s.recordCopy}>
                        <Text style={s.recordName}>{r.name}</Text>
                        <Text style={s.sub}>
                          {r.weight} kg × {r.reps}
                        </Text>
                      </View>
                      <View style={s.recordValue}>
                        {i === 0 && <Text style={s.pr}>TOP PR</Text>}
                        <Text style={s.value2}>
                          {r.estimatedOneRepMax.toFixed(1)} kg
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </GlassCard>
            </>
          ),
        },
        {
          id: 'performance',
          label: 'Logged exercise performance',
          content: (
            <>
              <ExercisePerformance
                history={history}
                period={period}
                now={now}
              />
            </>
          ),
        },
        {
          id: 'body-weight',
          label: 'Body weight',
          content: (
            <BodyWeight
              {...measurements}
              period={period}
              now={Math.max(now, measurements.updatedAt)}
            />
          ),
        },
        {
          id: 'history',
          label: 'History',
          content: (
            <>
              <WorkoutHistory history={history} />
            </>
          ),
        },
      ]}
    />
  );
}
export default function App() {
  const account = useAccount();
  return (
    <LocalDataGate>
      {(run, notice, profile) => (
        <AppContent
          account={account}
          runDataOperation={run}
          notice={notice}
          initialTab={profile ? 'profile' : 'home'}
        />
      )}
    </LocalDataGate>
  );
}
function AppContent({
  account,
  runDataOperation,
  notice,
  initialTab,
}: {
  account: AccountSectionProps;
  runDataOperation: RunDataOperation;
  notice: string;
  initialTab: string;
}) {
  const localBackups = useBackupArchive();
  const [store] = useState(
    () => new WorkoutStore(new WorkoutRepository(AsyncStorage)),
  );
  const { data, ready, busy, error } = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
  );
  const [assignment, setAssignment] = useState<ProgramAssignment | null>(null);
  const [programError, setProgramError] = useState('');
  const programRecovered = useRef(false);
  const [programReady, setProgramReady] = useState(false);
  const [tab, setTab] = useState(initialTab);
  const [bodyWeightRepository] = useState(
    () => new BodyWeightRepository(AsyncStorage),
  );
  const [bodyWeightSnapshot, setBodyWeightSnapshot] = useState(() => ({
    entries: [] as BodyWeightEntry[],
    updatedAt: Date.now(),
  }));
  const bodyWeights = bodyWeightSnapshot.entries;
  const setBodyWeights = useCallback((entries: BodyWeightEntry[]) => {
    setBodyWeightSnapshot({ entries, updatedAt: Date.now() });
  }, []);
  const [bodyWeightBusy, setBodyWeightBusy] = useState(false);
  const bodyWeightErrorRef = useRef('');
  const [bodyWeightError, updateBodyWeightError] = useState('');
  const setBodyWeightError = useCallback((message: string) => {
    bodyWeightErrorRef.current = message;
    updateBodyWeightError(message);
  }, []);
  const [onboardingRepository] = useState(
    () => new OnboardingRepository(AsyncStorage),
  );
  const [hiddenRepository] = useState(
    () => new HiddenBuiltInsRepository(AsyncStorage),
  );
  const [hiddenBuiltInIds, setHiddenBuiltInIds] = useState<string[]>([]);
  const [hiddenReady, setHiddenReady] = useState(false);
  const [hiddenBusy, setHiddenBusy] = useState(false);
  const hiddenErrorRef = useRef('');
  const [hiddenError, updateHiddenError] = useState('');
  const setHiddenError = useCallback((message: string) => {
    hiddenErrorRef.current = message;
    updateHiddenError(message);
  }, []);
  const hiddenWrites = useRef(Promise.resolve());
  const hiddenOperation = useRef(false);
  const hiddenEpoch = useRef(0);
  const [onboardingState, setOnboardingState] = useState<OnboardingState>(
    initialOnboardingState,
  );
  const [onboardingReady, setOnboardingReady] = useState(false);
  const onboardingErrorRef = useRef('');
  const [onboardingError, updateOnboardingError] = useState('');
  const setOnboardingError = useCallback((message: string) => {
    onboardingErrorRef.current = message;
    updateOnboardingError(message);
  }, []);
  const [onboardingLoadFailed, setOnboardingLoadFailed] = useState(false);
  const [onboardingBypass, setOnboardingBypass] = useState(false);
  const [editingPersonalization, setEditingPersonalization] = useState(false);
  const [acceptingProgram, setAcceptingProgram] = useState(false);
  const onboardingWrites = useRef(Promise.resolve());
  const onboardingEpoch = useRef(0);
  const resetInProgress = useRef(false);
  const backupInProgress = useRef(false);
  const [summary, setSummary] = useState<Session | null>(null);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [discardSessionId, setDiscardSessionId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [resetError, setResetError] = useState('');
  useEffect(() => {
    void store.load();
    let mounted = true;
    const epoch = onboardingEpoch.current;
    const visibilityEpoch = hiddenEpoch.current;
    void bodyWeightRepository.load().then(
      (entries) => {
        if (mounted && onboardingEpoch.current === epoch)
          setBodyWeights(entries);
      },
      (problem: Error) => {
        if (mounted && onboardingEpoch.current === epoch)
          setBodyWeightError(problem.message);
      },
    );
    void hiddenRepository
      .load()
      .then(
        (ids) => {
          if (mounted && hiddenEpoch.current === visibilityEpoch)
            setHiddenBuiltInIds(ids);
        },
        () => {
          if (mounted && hiddenEpoch.current === visibilityEpoch)
            setHiddenError(
              'Hidden workout settings are unavailable. All built-ins remain visible.',
            );
        },
      )
      .finally(() => {
        if (mounted && hiddenEpoch.current === visibilityEpoch)
          setHiddenReady(true);
      });
    void onboardingRepository
      .load()
      .then(
        (state) => {
          if (mounted && onboardingEpoch.current === epoch) {
            setOnboardingState(state);
            setOnboardingLoadFailed(false);
            if (
              state.status === 'completed' &&
              state.step === 'complete' &&
              state.answers.bodyWeightKg?.trim()
            ) {
              void bodyWeightRepository
                .record(state.answers.bodyWeightKg, Date.now(), true)
                .then(
                  (entries) => {
                    if (mounted && onboardingEpoch.current === epoch)
                      setBodyWeights(entries);
                  },
                  (problem: Error) => {
                    if (mounted && onboardingEpoch.current === epoch)
                      setBodyWeightError(problem.message);
                  },
                );
            }
          }
        },
        (problem: Error) => {
          if (mounted && onboardingEpoch.current === epoch) {
            setOnboardingError(problem.message);
            setOnboardingLoadFailed(true);
          }
        },
      )
      .finally(() => {
        if (mounted && onboardingEpoch.current === epoch)
          setOnboardingReady(true);
      });
    return () => {
      mounted = false;
    };
  }, [
    store,
    onboardingRepository,
    hiddenRepository,
    bodyWeightRepository,
    setBodyWeights,
    setBodyWeightError,
    setHiddenError,
    setOnboardingError,
  ]);
  const queueOnboardingSave = (next: OnboardingState): Promise<void> => {
    if (resetInProgress.current)
      return Promise.reject(new Error('Reset in progress.'));
    const write = onboardingWrites.current
      .catch(() => undefined)
      .then(async () => {
        if (
          next.status === 'completed' &&
          next.step === 'complete' &&
          next.answers.bodyWeightKg?.trim()
        ) {
          const entries = await bodyWeightRepository.record(
            next.answers.bodyWeightKg,
            Date.now(),
            true,
          );
          if (!resetInProgress.current) setBodyWeights(entries);
        }
        await onboardingRepository.save(next);
      });
    onboardingWrites.current = write.catch(() => undefined);
    return write;
  };
  /* eslint-disable react-hooks/refs -- Stored saver runs only during awaited acceptance, never during render. */
  const [programAcceptance] = useState(
    () =>
      new ProgramAcceptance(
        new ProgramRepository(AsyncStorage),
        store,
        (next) => queueOnboardingSave(next),
      ),
  );
  /* eslint-enable react-hooks/refs */
  const recoverProgram = async () => {
    const epoch = onboardingEpoch.current;
    const result = await programAcceptance.recover();
    if (resetInProgress.current || onboardingEpoch.current !== epoch) return;
    if (result.status === 'accepted') {
      setAssignment(result.assignment!);
      setProgramError('');
      const next = await onboardingRepository.load();
      if (!resetInProgress.current && onboardingEpoch.current === epoch) {
        setOnboardingState(next);
        setOnboardingError('');
        setOnboardingLoadFailed(false);
      }
    } else if (result.status !== 'empty')
      setProgramError(
        result.error ??
          'Program recovery is pending. Your workouts remain available.',
      );
  };
  useEffect(() => {
    if (ready && onboardingReady && !programRecovered.current) {
      programRecovered.current = true;
      void recoverProgram()
        .catch(() =>
          setProgramError(
            'Program recovery is pending. Your workouts remain available.',
          ),
        )
        .finally(() => setProgramReady(true));
    }
    // Recovery runs once per load, after both repositories are ready.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, onboardingReady]);
  const saveOnboardingProgress = (next: OnboardingState) => {
    if (resetInProgress.current) return;
    setOnboardingState(next);
    void queueOnboardingSave(next).catch(() => {
      setOnboardingLoadFailed(false);
      setOnboardingError(
        'Onboarding progress could not be saved. Retry before closing the app.',
      );
    });
  };
  const completeOnboarding = async (
    next: OnboardingState,
    proposal?: ProgramAssignment,
  ) => {
    const epoch = onboardingEpoch.current;
    if (proposal) {
      setAcceptingProgram(true);
      const result = await programAcceptance.accept(proposal, next);
      if (result.status !== 'accepted')
        throw Error(result.error ?? 'Program saving is pending. Retry START!');
      if (resetInProgress.current || onboardingEpoch.current !== epoch) return;
      setAssignment(result.assignment!);
      setProgramError('');
    } else await queueOnboardingSave(next);
    if (resetInProgress.current || onboardingEpoch.current !== epoch) return;
    setOnboardingError('');
    setOnboardingState(next);
    setAcceptingProgram(false);
    setEditingPersonalization(false);
    setTab('home');
  };
  const createFirstWorkout = async (draft: TemplateDraft) => {
    const result = await store.createTemplate(draft);
    if (result.ok) {
      try {
        await completeOnboarding({
          ...onboardingState,
          status: 'completed',
          step: 'complete',
        });
      } catch {
        // The durable custom workout independently identifies a returning user.
        // Never retry creation to repair the separate onboarding record.
        setOnboardingError(
          'Your workout was saved. Onboarding status could not be saved.',
        );
      }
    }
    return result;
  };
  const showOnboarding =
    onboardingReady &&
    !onboardingBypass &&
    !hasMeaningfulWorkoutData(data) &&
    onboardingState.status !== 'completed';
  const startTemplate = (template: Template) => {
    if (data.activeWorkout) {
      setTab('workout');
      return;
    }
    try {
      store.start(template);
      setTab('workout');
    } catch (problem) {
      Alert.alert('Cannot start workout', (problem as Error).message);
    }
  };
  const startProgramSlot = (slot: ProjectedProgramSlot, template: Template) => {
    if (data.activeWorkout) {
      setTab('workout');
      return;
    }
    try {
      store.start(template, slot.context);
      setTab('workout');
    } catch (problem) {
      Alert.alert('Cannot start planned workout', (problem as Error).message);
    }
  };
  const updateHiddenBuiltIns = async (next: string[]): Promise<boolean> => {
    if (hiddenOperation.current || resetInProgress.current) return false;
    hiddenOperation.current = true;
    const epoch = hiddenEpoch.current;
    setHiddenBusy(true);
    setHiddenError('');
    const write = hiddenRepository.save(next);
    hiddenWrites.current = write.catch(() => undefined);
    try {
      await write;
      if (hiddenEpoch.current === epoch) setHiddenBuiltInIds(next);
      return true;
    } catch {
      if (hiddenEpoch.current === epoch)
        setHiddenError(
          'Hidden workout settings could not be saved. Try again.',
        );
      return false;
    } finally {
      hiddenOperation.current = false;
      setHiddenBusy(false);
    }
  };
  const visibleTemplates = data.templates.filter(
    (template) => !hiddenBuiltInIds.includes(template.id),
  );
  const finish = async () => {
    if (!data.activeWorkout || busy) return;
    const completed = await store.finish();
    if (!completed) return;
    successHaptic();
    setConfirmFinish(false);
    setSummary(completed);
    setTab('progress');
  };
  const backupOperation = (
    backup?: PreparedBackup,
    mode: 'export' | 'restore' | 'import' | 'automatic' | 'saved' = 'restore',
  ) => {
    if (resetInProgress.current || backupInProgress.current) return;
    runDataOperation(async (allowReloadAfterRecovery) => {
      backupInProgress.current = true;
      try {
        // LocalDataGate hides writable screens; let already queued work settle.
        await programAcceptance.waitForPendingWrites();
        await localBackups.repository.waitForPendingWrites();
        await onboardingWrites.current;
        await store.waitForPendingWrites();
        await hiddenWrites.current;
        await bodyWeightRepository.waitForPendingWrites();
        const snapshot = store.getSnapshot();
        if (
          !snapshot.ready ||
          snapshot.busy ||
          snapshot.error ||
          onboardingErrorRef.current ||
          bodyWeightErrorRef.current ||
          hiddenErrorRef.current ||
          !programReady
        )
          throw Error(
            'Save or retry your workout changes before using backup and restore.',
          );
        if (mode === 'automatic') {
          if (snapshot.data.activeWorkout || !snapshot.data.history.length)
            return '';
          const livePolicy = await localBackups.repository.load();
          const latestCopy = await localBackups.archive.load();
          if (
            !automaticBackupDue(
              livePolicy,
              latestCopy,
              snapshot.data.history.map((w) => w.id),
              Date.now(),
            )
          )
            return '';
          const saved = await localBackups.archive.save(
            await createLocalBackup(AsyncStorage),
          );
          localBackups.setCopy(saved);
          return '';
        }
        if (mode === 'saved') {
          const saved = await localBackups.archive.load();
          if (!saved) throw Error('No usable saved copy is available.');
          await shareBackupFile(saved.backup.text);
          return 'Saved local copy opened for export. Choose a destination to keep it outside this app.';
        }
        if (backup) {
          allowReloadAfterRecovery();
          if (mode === 'import') {
            const count = await importBackupHistory(AsyncStorage, backup);
            return `${count} workouts imported. Existing history was kept.`;
          }
          await restoreLocalBackup(AsyncStorage, backup);
          return 'Backup restored. Local data was replaced with your selected copy.';
        }
        await shareBackupFile(await createLocalBackup(AsyncStorage));
        return 'Backup sharing finished. A copy is kept only if you chose a save destination.';
      } finally {
        backupInProgress.current = false;
      }
    }, !backup);
  };
  useEffect(() => {
    if (
      !ready ||
      !programReady ||
      busy ||
      !localBackups.loaded ||
      !localBackups.supported ||
      localBackups.saving ||
      !localBackups.policy.enabled ||
      data.activeWorkout
    )
      return;
    const check = () => {
      if (
        resetInProgress.current ||
        backupInProgress.current ||
        confirmReset ||
        editingPersonalization ||
        acceptingProgram
      )
        return;
      if (AppState.currentState && AppState.currentState !== 'active') return;
      if (
        automaticBackupDue(
          localBackups.policy,
          localBackups.copy,
          data.history.map((w) => w.id),
          Date.now(),
        )
      )
        backupOperation(undefined, 'automatic');
    };
    const initial = setTimeout(check, 0);
    const timer = setInterval(check, 60_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
      subscription.remove();
    };
    // The operation reads live stores after pending writes; rerun when history or policy changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    ready,
    programReady,
    busy,
    localBackups.loaded,
    localBackups.supported,
    localBackups.saving,
    localBackups.policy,
    localBackups.copy,
    data.history,
    data.activeWorkout,
    confirmReset,
    editingPersonalization,
    acceptingProgram,
  ]);
  const reset = async () => {
    if (resetInProgress.current || backupInProgress.current || busy) return;
    resetInProgress.current = true;
    ++onboardingEpoch.current;
    programAcceptance.invalidate();
    ++hiddenEpoch.current;
    setResetBusy(true);
    setResetError('');
    try {
      await resetLocalData(AsyncStorage, async () => {
        await programAcceptance.waitForPendingWrites();
        await localBackups.repository.waitForPendingWrites();
        await onboardingWrites.current;
        await store.waitForPendingWrites();
        await hiddenWrites.current;
        await bodyWeightRepository.waitForPendingWrites();
      });
      store.resetAfterLocalDataRemoval();
      await localBackups.refresh();
      setOnboardingState(initialOnboardingState);
      setBodyWeights([]);
      setBodyWeightError('');
      setAcceptingProgram(false);
      setAssignment(null);
      setProgramError('');
      setHiddenBuiltInIds([]);
      setHiddenError('');
      setHiddenReady(true);
      setOnboardingError('');
      setOnboardingLoadFailed(false);
      setOnboardingBypass(false);
      setEditingPersonalization(false);
      setSummary(null);
      setDiscardSessionId(null);
      setConfirmFinish(false);
      setTab('home');
      setConfirmReset(false);
    } catch (problem) {
      try {
        setBodyWeights(await bodyWeightRepository.load());
        setBodyWeightError('');
      } catch (measurementError) {
        setBodyWeightError(
          measurementError instanceof Error
            ? measurementError.message
            : 'Saved body weight is unavailable.',
        );
      }
      setResetError(
        problem instanceof Error
          ? problem.message
          : 'Local data could not be reset. Try again.',
      );
    } finally {
      resetInProgress.current = false;
      setResetBusy(false);
    }
  };
  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="dark" />
      {notice ? (
        <Text accessibilityRole="alert" style={s.notice}>
          {notice}
        </Text>
      ) : null}
      <Confirmation
        visible={confirmReset}
        title="Reset CRESUM?"
        message="All local CRESUM data on this device — workouts, history, templates, active workout, body-weight measurements, hidden-workout settings, personalization and onboarding data — will be permanently deleted. Saved backup files are kept for recovery; automatic backups will be switched off. This does not sign you out. This cannot be undone."
        confirmLabel="Reset local data"
        cancelLabel="Keep data"
        destructive
        busy={resetBusy}
        busyLabel="Resetting…"
        error={resetError}
        onConfirm={() => void reset()}
        onCancel={() => {
          if (resetInProgress.current) return;
          setConfirmReset(false);
          setResetError('');
        }}
      />
      <Confirmation
        visible={confirmFinish}
        title="Finish workout?"
        message={
          data.activeWorkout && workoutIsComplete(data.activeWorkout)
            ? 'Save your completed workout to History and Progress?'
            : 'Some sets are incomplete. Only completed sets count toward your progress.'
        }
        confirmLabel="Finish and save"
        cancelLabel="Keep training"
        busy={busy}
        error={error}
        onConfirm={() => {
          void finish();
        }}
        onCancel={() => setConfirmFinish(false)}
      />
      <Confirmation
        visible={
          discardSessionId !== null &&
          data.activeWorkout?.id === discardSessionId
        }
        title="Discard workout?"
        message="This deletes the active workout and its entered sets without adding it to History. Your saved routines and existing history will stay. This cannot be undone."
        confirmLabel="Discard workout"
        cancelLabel="Keep training"
        destructive
        busy={busy}
        busyLabel="Discarding…"
        error={error}
        onConfirm={() => {
          if (!discardSessionId) return;
          void store.discard(discardSessionId).then((discarded) => {
            if (!discarded) return;
            setDiscardSessionId(null);
            setTab('home');
          });
        }}
        onCancel={() => {
          if (!busy) setDiscardSessionId(null);
        }}
      />
      {programError ? (
        <View style={s.notice} accessibilityRole="alert">
          <Text style={s.sub}>{programError}</Text>
          <AppButton
            title="Retry program recovery"
            secondary
            disabled={busy || resetBusy}
            onPress={() => void recoverProgram()}
          />
        </View>
      ) : null}
      {error ? (
        <View style={s.notice} accessibilityRole="alert">
          <Text style={s.sub}>{error}</Text>
          <AppButton
            title="Retry saving or loading"
            secondary
            disabled={busy}
            onPress={() => {
              void store.retry();
            }}
          />
        </View>
      ) : null}
      {!ready || !onboardingReady || !hiddenReady ? (
        <View style={s.empty}>
          {busy || !onboardingReady || !hiddenReady ? (
            <ActivityIndicator color={blue} />
          ) : null}
          <Text style={s.sub}>
            {busy || !onboardingReady || !hiddenReady
              ? 'Loading your workouts…'
              : 'Saved workouts are unavailable. Retry above.'}
          </Text>
        </View>
      ) : onboardingError && showOnboarding ? (
        <View style={s.empty}>
          <Text style={s.sub} accessibilityRole="alert">
            {onboardingError}
          </Text>
          <AppButton
            title="Retry onboarding"
            onPress={() => {
              if (onboardingLoadFailed) {
                const epoch = onboardingEpoch.current;
                void onboardingRepository.load().then(
                  (state) => {
                    if (onboardingEpoch.current !== epoch) return;
                    setOnboardingState(state);
                    setOnboardingError('');
                    setOnboardingLoadFailed(false);
                  },
                  (problem: Error) => {
                    if (onboardingEpoch.current === epoch)
                      setOnboardingError(problem.message);
                  },
                );
              } else {
                void queueOnboardingSave(onboardingState).then(
                  () => setOnboardingError(''),
                  () =>
                    setOnboardingError(
                      'Onboarding progress could not be saved. Retry before closing the app.',
                    ),
                );
              }
            }}
          />
          <AppButton
            title="Continue to app"
            secondary
            onPress={() => setOnboardingBypass(true)}
          />
        </View>
      ) : showOnboarding || editingPersonalization || acceptingProgram ? (
        <Onboarding
          key={editingPersonalization ? 'edit' : 'first-run'}
          state={
            editingPersonalization
              ? {
                  ...onboardingState,
                  step:
                    onboardingState.step === 'complete'
                      ? 'welcome'
                      : onboardingState.step,
                }
              : onboardingState
          }
          editing={editingPersonalization}
          busy={busy}
          onChange={saveOnboardingProgress}
          onComplete={completeOnboarding}
          onCreateWorkout={createFirstWorkout}
          onExit={() => {
            setEditingPersonalization(false);
            setAcceptingProgram(false);
            setTab(editingPersonalization ? 'profile' : 'home');
          }}
        />
      ) : (
        <>
          {onboardingError ? (
            <View style={s.notice} accessibilityRole="alert">
              <Text style={s.sub}>{onboardingError}</Text>
            </View>
          ) : null}
          {tab === 'home' ? (
            <HomeDashboard
              displayName={onboardingState.answers.displayName}
              assignment={assignment}
              startProgramSlot={startProgramSlot}
              history={data.history}
              activeWorkout={data.activeWorkout}
              onResume={() => setTab('workout')}
              templates={visibleTemplates}
              startTemplate={startTemplate}
              onOpenProfile={() => setTab('profile')}
            />
          ) : tab === 'workout' ? (
            <Workout
              session={data.activeWorkout}
              history={data.history}
              update={(transform) => store.updateWorkout(transform)}
              finish={() => {
                setDiscardSessionId(null);
                setConfirmFinish(true);
              }}
              discard={() => {
                if (!data.activeWorkout || busy) return;
                setConfirmFinish(false);
                setDiscardSessionId(data.activeWorkout.id);
              }}
              busy={busy}
            />
          ) : tab === 'progress' ? (
            <>
              {summary && (
                <View style={s.notice}>
                  <Text style={s.h3}>Workout saved</Text>
                  <Text style={s.sub}>
                    {completedSetCount(summary)} sets ·{' '}
                    {volume(summary).toLocaleString()} kg ·{' '}
                    {duration(
                      (summary.finishedAt ?? summary.startedAt) -
                        summary.startedAt,
                    )}
                  </Text>
                  <AppButton
                    title="Done"
                    secondary
                    onPress={() => setSummary(null)}
                  />
                </View>
              )}
              <Stats
                history={data.history}
                measurements={{
                  entries: bodyWeights,
                  updatedAt: bodyWeightSnapshot.updatedAt,
                  busy: bodyWeightBusy || resetBusy,
                  error: bodyWeightError,
                  onRecord: async (value) => {
                    if (resetInProgress.current)
                      throw Error('Reset in progress.');
                    const epoch = onboardingEpoch.current;
                    setBodyWeightBusy(true);
                    try {
                      const entries = await bodyWeightRepository.record(value);
                      if (onboardingEpoch.current === epoch) {
                        setBodyWeights(entries);
                        setBodyWeightError('');
                      }
                    } finally {
                      setBodyWeightBusy(false);
                    }
                  },
                  onRetry: () => {
                    const epoch = onboardingEpoch.current;
                    setBodyWeightBusy(true);
                    void (
                      onboardingState.status === 'completed' &&
                      onboardingState.step === 'complete' &&
                      onboardingState.answers.bodyWeightKg?.trim()
                        ? bodyWeightRepository.record(
                            onboardingState.answers.bodyWeightKg,
                            Date.now(),
                            true,
                          )
                        : bodyWeightRepository.load()
                    )
                      .then(
                        (entries) => {
                          if (onboardingEpoch.current === epoch) {
                            setBodyWeights(entries);
                            setBodyWeightError('');
                          }
                        },
                        (problem: Error) => {
                          if (onboardingEpoch.current === epoch)
                            setBodyWeightError(problem.message);
                        },
                      )
                      .finally(() => setBodyWeightBusy(false));
                  },
                }}
              />
            </>
          ) : null}
          <View
            style={tab === 'profile' ? s.profileVisible : s.profileHidden}
            pointerEvents={tab === 'profile' ? 'auto' : 'none'}
            accessibilityElementsHidden={tab !== 'profile'}
            importantForAccessibility={
              tab === 'profile' ? 'auto' : 'no-hide-descendants'
            }
          >
            <ProfileSettings
              account={account}
              history={data.history}
              templates={visibleTemplates}
              busy={busy || hiddenBusy}
              version={Constants.expoConfig?.version}
              createTemplate={(draft) => store.createTemplate(draft)}
              updateTemplate={(templateId, draft) =>
                store.updateTemplate(templateId, draft)
              }
              deleteTemplate={(templateId) => store.deleteTemplate(templateId)}
              duplicateTemplate={(templateId) =>
                store.duplicateTemplate(templateId)
              }
              startTemplate={startTemplate}
              hideBuiltIn={(templateId) =>
                updateHiddenBuiltIns([...hiddenBuiltInIds, templateId])
              }
              restoreBuiltIn={(templateId) =>
                updateHiddenBuiltIns(
                  hiddenBuiltInIds.filter((id) => id !== templateId),
                )
              }
              hiddenBuiltInIds={hiddenBuiltInIds}
              hiddenError={hiddenError}
              hasActiveWorkout={Boolean(data.activeWorkout)}
              backup={{
                policy: localBackups.policy,
                settingsLoaded: localBackups.loaded,
                settingsBusy: localBackups.saving,
                settingsError: localBackups.error,
                automaticSupported: localBackups.supported,
                lastCopy: localBackups.copy
                  ? {
                      createdAt: localBackups.copy.createdAt,
                      workouts: localBackups.copy.backup.summary.workouts,
                      routines: localBackups.copy.backup.summary.routines,
                    }
                  : undefined,
                onPolicy: localBackups.savePolicy,
                onRetrySettings: localBackups.refresh,
                onImport: (backup) => backupOperation(backup, 'import'),
                onUseSaved: () => backupOperation(undefined, 'saved'),
                disabled:
                  !ready ||
                  !programReady ||
                  busy ||
                  hiddenBusy ||
                  bodyWeightBusy ||
                  !onboardingReady ||
                  !hiddenReady,
                hasActiveWorkout: !!data.activeWorkout,
                onExport: () => backupOperation(undefined, 'export'),
                onRestore: (backup) => backupOperation(backup, 'restore'),
              }}
              onPersonalize={() => setEditingPersonalization(true)}
              onResetLocalData={() => {
                setResetError('');
                setConfirmReset(true);
              }}
            />
          </View>
          <Dock active={tab} onChange={setTab} />
        </>
      )}
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  profileVisible: { flex: 1 },
  profileHidden: { display: 'none' },
  content: {
    padding: spacing.md,
    gap: spacing.lg,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  notice: { padding: spacing.md, gap: spacing.xs },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  title: { ...typography.largeTitle, color: colors.textPrimary },
  sub: { ...typography.footnote, color: colors.textSecondary },
  progressContent: { gap: spacing.md },
  progressHeader: { gap: spacing.sm },
  progressHeading: { gap: spacing.xxs },
  progressTitle: { ...progressTypography.title, color: colors.textEmphasis },
  progressSubtitle: {
    ...progressTypography.explanation,
    color: colors.textSecondary,
  },
  progressCard: { padding: spacing.md, borderRadius: radius.xxl },
  progressCardTitle: {
    ...progressTypography.sectionTitle,
    color: colors.textEmphasis,
  },
  estimateContext: {
    ...typography.footnote,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
    marginBottom: 0,
  },
  periods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xxs,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.lg,
  },
  periodChip: {
    flexGrow: 1,
    flexBasis: 44,
    minWidth: 44,
    minHeight: 44,
    paddingVertical: spacing.xxs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodText: {
    ...progressTypography.period,
    color: colors.textSecondary,
    width: '100%',
    textAlign: 'center',
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  periodChipLargeText: { flexBasis: '30%' },
  periodSelectedText: {
    ...progressTypography.selectedPeriod,
    color: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  pressed: { opacity: 0.6 },
  h3: { ...typography.headline, color: colors.textPrimary },
  pr: {
    ...typography.caption,
    color: colors.primary,
    backgroundColor: colors.primaryTint,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  recordCopy: { flex: 1, minWidth: 120 },
  recordName: { ...progressTypography.recordName, color: colors.textPrimary },
  recordValue: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: 'auto',
    flexShrink: 1,
    gap: spacing.xs,
  },
  history: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xxs,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  value2: {
    ...progressTypography.recordValue,
    color: colors.textEmphasis,
    fontVariant: ['tabular-nums'],
  },
  lastRecord: { borderBottomWidth: 0 },
});
