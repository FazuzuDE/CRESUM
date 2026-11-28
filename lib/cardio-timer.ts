import { cardioExerciseIds } from './exercise-library';
export { cardioExerciseIds } from './exercise-library';

export type CardioTimer = {
  exerciseId: (typeof cardioExerciseIds)[keyof typeof cardioExerciseIds];
  goalSeconds: number;
  elapsedMs: number;
  startedAt?: number;
};

export const CARDIO_TIMERS_KEY = 'cresum.cardio-timers.v1';

export function isCardioExerciseId(
  id: string,
): id is CardioTimer['exerciseId'] {
  return (
    id === cardioExerciseIds.treadmill_walking ||
    id === cardioExerciseIds.stationary_bike
  );
}

export function isCardioTimer(value: unknown): value is CardioTimer {
  if (!value || typeof value !== 'object') return false;
  const timer = value as CardioTimer;
  return (
    isCardioExerciseId(timer.exerciseId) &&
    Number.isSafeInteger(timer.goalSeconds) &&
    timer.goalSeconds >= 15 &&
    timer.goalSeconds <= 7200 &&
    Number.isSafeInteger(timer.elapsedMs) &&
    timer.elapsedMs >= 0 &&
    timer.elapsedMs <= timer.goalSeconds * 1000 &&
    (timer.startedAt === undefined ||
      (Number.isSafeInteger(timer.startedAt) && timer.startedAt >= 0))
  );
}

function validateCardioTimer(value: unknown): CardioTimer {
  if (!isCardioTimer(value)) throw new Error(CARDIO_TIMERS_KEY);
  return value;
}

export const cardioElapsed = (timer: CardioTimer, now: number) =>
  Math.min(
    timer.goalSeconds * 1000,
    timer.elapsedMs +
      (timer.startedAt === undefined ? 0 : Math.max(0, now - timer.startedAt)),
  );

export const pauseCardioTimer = (
  timer: CardioTimer,
  now: number,
): CardioTimer =>
  timer.startedAt === undefined
    ? timer
    : { ...timer, elapsedMs: cardioElapsed(timer, now), startedAt: undefined };

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
      validateCardioTimer(timer),
    ]),
  );
}

type CardioStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<unknown>;
};

let pendingWrite: Promise<unknown> = Promise.resolve();

export const waitForCardioWrites = () => pendingWrite;

export async function loadCardioTimers(
  storage: Pick<CardioStorage, 'getItem'>,
) {
  await waitForCardioWrites();
  return readCardioTimers(await storage.getItem(CARDIO_TIMERS_KEY));
}

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
