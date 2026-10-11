import type { WorkoutTemplate } from '../workout-model';
import type { ProgramDefinition } from './model';
import { projectProgramReadiness } from './readiness';
import { exerciseLibrary } from '../exercise-library';
export type ProgramAssignment = {
  id: string;
  program: ProgramDefinition;
  templates: WorkoutTemplate[];
  startDate: string;
  reducedFirstSession: boolean;
};
export const validLocalDate = (date: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [y, m, d] = date.split('-').map(Number);
  const parsed = new Date(y, m - 1, d, 12);
  return (
    parsed.getFullYear() === y &&
    parsed.getMonth() === m - 1 &&
    parsed.getDate() === d
  );
};
export const makeAssignment = (
  program: ProgramDefinition,
  id: string,
  startDate: string,
  reducedFirstSession = false,
): ProgramAssignment => {
  if (
    !/^[a-zA-Z0-9-]{1,80}$/.test(id) ||
    !validLocalDate(startDate) ||
    !projectProgramReadiness(program, exerciseLibrary).ready
  )
    throw Error(
      'Program proposal is unavailable. Review all required exercises and dates.',
    );
  const snapshot: ProgramDefinition = JSON.parse(JSON.stringify(program));
  return {
    id,
    program: snapshot,
    startDate,
    reducedFirstSession: Boolean(
      reducedFirstSession && snapshot.firstSessionSetCap,
    ),
    templates: snapshot.days.map((day) => ({
      id: `program-${id}-${day.key}`,
      name: `${snapshot.name} · ${day.name}`,
      exerciseIds: day.movements.map((m) => m.exerciseId),
      plannedExercises: day.movements.map((m) => ({
        exerciseId: m.exerciseId,
        sets: m.sets,
        target: {
          repMin: m.repMin,
          repMax: m.repMax,
          restMin: m.restMin,
          restMax: m.restMax,
          ...(m.perSide ? { perSide: true } : {}),
          programId: snapshot.id,
          revision: snapshot.revision,
          sourceRefs: [...m.sourceRefs],
        },
      })),
    })),
  };
};
