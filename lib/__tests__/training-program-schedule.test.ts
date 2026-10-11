import { makeAssignment } from '../training-programs/assignment';
import { selectProgram } from '../training-programs/selectors';
import {
  projectProgramWeek,
  templateForProgramSlot,
  adjustProgramSchedule,
} from '../training-programs/schedule';
import {
  startWorkout,
  updateSet,
  toggleSet,
  finishWorkout,
} from '../workout-engine';
import { exerciseLibrary } from '../exercise-library';
import { WorkoutRepository, emptyWorkoutState } from '../workout-repository';
const proposal = (start = '2026-12-29', reduced = false) =>
  makeAssignment(
    selectProgram('get_stronger', 'beginner')!,
    'week-1',
    start,
    reduced,
  );
it('anchors a Tuesday start across month/year rollover and alternates ABA to BAB', () => {
  const a = proposal();
  const first = projectProgramWeek(a, [], '2026-12-29');
  expect(first.slots.map((s) => s.date)).toEqual([
    '2026-12-29',
    '2026-12-31',
    '2027-01-02',
  ]);
  expect(first.slots.map((s) => s.dayKey)).toEqual(['A', 'B', 'A']);
  expect(
    projectProgramWeek(a, [], '2027-01-05').slots.map((s) => s.dayKey),
  ).toEqual(['B', 'A', 'B']);
  expect(first.days).toHaveLength(7);
});
it('uses calendar dates through daylight saving changes', () => {
  const a = proposal('2026-10-24');
  expect(
    projectProgramWeek(a, [], '2026-10-26').slots.map((s) => s.date),
  ).toEqual(['2026-10-24', '2026-10-26', '2026-10-28']);
  expect(projectProgramWeek(a, [], '2026-10-31').weekIndex).toBe(1);
});
it('requires explicit slot context to count real completion and retains multiple linked workouts', () => {
  const a = proposal();
  const slot = projectProgramWeek(a, [], '2026-12-29').slots[0];
  let actual = startWorkout(
    a.templates[0],
    exerciseLibrary,
    1000,
    () => Math.random().toString(),
    slot.context,
  );
  actual = updateSet(actual, 0, 0, { weight: '10', reps: '8' });
  actual = finishWorkout(toggleSet(actual, 0, 0, 2000).session, 3000);
  const manual = { ...actual, id: 'manual', programSlot: undefined };
  const week = projectProgramWeek(
    a,
    [actual, { ...actual, id: 'second' }, manual],
    '2026-12-30',
  );
  expect(week.slots[0].completedWorkoutIds).toEqual([actual.id, 'second']);
  expect(week.slots[1].completedWorkoutIds).toEqual([]);
});
it('keeps missing/edited routines unavailable and never doubles missed-session sets', () => {
  const a = proposal();
  const week = projectProgramWeek(a, [], '2027-01-02');
  expect(week.slots[0].missed).toBe(true);
  expect(() => templateForProgramSlot(a, [], week.slots[0])).toThrow();
  expect(() =>
    templateForProgramSlot(
      a,
      [{ ...a.templates[0], name: 'Edited' }],
      week.slots[0],
    ),
  ).toThrow();
  expect(
    templateForProgramSlot(
      a,
      a.templates,
      week.slots[2],
    ).plannedExercises?.reduce((n, m) => n + m.sets, 0),
  ).toBe(10);
});
it('validates schedule adjustments without dropping workouts or recovery gaps', () => {
  const a = proposal();
  expect(() => adjustProgramSchedule(a.program, [0, 1, 4])).toThrow();
  expect(() => adjustProgramSchedule(a.program, [0, 3])).toThrow();
  expect(
    adjustProgramSchedule(a.program, [1, 3, 5]).schedule[1].map(
      (s) => s.offset,
    ),
  ).toEqual([1, 3, 5]);
});
it('snapshots slot context through restart and applies an explicitly reduced first session only once', async () => {
  const a = makeAssignment(
    selectProgram('general_fitness', 'beginner')!,
    'reduce-1',
    '2026-10-11',
    true,
  );
  const first = projectProgramWeek(a, [], '2026-10-11').slots[0];
  const template = templateForProgramSlot(a, a.templates, first);
  expect(template.plannedExercises?.every((m) => m.sets === 1)).toBe(true);
  const second = projectProgramWeek(a, [], '2026-10-14').slots[1];
  expect(
    templateForProgramSlot(a, a.templates, second).plannedExercises?.every(
      (m) => m.sets === 2,
    ),
  ).toBe(true);
  const session = startWorkout(
    template,
    exerciseLibrary,
    1000,
    undefined,
    first.context,
  );
  const values = new Map<string, string>();
  const repo = new WorkoutRepository({
    getItem: async (k) => values.get(k) ?? null,
    setItem: async (k, v) => {
      values.set(k, v);
    },
  });
  await repo.save({ ...emptyWorkoutState(), activeWorkout: session });
  expect((await repo.load()).activeWorkout?.programSlot).toEqual(first.context);
  expect(a.templates[0].plannedExercises?.every((m) => m.sets === 2)).toBe(
    true,
  );
});
