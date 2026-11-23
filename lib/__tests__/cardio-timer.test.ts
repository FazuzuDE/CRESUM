import {
  adjustCardioGoal,
  cardioElapsed,
  readCardioTimers,
  type CardioTimer,
} from '../cardio-timer';

const timer: CardioTimer = {
  exerciseId: 'treadmill-walking',
  goalSeconds: 60,
  elapsedMs: 5000,
  startedAt: 10000,
};

it('restores running time and caps it at the goal or the workout finish', () => {
  const restored = readCardioTimers(JSON.stringify({ session: timer })).get(
    'session',
  )!;
  expect(cardioElapsed(restored, 30000)).toBe(25000);
  expect(cardioElapsed(restored, 90000)).toBe(60000);
  expect(cardioElapsed({ ...restored, startedAt: undefined }, 90000)).toBe(
    5000,
  );
});

it('preserves elapsed time when adjusting the goal and does not resume after expiration', () => {
  expect(adjustCardioGoal(timer, -30, 55000)).toEqual({
    ...timer,
    elapsedMs: 50000,
    goalSeconds: 50,
    startedAt: undefined,
  });
  expect(adjustCardioGoal(timer, 15, 90000)).toEqual({
    ...timer,
    elapsedMs: 60000,
    goalSeconds: 75,
    startedAt: undefined,
  });
});
