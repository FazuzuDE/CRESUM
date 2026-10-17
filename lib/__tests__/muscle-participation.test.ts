import { projectMuscleParticipation } from '../muscle-participation';
import type { WorkoutSession } from '../workout-model';

const now = new Date(2026, 9, 17, 12).getTime();
function workout(
  id = 'one',
  libraryId = 'barbell-bench-press',
  end = now,
): WorkoutSession {
  return {
    id,
    name: 'Saved workout',
    templateId: 'template',
    startedAt: end - 1000,
    finishedAt: end,
    currentExerciseIndex: 0,
    restDurationSeconds: 90,
    exercises: [
      {
        id: 'exercise',
        libraryId,
        name: 'Saved name',
        muscle: 'Not used',
        sets: [{ id: 'set', weight: '0', reps: '8', completedAt: end - 100 }],
      },
    ],
  };
}
describe('factual muscle participation', () => {
  it('keeps exact exercise identities and repeated exercise instances traceable', () => {
    const input = workout();
    input.exercises.push({ ...input.exercises[0], id: 'repeat' });
    const result = projectMuscleParticipation(
      [input, workout('variant', 'dumbbell-bench-press')],
      undefined,
      '7d',
      now,
    );
    const chest = result.muscles.find((m) => m.id === 'chest')!;
    expect(chest.primary).toBe(3);
    expect(
      chest.sets.map((set) => [set.workoutId, set.exerciseId, set.libraryId]),
    ).toEqual([
      ['one', 'exercise', 'barbell-bench-press'],
      ['one', 'repeat', 'barbell-bench-press'],
      ['variant', 'exercise', 'dumbbell-bench-press'],
    ]);
  });
  it('uses finished timestamps for legacy done rows, but never invents an active completion time', () => {
    const input = workout();
    input.exercises[0].sets = [
      {
        id: 'legacy',
        weight: '',
        reps: '',
        done: true,
      } as unknown as WorkoutSession['exercises'][number]['sets'][number],
    ];
    expect(
      projectMuscleParticipation([input], undefined, '7d', now).totalSets,
    ).toBe(1);
    expect(
      projectMuscleParticipation(
        [],
        { ...input, finishedAt: undefined },
        'workout',
        now,
      ).totalSets,
    ).toBe(0);
  });
  it('counts a recorded set once, while preserving separate muscle roles and provenance', () => {
    const input = workout();
    input.exercises[0].sets[0].otherSideReps = '8';
    const before = JSON.stringify(input);
    const result = projectMuscleParticipation([input], undefined, '7d', now);
    expect(result.totalSets).toBe(1);
    expect(result.muscles.find((m) => m.id === 'chest')).toMatchObject({
      primary: 1,
      secondary: 0,
    });
    expect(result.muscles.find((m) => m.id === 'triceps')).toMatchObject({
      primary: 0,
      secondary: 1,
    });
    expect(result.muscles.find((m) => m.id === 'chest')?.sets[0]).toMatchObject(
      {
        exerciseName: 'Saved name',
        setId: 'set',
        role: 'primary',
        otherSideReps: '8',
      },
    );
    expect(JSON.stringify(input)).toBe(before);
  });
  it('resolves aliases but never guesses unknown exercises from saved labels', () => {
    const result = projectMuscleParticipation(
      [workout('alias', 'bench'), workout('unknown', 'custom')],
      undefined,
      '7d',
      now,
    );
    expect(result.totalSets).toBe(2);
    expect(result.unmappedSets).toBe(1);
    expect(result.muscles.find((m) => m.id === 'chest')?.primary).toBe(1);
  });
  it('uses inclusive local-calendar 7 and 28 day boundaries and excludes future sessions', () => {
    const boundary = new Date(now);
    boundary.setDate(boundary.getDate() - 7);
    const older = new Date(now);
    older.setDate(older.getDate() - 28);
    const history = [
      workout('boundary', undefined, +boundary),
      workout('before', undefined, +boundary - 1),
      workout('older', undefined, +older),
      workout('future', undefined, now + 1),
    ];
    expect(
      projectMuscleParticipation(history, undefined, '7d', now).totalSets,
    ).toBe(1);
    expect(
      projectMuscleParticipation(history, undefined, '4w', now).totalSets,
    ).toBe(3);
  });
  it('uses the active workout, even if empty; otherwise the latest finished workout', () => {
    const active = { ...workout('active'), finishedAt: undefined };
    active.exercises[0].sets = [];
    expect(
      projectMuscleParticipation([workout()], active, 'workout', now),
    ).toMatchObject({ totalSets: 0, context: 'Current workout' });
    expect(
      projectMuscleParticipation(
        [workout('old', undefined, now - 2000), workout()],
        undefined,
        'workout',
        now,
      ),
    ).toMatchObject({ totalSets: 1, context: 'Latest completed workout' });
  });
  it('rejects incomplete, non-finite, pre-session and post-session set timestamps', () => {
    const input = workout();
    input.exercises[0].sets = [undefined, NaN, now - 1001, now + 1].map(
      (completedAt, index) => ({
        id: String(index),
        weight: '50',
        reps: '5',
        completedAt,
      }),
    );
    expect(
      projectMuscleParticipation([input], undefined, '7d', now).totalSets,
    ).toBe(0);
    expect(() => projectMuscleParticipation([], undefined, '7d', NaN)).toThrow(
      RangeError,
    );
  });
});
