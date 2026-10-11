import type { LibraryExercise } from '../workout-model';
import type { ProgramDefinition } from './model';
import { programSources } from './sources';
export const projectProgramReadiness = (
  program: ProgramDefinition,
  library: readonly LibraryExercise[],
) => {
  if (
    !program ||
    program.revision !== 1 ||
    !['build_muscle', 'get_stronger', 'general_fitness'].includes(
      program.goal,
    ) ||
    !['beginner', 'some', 'experienced'].includes(program.experience) ||
    program.environment !== 'gym' ||
    typeof program.id !== 'string' ||
    typeof program.name !== 'string' ||
    !Array.isArray(program.days) ||
    !program.days.length ||
    !Array.isArray(program.schedule) ||
    ![1, 2].includes(program.schedule.length) ||
    !Array.isArray(program.cardio)
  )
    return { ready: false, blockers: ['Invalid program'] };
  if (
    program.days.some(
      (d) =>
        !d ||
        typeof d.key !== 'string' ||
        !d.key ||
        typeof d.name !== 'string' ||
        !Array.isArray(d.movements) ||
        !d.movements.length,
    ) ||
    program.cardio.some(
      (c) =>
        !c ||
        !Number.isInteger(c.offset) ||
        c.offset < 0 ||
        c.offset > 6 ||
        !Number.isSafeInteger(c.minutes) ||
        c.minutes < 1 ||
        c.minutes > 1440 ||
        c.intensity !== 'moderate',
    ) ||
    new Set(program.cardio.map((c) => c.offset)).size !==
      program.cardio.length ||
    (program.firstSessionSetCap !== undefined &&
      (!Number.isSafeInteger(program.firstSessionSetCap) ||
        program.firstSessionSetCap < 1 ||
        program.firstSessionSetCap > 20))
  )
    return { ready: false, blockers: ['Invalid program'] };
  const keys = program.days.map((d) => d.key);
  if (
    new Set(keys).size !== keys.length ||
    program.days.some(
      (d) => !Array.isArray(d.movements) || !d.movements.length,
    ) ||
    program.schedule.some(
      (w) =>
        !Array.isArray(w) ||
        !w.length ||
        w.some((s) => !s || typeof s.dayKey !== 'string') ||
        new Set(w.map((s) => s.offset)).size !== w.length ||
        w.some(
          (s, i) =>
            !keys.includes(s.dayKey) ||
            !Number.isInteger(s.offset) ||
            s.offset < 0 ||
            s.offset > 6 ||
            (i > 0 && s.offset <= w[i - 1].offset),
        ),
    )
  )
    return { ready: false, blockers: ['Invalid schedule'] };
  const blockers = [
    ...new Set(
      program.days
        .flatMap((d) => d.movements)
        .filter((m) => {
          if (!m || typeof m.exerciseId !== 'string') return true;
          const e = library.find((e) => e.id === m.exerciseId);
          return (
            !e ||
            e.measurement !== 'repetitions' ||
            !['sets', 'repMin', 'repMax', 'restMin', 'restMax'].every((k) =>
              Number.isSafeInteger(m[k as 'sets']),
            ) ||
            !Array.isArray(m.sourceRefs) ||
            !m.sourceRefs.length ||
            m.sourceRefs.some(
              (id) => !programSources.some((s) => s.id === id),
            ) ||
            Boolean(e.perSide) !== Boolean(m.perSide) ||
            m.sets < 1 ||
            m.sets > 20 ||
            m.repMin < 1 ||
            m.repMax < m.repMin ||
            m.restMin < 1 ||
            m.restMax < m.restMin ||
            m.restMax > 3600
          );
        })
        .map((m) => m?.exerciseId ?? 'Invalid movement'),
    ),
  ];
  return { ready: blockers.length === 0, blockers };
};
