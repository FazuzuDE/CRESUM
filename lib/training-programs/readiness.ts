import { cardioExerciseIds } from '../exercise-library';
import type { LibraryExercise } from '../workout-model';
import type { ProgramDefinition } from './model';
import { programSources } from './sources';
export const projectProgramReadiness = (
  program: ProgramDefinition,
  library: readonly LibraryExercise[],
) => {
  if (
    !program ||
    ![1, 2].includes(program.revision) ||
    ![
      'build_muscle',
      'get_stronger',
      'general_fitness',
      'lose_weight',
      'universal',
    ].includes(program.goal) ||
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
        !d.movements.length ||
        (d.hold !== undefined &&
          (!d.hold ||
            d.hold.exerciseId !== 'plank' ||
            !Number.isSafeInteger(d.hold.sets) ||
            d.hold.sets < 1 ||
            d.hold.sets > 20 ||
            !Number.isSafeInteger(d.hold.minSeconds) ||
            !Number.isSafeInteger(d.hold.maxSeconds) ||
            d.hold.minSeconds < 1 ||
            d.hold.maxSeconds < d.hold.minSeconds)),
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
        c.intensity !== 'moderate' ||
        (c.activity !== undefined &&
          !Object.hasOwn(cardioExerciseIds, c.activity)),
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
    (program.revision === 2 &&
      (program.days.length !== 3 ||
        program.schedule.length !== 1 ||
        !Array.isArray(program.schedule[0]) ||
        program.schedule[0].length !== 3 ||
        program.schedule[0].some(
          (slot, index) =>
            !slot ||
            slot.dayKey !== keys[index] ||
            program.days[index].movements.length +
              Number(!!program.days[index].hold) +
              Number(
                program.cardio.some(
                  (c) => c.offset === slot.offset && c.activity,
                ),
              ) !==
              6,
        ) ||
        program.cardio.some(
          (c) =>
            !c.activity ||
            !program.schedule[0].some((slot) => slot?.offset === c.offset),
        ))) ||
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
    ...new Set([
      ...program.cardio.flatMap(({ activity }) => {
        if (activity === undefined) return [];
        const id = cardioExerciseIds[activity];
        return library.some(
          (item) =>
            item.id === id &&
            item.movementPattern === 'cardio' &&
            item.measurement === 'duration',
        )
          ? []
          : [id];
      }),
      ...program.days.flatMap(({ hold }) =>
        hold &&
        !library.some(
          (e) => e.id === hold.exerciseId && e.measurement === 'duration',
        )
          ? [hold.exerciseId]
          : [],
      ),
      ...program.days
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
    ]),
  ];
  return { ready: blockers.length === 0, blockers };
};
