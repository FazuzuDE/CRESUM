import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { HistoryReviewActions } from './HistorySyncPanel';
import type {
  HistoryComparison,
  HistoryConflictSummary,
} from '@/lib/sync/history-resolver';
import {
  HistoryProtocolError,
  type ResolutionChoice,
} from '@/lib/sync/history-rpc';
import type { WorkoutSession, WorkoutSet } from '@/lib/workout-model';
import { AppButton } from './AppButton';
import { GlassCard } from './GlassCard';
import { colors, spacing, typography } from '@/lib/theme';

const setValue = (set: WorkoutSet) =>
  `${set.weight || '—'} kg × ${set.reps || '—'}${set.otherSideReps === undefined ? '' : ` / ${set.otherSideReps}`} · ${set.completedAt === undefined ? 'Not completed' : 'Completed'}`;
function Version({
  label,
  workout,
  other,
  onChoose,
  disabled,
}: {
  label: 'Device' | 'Cloud';
  workout: WorkoutSession;
  other: WorkoutSession | null;
  onChoose(): void;
  disabled: boolean;
}) {
  return (
    <GlassCard style={s.version}>
      <Text style={s.heading}>{label} version</Text>
      <Text style={s.heading}>{workout.name}</Text>
      <Text style={s.copy}>
        Workout: {new Date(workout.startedAt).toLocaleString()}
      </Text>
      {workout.finishedAt !== undefined ? (
        <Text style={s.copy}>
          Finished: {new Date(workout.finishedAt).toLocaleString()}
        </Text>
      ) : null}
      <Text style={s.copy}>Edit time unknown</Text>
      {workout.exercises.map((exercise, i) => (
        <View key={i} style={s.group}>
          <Text
            style={[
              s.heading,
              exercise.name !== other?.exercises[i]?.name && s.difference,
            ]}
          >
            {exercise.name}
          </Text>
          {exercise.target ? (
            <Text style={s.copy}>
              Target: {exercise.target.repMin}–{exercise.target.repMax} reps
              {exercise.target.perSide ? ' per side' : ''} · Rest{' '}
              {exercise.target.restMin}–{exercise.target.restMax}s
            </Text>
          ) : null}
          {exercise.sets.map((set, j) => (
            <View
              key={j}
              style={[
                s.set,
                setValue(set) !==
                  (other?.exercises[i]?.sets[j]
                    ? setValue(other.exercises[i].sets[j])
                    : '') && s.changed,
              ]}
            >
              <Text style={s.copy}>Set {j + 1}</Text>
              <Text style={s.value}>{setValue(set)}</Text>
            </View>
          ))}
          {!exercise.sets.length ? <Text style={s.copy}>No sets</Text> : null}
        </View>
      ))}
      {!workout.exercises.length ? (
        <Text style={s.copy}>No exercises</Text>
      ) : null}
      <AppButton
        title="Keep this version"
        accessibilityLabel={`Keep ${label.toLowerCase()} version`}
        disabled={disabled}
        onPress={onChoose}
      />
    </GlassCard>
  );
}

export function HistoryConflictReview({
  actions,
  onClose,
  onSignOut,
}: {
  actions: HistoryReviewActions;
  onClose(): void;
  onSignOut(): Promise<void>;
}) {
  const [items, setItems] = useState<HistoryConflictSummary[]>([]);
  const [view, setView] = useState<HistoryComparison | null>(null);
  const [choice, setChoice] = useState<ResolutionChoice | null>(null);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const epoch = useRef(0);
  const inFlight = useRef(false);
  useEffect(() => {
    const lifecycle = epoch;
    const token = ++lifecycle.current;
    void actions.conflicts().then(
      (list) => {
        if (epoch.current === token) {
          setItems(list);
          setBusy(false);
        }
      },
      () => {
        if (epoch.current === token) {
          setError('Could not load conflicts. Retry sync.');
          setBusy(false);
        }
      },
    );
    return () => {
      ++lifecycle.current;
    };
  }, [actions]);
  async function run(work: () => Promise<void>) {
    if (inFlight.current) return;
    inFlight.current = true;
    const token = epoch.current;
    setBusy(true);
    setError('');
    try {
      await work();
    } catch (e) {
      if (epoch.current !== token) return;
      setChoice(null);
      if (e instanceof HistoryProtocolError && e.kind === 'conflict') {
        setError(
          'The workout changed. Review the latest versions before choosing.',
        );
        if (view) {
          try {
            const fresh = await actions.compare(view.workoutId);
            if (epoch.current === token) setView(fresh);
          } catch {
            if (epoch.current === token) setView(null);
          }
        }
      } else {
        setView(null);
        setError(
          e instanceof HistoryProtocolError && e.kind === 'auth'
            ? 'Your account session changed. Sign in again to continue.'
            : e instanceof HistoryProtocolError && e.kind === 'invalid'
              ? 'Backup data could not be verified. Your local history is kept. Retry sync.'
              : 'Could not finish. Your history is kept. Retry sync to recover your last choice.',
        );
      }
    } finally {
      if (epoch.current === token) {
        setBusy(false);
        inFlight.current = false;
      }
    }
  }
  function open(id: string) {
    const token = epoch.current;
    void run(async () => {
      const next = await actions.compare(id);
      if (epoch.current === token) {
        setView(next);
        setChoice(null);
        setMore(false);
      }
    });
  }
  function confirm() {
    if (!view || !choice) return;
    const token = epoch.current;
    void run(async () => {
      await actions.resolve(view, choice);
      const next = await actions.conflicts();
      if (epoch.current === token) {
        setItems(next);
        setView(null);
        setChoice(null);
        setMore(false);
      }
    });
  }
  const local = view?.local ?? null;
  const remote = view?.remote?.workout ?? null;
  const deleted = !!view?.remote && !remote;
  const blocked = view?.blocked;
  return (
    <View style={s.root}>
      <Text style={s.title} accessibilityRole="header">
        Review conflicting workouts
      </Text>
      <Text style={s.copy}>
        Changes to different workouts merge automatically. For different
        versions of the same workout, you choose what to keep. Dates do not
        decide which is correct.
      </Text>
      {busy ? (
        <Text style={s.copy} accessibilityLiveRegion="polite">
          Checking your workout…
        </Text>
      ) : null}
      {error ? (
        <Text style={s.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      {view ? (
        <>
          {blocked ? (
            <Text style={s.copy}>
              {blocked === 'other-account'
                ? 'This workout belongs to another account. It cannot be replaced here.'
                : blocked === 'active'
                  ? 'This workout is currently active. Finish it before reviewing.'
                  : blocked === 'same'
                    ? 'These versions now match. Retry sync to update the conflict list.'
                    : 'This workout is no longer available for comparison. Retry sync.'}
            </Text>
          ) : choice ? (
            <GlassCard style={s.group}>
              <Text style={s.heading}>
                {choice === 'both'
                  ? deleted
                    ? 'Save device as a new workout?'
                    : 'Save both workouts?'
                  : deleted
                    ? 'Remove the device workout?'
                    : `Keep the ${choice === 'local' ? 'device' : 'cloud'} version?`}
              </Text>
              <Text style={s.copy}>
                {choice === 'both'
                  ? deleted
                    ? 'The device version will be saved as one new workout in History and Progress. The deleted cloud workout stays deleted.'
                    : 'The device version will be saved as a new workout. The cloud version stays as it is. Both workouts will count in History and Progress'
                  : deleted
                    ? 'The workout will be removed from this device to match its deletion in the cloud.'
                    : `This replaces the ${choice === 'local' ? 'cloud' : 'device'} version with the version you selected.`}
              </Text>
              <AppButton
                title={
                  choice === 'both'
                    ? 'Save both workouts'
                    : deleted
                      ? 'Remove device workout'
                      : choice === 'local'
                        ? 'Replace cloud version'
                        : 'Replace device version'
                }
                destructive={deleted && choice === 'cloud'}
                disabled={busy}
                onPress={confirm}
              />
              <AppButton
                title="Back to comparison"
                secondary
                disabled={busy}
                onPress={() => setChoice(null)}
              />
            </GlassCard>
          ) : (
            <>
              <Text style={s.copy}>
                Highlighted sets differ. Saved exercise or program details may
                also differ even when set values match.
              </Text>
              <View style={s.versions}>
                {local ? (
                  <Version
                    label="Device"
                    workout={local}
                    other={remote}
                    disabled={busy || deleted}
                    onChoose={() => setChoice('local')}
                  />
                ) : null}
                {remote ? (
                  <Version
                    label="Cloud"
                    workout={remote}
                    other={local}
                    disabled={busy}
                    onChoose={() => setChoice('cloud')}
                  />
                ) : null}
              </View>
              {deleted ? (
                <GlassCard style={s.group}>
                  <Text style={s.heading}>Deleted in cloud</Text>
                  <Text style={s.copy}>
                    Keep the device version as a new workout, or accept the
                    deletion. The deleted workout will not be restored.
                  </Text>
                  <AppButton
                    title="Save device as new workout"
                    disabled={busy}
                    onPress={() => setChoice('both')}
                  />
                  <AppButton
                    title="Accept cloud deletion"
                    secondary
                    disabled={busy}
                    onPress={() => setChoice('cloud')}
                  />
                </GlassCard>
              ) : (
                <>
                  <AppButton
                    title="More options"
                    secondary
                    disabled={busy}
                    onPress={() => setMore(!more)}
                  />
                  {more ? (
                    <AppButton
                      title="Save both as separate workouts"
                      secondary
                      disabled={busy}
                      onPress={() => setChoice('both')}
                    />
                  ) : null}
                </>
              )}
            </>
          )}
          <AppButton
            title="Back to conflict list"
            secondary
            disabled={busy}
            onPress={() => {
              setView(null);
              setChoice(null);
            }}
          />
        </>
      ) : !busy ? (
        <>
          {items.length ? (
            items.map((item) => (
              <AppButton
                key={item.id}
                title={item.name || 'Untitled workout'}
                presentation="row"
                secondary
                onPress={() => open(item.id)}
              />
            ))
          ) : !error ? (
            <Text style={s.heading}>No conflicts to review</Text>
          ) : null}
        </>
      ) : null}
      <AppButton
        title="Retry sync"
        secondary
        disabled={busy}
        onPress={() => {
          const token = epoch.current;
          void run(async () => {
            await actions.sync();
            const next = await actions.conflicts();
            if (epoch.current === token) {
              setItems(next);
              setView(null);
              setChoice(null);
            }
          });
        }}
      />
      <AppButton title="Decide later" secondary onPress={onClose} />
      <AppButton
        title="Sign Out"
        secondary
        disabled={signingOut}
        onPress={() => {
          if (signingOut) return;
          const token = epoch.current;
          setSigningOut(true);
          void onSignOut()
            .catch(() => {
              if (epoch.current === token)
                setError('Could not sign out. Try again.');
            })
            .finally(() => {
              if (epoch.current === token) setSigningOut(false);
            });
        }}
      />
    </View>
  );
}
const s = StyleSheet.create({
  root: { gap: spacing.md },
  title: { ...typography.title2, color: colors.textPrimary },
  heading: { ...typography.headline, color: colors.textPrimary },
  copy: { ...typography.footnote, color: colors.textSecondary },
  error: { ...typography.body, color: colors.danger },
  versions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  version: { flex: 1, flexBasis: 240, minWidth: 0, gap: spacing.sm },
  group: { gap: spacing.xs },
  set: { padding: spacing.xs, borderRadius: 10, gap: spacing.xxs },
  changed: { backgroundColor: colors.primaryTint },
  difference: { color: colors.primary },
  value: { ...typography.body, color: colors.textPrimary },
});
