import { exerciseLibrary } from '../exercise-library';
import {
  previousPlanSet,
  routeComparison,
  routeWeekCounts,
} from '../home-route';
import { makeAssignment } from '../training-programs/assignment';
import { projectProgramWeek } from '../training-programs/schedule';
import { selectProgram } from '../training-programs/selectors';
import { startWorkout } from '../workout-engine';
import type { WorkoutSession } from '../workout-model';

const now = new Date(2026, 10, 28, 12).getTime();
function finished(
  id: string,
  weight: string,
  reps: string,
  finishedAt: number,
): WorkoutSession {
  const session = startWorkout(
    { id: 'bench', name: 'Bench', exerciseIds: ['barbell-bench-press'] },
    exerciseLibrary,
    finishedAt - 1000,
  );
  session.id = id;
  session.finishedAt = finishedAt;
  Object.assign(session.exercises[0].sets[0], {
    weight,
    reps,
    completedAt: finishedAt,
  });
  return session;
}

it('selects matching completed sets in distinct sessions of the same routine', () => {
  const old = finished('older', '60', '8', now - 5000);
  const latest = finished('latest', '65', '8', now - 1000);
  const other = {
    ...finished('other', '75', '8', now - 2000),
    templateId: 'another plan',
  };
  expect(routeComparison([old, other, latest], now)).toMatchObject({
    exerciseId: 'barbell-bench-press',
    previous: { weight: 60, reps: 8 },
    current: { weight: 65, reps: 8 },
  });
  expect(
    previousPlanSet([old, other, latest], 'bench', 'barbell-bench-press', now)
      ?.weight,
  ).toBe(65);
  latest.exercises[0].sets[0].reps = '7';
  expect(routeComparison([old, latest], now)).toBeUndefined();
  delete latest.exercises[0].sets[0].completedAt;
  expect(routeComparison([old, latest], now)).toBeUndefined();
});

it('counts planned slots once and ignores free workouts and duplicates', () => {
  const assignment = makeAssignment(
    selectProgram('get_stronger', 'beginner')!,
    'assigned',
    '2026-11-23',
  );
  const slot = projectProgramWeek(assignment, [], '2026-11-28').slots[0];
  const valid = {
    ...finished('one', '60', '8', now - 5000),
    programSlot: slot.context,
  };
  const days = Array.from({ length: 7 }, (_, i) =>
    new Date(2026, 10, 23 + i).getTime(),
  );
  expect(
    routeWeekCounts(
      assignment,
      [
        valid,
        { ...valid, id: 'duplicate' },
        finished('free', '30', '8', now - 3000),
      ],
      days,
    ),
  ).toEqual({ completed: 1, planned: 3 });
  expect(routeWeekCounts(undefined, [valid], days)).toBeUndefined();
});
