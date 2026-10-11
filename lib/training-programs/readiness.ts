import type { LibraryExercise } from '../workout-model';
import type { ProgramDefinition } from './model';
export const projectProgramReadiness = (
  program: ProgramDefinition,
  library: readonly LibraryExercise[],
) => {
  const blockers = [
    ...new Set(
      program.days
        .flatMap((d) => d.movements)
        .filter((m) => {
          const e = library.find((e) => e.id === m.exerciseId);
          return (
            !e ||
            Boolean(e.perSide) !== Boolean(m.perSide) ||
            m.sets < 1 ||
            m.sets > 20 ||
            m.repMin < 1 ||
            m.repMax < m.repMin ||
            m.restMin < 1 ||
            m.restMax < m.restMin
          );
        })
        .map((m) => m.exerciseId),
    ),
  ];
  return { ready: blockers.length === 0, blockers };
};
