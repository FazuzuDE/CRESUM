import { workoutRecap } from '../workout-recap';
import { exerciseLibrary } from '../workout-catalog';
import { startWorkout } from '../workout-engine';
import type { WorkoutSession } from '../workout-model';

const base = startWorkout(
  {
    id: 'routine',
    name: 'Routine',
    exerciseIds: ['barbell-bench-press', 'barbell-deadlift'],
  },
  exerciseLibrary,
  1000,
);

const finished = (
  id: string,
  time: number,
  weight: string,
): WorkoutSession => ({
  ...base,
  id,
  finishedAt: time,
  exercises: base.exercises.map((exercise, index) =>
    index
      ? exercise
      : {
          ...exercise,
          sets: [
            { id: 'complete', weight, reps: '10', completedAt: time },
            { id: 'draft', weight: '100', reps: '10', entered: true },
          ],
        },
  ),
});

it('compares the latest matching routine and counts only logged work', () => {
  const current = finished('current', 9000, '60');
  const previous = finished('previous', 6000, '50');
  const partial = finished('exercise removal', 7000, '200');
  partial.exercises = partial.exercises.slice(0, 1);
  const other = {
    ...previous,
    id: 'other',
    templateId: 'other',
    finishedAt: 8000,
  };
  expect(workoutRecap(current, [other, current, previous, partial])).toEqual({
    exercises: 1,
    totalVolume: 600,
    change: 100,
    fraction: 0.2,
  });
});

it('shows decreases and omits undefined comparisons and percentages', () => {
  const current = finished('current', 9000, '40');
  expect(workoutRecap(current, [current]).change).toBeUndefined();
  expect(
    workoutRecap(current, [finished('previous', 5000, '0')]),
  ).toMatchObject({
    change: 400,
    fraction: undefined,
  });
  expect(
    workoutRecap(current, [finished('previous', 5000, '50')]),
  ).toMatchObject({
    change: -100,
    fraction: -0.2,
  });
});
