import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { AppButton } from './AppButton';
import { createThemedStyles } from './AppThemeProvider';
import { GlassCard } from './GlassCard';
import { LocalizedText as Text } from './LayoutDirection';
import { useLocalization } from './LocalizationProvider';
import {
  adjustCardioGoal,
  cardioElapsed,
  loadCardioTimers,
  saveCardioTimer,
  type CardioTimer,
} from '@/lib/cardio-timer';
import { formatNumber } from '@/lib/i18n/format';
import { spacing, typography } from '@/lib/theme';
import { newestFirstHistory } from '@/lib/workout-history';
import type { WorkoutSession } from '@/lib/workout-model';

export function CardioCountdown({
  sessionId,
  exerciseId,
  goalSeconds,
  now,
  history,
  manual,
}: {
  sessionId: string;
  exerciseId: CardioTimer['exerciseId'];
  goalSeconds: number;
  now: number;
  history: readonly WorkoutSession[];
  manual?: {
    timer: CardioTimer;
    disabled: boolean;
    onChange: (transform: (timer: CardioTimer) => CardioTimer) => void;
  };
}) {
  const s = useStyles();
  const { t, locale } = useLocalization();
  const [programTimer, setTimer] = useState<CardioTimer>();
  const timer = manual?.timer ?? programTimer;
  const isManual = Boolean(manual);
  const [previous, setPrevious] = useState<number>();
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const pending = useRef(false);
  useEffect(() => {
    if (isManual) return;
    let active = true;
    loadCardioTimers(AsyncStorage)
      .then((timers) => {
        const saved = timers.get(sessionId);
        if (active)
          setTimer(
            saved?.exerciseId === exerciseId
              ? saved
              : { exerciseId, goalSeconds, elapsedMs: 0 },
          );
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [sessionId, exerciseId, goalSeconds, isManual]);

  useEffect(() => {
    let active = true;
    loadCardioTimers(AsyncStorage)
      .then((timers) => {
        if (!active) return;
        for (const session of newestFirstHistory(history)) {
          const recorded = session.exercises.find(
            ({ cardio }) =>
              cardio?.exerciseId === exerciseId && cardio.elapsedMs > 0,
          )?.cardio;
          if (recorded) {
            setPrevious(recorded.elapsedMs);
            return;
          }
          const stored = timers.get(session.id);
          if (stored?.exerciseId === exerciseId && session.finishedAt) {
            const elapsed = cardioElapsed(stored, session.finishedAt);
            if (elapsed > 0) {
              setPrevious(elapsed);
              return;
            }
          }
        }
        setPrevious(undefined);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [history, exerciseId]);

  const apply = async (transform: (timer: CardioTimer) => CardioTimer) => {
    if (manual) {
      if (!manual.disabled) manual.onChange(transform);
      return;
    }
    if (!timer) return;
    if (pending.current) return;
    const next = transform(timer);
    pending.current = true;
    setSaving(true);
    setFailed(false);
    try {
      await saveCardioTimer(AsyncStorage, sessionId, next);
      setTimer(next);
    } catch {
      setFailed(true);
    } finally {
      pending.current = false;
      setSaving(false);
    }
  };
  if (!timer && !failed) return null;
  const elapsedMs = timer ? cardioElapsed(timer, now) : 0;
  const remaining = timer ? Math.ceil(timer.goalSeconds - elapsedMs / 1000) : 0;
  const running = timer?.startedAt !== undefined && remaining > 0;
  const time = (seconds: number) =>
    `${formatNumber(locale, Math.floor(seconds / 60))}:${formatNumber(locale, seconds % 60, { minimumIntegerDigits: 2 })}`;
  return (
    <GlassCard style={s.card}>
      {failed ? (
        <Text accessibilityRole="alert">{t('error.workoutOperation')}</Text>
      ) : null}
      {timer ? (
        <>
          <Text
            style={s.time}
            accessibilityLabel={t('workout.remaining', { count: remaining })}
          >
            {time(remaining)}
          </Text>
          {previous !== undefined ? (
            <Text style={s.previous}>
              {t('workout.cardioPrevious')} ·{' '}
              {time(Math.floor(previous / 1000))}
            </Text>
          ) : null}
          <AppButton
            title={t(
              running
                ? 'workout.cardioPause'
                : elapsedMs > 0
                  ? 'workout.cardioResume'
                  : 'workout.cardioStart',
            )}
            disabled={saving || manual?.disabled || remaining === 0}
            onPress={() => {
              const pressedAt = Date.now();
              void apply((current) => {
                const elapsedMs = cardioElapsed(current, pressedAt);
                if (elapsedMs >= current.goalSeconds * 1000) return current;
                return {
                  ...current,
                  elapsedMs,
                  startedAt:
                    current.startedAt === undefined ? pressedAt : undefined,
                };
              });
            }}
          />
          <View style={s.actions}>
            {([-15, 15] as const).map((step) => (
              <View key={step} style={s.action}>
                <AppButton
                  title={t(step < 0 ? 'workout.minus15' : 'workout.plus15')}
                  secondary
                  disabled={saving || manual?.disabled}
                  onPress={() =>
                    void apply((current) =>
                      adjustCardioGoal(current, step, Date.now()),
                    )
                  }
                />
              </View>
            ))}
          </View>
        </>
      ) : null}
    </GlassCard>
  );
}
const useStyles = createThemedStyles((colors) => ({
  card: { gap: spacing.sm },
  time: {
    ...typography.title2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  previous: { ...typography.footnote, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
}));
