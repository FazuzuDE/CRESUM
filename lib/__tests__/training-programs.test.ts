import { trainingPrograms } from '../training-programs/catalog';
import { selectProgram } from '../training-programs/selectors';
import { projectProgramReadiness } from '../training-programs/readiness';
import { exerciseLibrary } from '../exercise-library';

const rows = [
  ['build_muscle', 'beginner', 48, 3],
  ['build_muscle', 'some', 63, 3],
  ['build_muscle', 'experienced', 68, 4],
  ['get_stronger', 'beginner', 30, 3],
  ['get_stronger', 'some', 29, 3],
  ['get_stronger', 'experienced', 31, 3],
  ['general_fitness', 'beginner', 28, 2],
  ['general_fitness', 'some', 28, 2],
  ['general_fitness', 'experienced', 42, 2],
] as const;
it('has exactly the nine authored variants', () =>
  expect(trainingPrograms).toHaveLength(9));
it.each(rows)(
  'preserves %s/%s weekly prescriptions',
  (goal, experience, sets, days) => {
    const p = selectProgram(goal, experience);
    expect(p).toBeDefined();
    expect(p!.schedule[0]).toHaveLength(days);
    expect(
      p!.schedule[0].reduce(
        (n, slot) =>
          n +
          p!.days
            .find((d) => d.key === slot.dayKey)!
            .movements.reduce((a, m) => a + m.sets, 0),
        0,
      ),
    ).toBe(sets);
    expect(p!.environment).toBe('gym');
    expect(
      p!.days.flatMap((d) => d.movements).every((m) => m.sourceRefs.length > 0),
    ).toBe(true);
    expect(projectProgramReadiness(p!, exerciseLibrary).ready).toBe(true);
  },
);
it('alternates beginner strength for the second week', () => {
  const p = selectProgram('get_stronger', 'beginner')!;
  expect(p.schedule.map((w) => w.map((s) => s.dayKey))).toEqual([
    ['A', 'B', 'A'],
    ['B', 'A', 'B'],
  ]);
});
it('retains all prescriptions when any mapping is unavailable', () => {
  const p = selectProgram('build_muscle', 'some')!;
  const before = JSON.stringify(p);
  const status = projectProgramReadiness(
    p,
    exerciseLibrary.filter(
      (e) => e.id !== 'standing-cable-anti-rotation-press',
    ),
  );
  expect(status.ready).toBe(false);
  expect(status.blockers).toContain('standing-cable-anti-rotation-press');
  expect(JSON.stringify(p)).toBe(before);
});
it('keeps strength targets and cardio guidance separate from inferred weight', () => {
  const strength = selectProgram('get_stronger', 'experienced')!;
  expect(strength.days[0].movements[0]).toMatchObject({
    sets: 3,
    repMin: 3,
    repMax: 5,
  });
  const fitness = selectProgram('general_fitness', 'beginner')!;
  expect(fitness.cardio.map((g) => g.minutes).reduce((a, b) => a + b, 0)).toBe(
    150,
  );
  expect(
    fitness.days.flatMap((d) => d.movements).some((m) => 'weight' in m),
  ).toBe(false);
});
