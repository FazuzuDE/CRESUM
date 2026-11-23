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
  CARDIO_TIMERS_KEY,
  readCardioTimers,
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
}: {
  sessionId: string;
  exerciseId: CardioTimer['exerciseId'];
  goalSeconds: number;
  now: number;
  history: readonly WorkoutSession[];
}) {
  const s = useStyles();
  const { t, locale } = useLocalization();
  const [timer, setTimer] = useState<CardioTimer>();
  const [previous, setPrevious] = useState<number>();
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const pending = useRef(false);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(CARDIO_TIMERS_KEY)
      .then((raw) => {
        const saved = readCardioTimers(raw).get(sessionId);
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
  }, [sessionId, exerciseId, goalSeconds]);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(CARDIO_TIMERS_KEY)
      .then((raw) => {
        if (!active) return;
        const timers = readCardioTimers(raw);
        for (const session of newestFirstHistory(history)) {
          const stored = timers.get(session.id);
          if (stored?.exerciseId === exerciseId && session.finishedAt) {
            const elapsed = cardioElapsed(stored, session.finishedAt);
            if (elapsed > 0) {
              setPrevious(elapsed);
              return;
            }
          }
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [history, exerciseId]);

  const apply = async (next: CardioTimer) => {
    if (pending.current) return;
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
            disabled={saving || remaining === 0}
            onPress={() => {
              const pressedAt = Date.now();
              const done = cardioElapsed(timer, pressedAt);
              void apply({
                ...timer,
                elapsedMs: done,
                startedAt:
                  running || done >= timer.goalSeconds * 1000
                    ? undefined
                    : pressedAt,
              });
            }}
          />
          <View style={s.actions}>
            {([-15, 15] as const).map((step) => (
              <View key={step} style={s.action}>
                <AppButton
                  title={t(step < 0 ? 'workout.minus15' : 'workout.plus15')}
                  secondary
                  disabled={saving}
                  onPress={() =>
                    void apply(adjustCardioGoal(timer, step, Date.now()))
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
