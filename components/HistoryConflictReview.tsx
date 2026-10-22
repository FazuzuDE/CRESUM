import { useLocalization } from './LocalizationProvider';
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
import { completedSetCount } from '@/lib/workout-engine';
import { completedSetMetrics, volume } from '@/lib/workout-metrics';
import { AppButton } from './AppButton';
import { GlassCard } from './GlassCard';
import { colors, spacing, typography } from '@/lib/theme';
import type { MessageKey } from '@/lib/i18n/messages';
import { formatDate, formatNumber, formatEntryNumber } from '@/lib/i18n/format';

const setValue = (set: WorkoutSet) =>
  JSON.stringify([
    set.weight || '—',
    set.reps || '—',
    set.otherSideReps,
    set.completedAt !== undefined,
  ]);
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
  const { t, locale } = useLocalization();
  const displaySet = (set: WorkoutSet) =>
    set.otherSideReps === undefined
      ? t('conflict.setValue', {
          weight: formatEntryNumber(locale, set.weight || '—'),
          reps: formatEntryNumber(locale, set.reps || '—'),
          status: t(
            set.completedAt === undefined
              ? 'conflict.incomplete'
              : 'conflict.complete',
          ),
        })
      : t('conflict.setValueBoth', {
          weight: formatEntryNumber(locale, set.weight || '—'),
          reps: formatEntryNumber(locale, set.reps || '—'),
          other: formatEntryNumber(locale, set.otherSideReps),
          status: t(
            set.completedAt === undefined
              ? 'conflict.incomplete'
              : 'conflict.complete',
          ),
        });
  const completed = completedSetCount(workout);
  const measured = workout.exercises
    .flatMap((exercise) => exercise.sets)
    .filter((set) => completedSetMetrics(set) !== undefined).length;
  return (
    <GlassCard style={s.version}>
      <Text style={s.heading}>
        {t(
          label === 'Device'
            ? 'conflict.deviceVersion'
            : 'conflict.cloudVersion',
        )}
      </Text>
      <Text style={s.heading}>{workout.name}</Text>
      <Text style={s.copy}>
        {t('conflict.started', {
          date: formatDate(locale, workout.startedAt, {
            dateStyle: 'medium',
            timeStyle: 'short',
          }),
        })}
      </Text>
      {workout.finishedAt !== undefined ? (
        <Text style={s.copy}>
          {t('conflict.finished', {
            date: formatDate(locale, workout.finishedAt, {
              dateStyle: 'medium',
              timeStyle: 'short',
            }),
          })}
        </Text>
      ) : null}
      <Text style={s.copy}>{t('conflict.unknownEdit')}</Text>
      <View style={s.group}>
        <Text style={s.heading}>
          {t('conflict.completed', { count: completed })}
        </Text>
        <Text style={s.copy}>
          {measured
            ? t('conflict.volume', {
                volume: formatNumber(locale, volume(workout)),
              })
            : t('conflict.noVolume')}
        </Text>
        {measured > 0 && measured < completed ? (
          <Text style={s.copy}>
            {t('conflict.partialVolume', {
              measured: formatNumber(locale, measured),
              completed: formatNumber(locale, completed),
            })}
          </Text>
        ) : null}
      </View>
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
              {t(
                exercise.target.perSide
                  ? 'conflict.targetPerSide'
                  : 'conflict.target',
                {
                  min: formatNumber(locale, exercise.target.repMin),
                  max: formatNumber(locale, exercise.target.repMax),
                  restMin: formatNumber(locale, exercise.target.restMin),
                  restMax: formatNumber(locale, exercise.target.restMax),
                },
              )}
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
              <Text style={s.copy}>
                {t('conflict.set', { number: formatNumber(locale, j + 1) })}
              </Text>
              <Text style={s.value}>{displaySet(set)}</Text>
            </View>
          ))}
          {!exercise.sets.length ? (
            <Text style={s.copy}>{t('conflict.noSets')}</Text>
          ) : null}
        </View>
      ))}
      {!workout.exercises.length ? (
        <Text style={s.copy}>{t('conflict.noExercises')}</Text>
      ) : null}
      <AppButton
        title={t('conflict.keep')}
        accessibilityLabel={t(
          label === 'Device' ? 'conflict.keepDevice' : 'conflict.keepCloud',
        )}
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
  const { t } = useLocalization();
  const [items, setItems] = useState<HistoryConflictSummary[]>([]);
  const [view, setView] = useState<HistoryComparison | null>(null);
  const [choice, setChoice] = useState<ResolutionChoice | null>(null);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<
    Extract<MessageKey, `conflict.${string}Error`> | ''
  >('');
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
          setError('conflict.loadError');
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
        setError('conflict.changedError');
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
            ? 'conflict.authError'
            : e instanceof HistoryProtocolError && e.kind === 'invalid'
              ? 'conflict.invalidError'
              : 'conflict.finishError',
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
        {t('sync.review')}
      </Text>
      <Text style={s.copy}>{t('conflict.intro')}</Text>
      {busy ? (
        <Text style={s.copy} accessibilityLiveRegion="polite">
          {t('conflict.checking')}
        </Text>
      ) : null}
      {error ? (
        <Text style={s.error} accessibilityRole="alert">
          {t(error)}
        </Text>
      ) : null}
      {view ? (
        <>
          {blocked ? (
            <Text style={s.copy}>
              {blocked === 'other-account'
                ? t('conflict.otherAccount')
                : blocked === 'active'
                  ? t('conflict.active')
                  : blocked === 'same'
                    ? t('conflict.same')
                    : t('conflict.unavailable')}
            </Text>
          ) : choice ? (
            <GlassCard style={s.group}>
              <Text style={s.heading}>
                {choice === 'both'
                  ? deleted
                    ? t('conflict.saveNewQuestion')
                    : t('conflict.saveBothQuestion')
                  : deleted
                    ? t('conflict.removeQuestion')
                    : t(
                        choice === 'local'
                          ? 'conflict.keepDeviceQuestion'
                          : 'conflict.keepCloudQuestion',
                      )}
              </Text>
              <Text style={s.copy}>
                {choice === 'both'
                  ? deleted
                    ? t('conflict.saveNewHint')
                    : t('conflict.saveBothHint')
                  : deleted
                    ? t('conflict.removeHint')
                    : t(
                        choice === 'local'
                          ? 'conflict.replaceCloudHint'
                          : 'conflict.replaceDeviceHint',
                      )}
              </Text>
              <AppButton
                title={
                  choice === 'both'
                    ? t('conflict.saveBoth')
                    : deleted
                      ? t('conflict.remove')
                      : choice === 'local'
                        ? t('conflict.replaceCloud')
                        : t('conflict.replaceDevice')
                }
                destructive={deleted && choice === 'cloud'}
                disabled={busy}
                onPress={confirm}
              />
              <AppButton
                title={t('conflict.backComparison')}
                secondary
                disabled={busy}
                onPress={() => setChoice(null)}
              />
            </GlassCard>
          ) : (
            <>
              <Text style={s.copy}>{t('conflict.highlights')}</Text>
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
                  <Text style={s.heading}>{t('conflict.deleted')}</Text>
                  <Text style={s.copy}>{t('conflict.deletedHint')}</Text>
                  <AppButton
                    title={t('conflict.saveNew')}
                    disabled={busy}
                    onPress={() => setChoice('both')}
                  />
                  <AppButton
                    title={t('conflict.acceptDeletion')}
                    secondary
                    disabled={busy}
                    onPress={() => setChoice('cloud')}
                  />
                </GlassCard>
              ) : (
                <>
                  <AppButton
                    title={t('conflict.more')}
                    secondary
                    disabled={busy}
                    onPress={() => setMore(!more)}
                  />
                  {more ? (
                    <AppButton
                      title={t('conflict.saveSeparate')}
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
            title={t('conflict.backList')}
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
                title={item.name || t('conflict.untitled')}
                presentation="row"
                secondary
                onPress={() => open(item.id)}
              />
            ))
          ) : !error ? (
            <Text style={s.heading}>{t('conflict.none')}</Text>
          ) : null}
        </>
      ) : null}
      <AppButton
        title={t('conflict.retry')}
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
      <AppButton title={t('conflict.later')} secondary onPress={onClose} />
      <AppButton
        title={t('account.signOut')}
        secondary
        disabled={signingOut}
        onPress={() => {
          if (signingOut) return;
          const token = epoch.current;
          setSigningOut(true);
          void onSignOut()
            .catch(() => {
              if (epoch.current === token) setError('conflict.signOutError');
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
