import type { CardioGuidance } from './training-programs/model';

export const cardioExerciseIds = {
  treadmill_walking: 'treadmill-walking',
  stationary_bike: 'upright-stationary-bike',
} as const satisfies Record<NonNullable<CardioGuidance['activity']>, string>;

export type CardioTimer = {
  exerciseId: (typeof cardioExerciseIds)[keyof typeof cardioExerciseIds];
  goalSeconds: number;
  elapsedMs: number;
  startedAt?: number;
};

export const CARDIO_TIMERS_KEY = 'cresum.cardio-timers.v1';

function validateCardioTimer(value: CardioTimer): CardioTimer {
  if (
    !value ||
    !Object.values(cardioExerciseIds).includes(value.exerciseId) ||
    !Number.isSafeInteger(value.goalSeconds) ||
    value.goalSeconds < 15 ||
    value.goalSeconds > 7200 ||
    !Number.isSafeInteger(value.elapsedMs) ||
    value.elapsedMs < 0 ||
    value.elapsedMs > value.goalSeconds * 1000 ||
    (value.startedAt !== undefined &&
      (!Number.isSafeInteger(value.startedAt) || value.startedAt < 0))
  )
    throw new Error(CARDIO_TIMERS_KEY);
  return value;
}

export const cardioElapsed = (timer: CardioTimer, now: number) =>
  Math.min(
    timer.goalSeconds * 1000,
    timer.elapsedMs +
      (timer.startedAt === undefined ? 0 : Math.max(0, now - timer.startedAt)),
  );

export function adjustCardioGoal(
  timer: CardioTimer,
  difference: number,
  now: number,
): CardioTimer {
  const elapsedMs = cardioElapsed(timer, now);
  const goalSeconds = Math.min(
    7200,
    Math.max(15, Math.ceil(elapsedMs / 1000), timer.goalSeconds + difference),
  );
  return {
    ...timer,
    elapsedMs,
    goalSeconds,
    startedAt:
      timer.startedAt !== undefined &&
      elapsedMs < timer.goalSeconds * 1000 &&
      elapsedMs < goalSeconds * 1000
        ? now
        : undefined,
  };
}

export function readCardioTimers(raw: string | null): Map<string, CardioTimer> {
  if (!raw) return new Map();
  const value = JSON.parse(raw);
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error(CARDIO_TIMERS_KEY);
  return new Map(
    Object.entries(value).map(([id, timer]) => [
      id,
      validateCardioTimer(timer as CardioTimer),
    ]),
  );
}

type CardioStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<unknown>;
};

let pendingWrite: Promise<unknown> = Promise.resolve();

export const waitForCardioWrites = () => pendingWrite;

export function saveCardioTimer(
  storage: CardioStorage,
  sessionId: string,
  timer: CardioTimer,
) {
  const next = pendingWrite.then(async () => {
    const timers = readCardioTimers(await storage.getItem(CARDIO_TIMERS_KEY));
    timers.set(sessionId, timer);
    await storage.setItem(
      CARDIO_TIMERS_KEY,
      JSON.stringify(Object.fromEntries(timers)),
    );
  });
  pendingWrite = next.catch(() => {});
  return next;
}
