import { validLocalDate, type ProgramAssignment } from './assignment';
import type { ProgramDefinition } from './model';
import type {
  ProgramSlotContext,
  WorkoutSession,
  WorkoutTemplate,
} from '../workout-model';
import { findExercise } from '../exercise-library';
export const localDate = (date = new Date()): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const addCalendarDays = (date: string, days: number): string => {
  if (!validLocalDate(date)) throw Error('Invalid local date');
  const [y, m, d] = date.split('-').map(Number);
  const next = new Date(y, m - 1, d, 12);
  next.setDate(next.getDate() + days);
  return localDate(next);
};
const ordinal = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / 86400000;
};
export type ProjectedProgramSlot = {
  date: string;
  dayKey: string;
  templateId: string;
  missed: boolean;
  completedWorkoutIds: string[];
  context: ProgramSlotContext;
};
export const projectProgramWeek = (
  a: ProgramAssignment,
  history: readonly WorkoutSession[],
  date: string,
) => {
  if (!validLocalDate(date)) throw Error('Invalid local date');
  const weekIndex = Math.max(
    0,
    Math.floor((ordinal(date) - ordinal(a.startDate)) / 7),
  );
  const start = addCalendarDays(a.startDate, weekIndex * 7);
  const schedule = a.program.schedule[weekIndex % a.program.schedule.length];
  const slots: ProjectedProgramSlot[] = schedule.map((s, slotIndex) => {
    const scheduledDate = addCalendarDays(start, s.offset);
    const context = {
      assignmentId: a.id,
      weekIndex,
      slotIndex,
      date: scheduledDate,
    };
    const completedWorkoutIds = history
      .filter(
        (h) =>
          h.finishedAt !== undefined &&
          h.exercises.some((e) =>
            e.sets.some((set) => set.completedAt !== undefined),
          ) &&
          h.programSlot?.assignmentId === a.id &&
          h.programSlot.weekIndex === weekIndex &&
          h.programSlot.slotIndex === slotIndex &&
          h.programSlot.date === scheduledDate,
      )
      .map((h) => h.id);
    return {
      date: scheduledDate,
      dayKey: s.dayKey,
      templateId: `program-${a.id}-${s.dayKey}`,
      context,
      completedWorkoutIds,
      missed: scheduledDate < date && !completedWorkoutIds.length,
    };
  });
  const days = Array.from({ length: 7 }, (_, offset) => ({
    date: addCalendarDays(start, offset),
    slot: slots.find((s) => s.date === addCalendarDays(start, offset)),
    cardio: a.program.cardio.filter((c) => c.offset === offset),
  }));
  return {
    weekIndex,
    slots,
    days,
    nextSlot: slots.find((s) => !s.completedWorkoutIds.length),
  };
};
export const templateForProgramSlot = (
  a: ProgramAssignment,
  templates: readonly WorkoutTemplate[],
  slot: ProjectedProgramSlot,
): WorkoutTemplate => {
  const expected = a.templates.find((t) => t.id === slot.templateId);
  const matches = templates.filter((t) => t.id === slot.templateId);
  if (
    !expected ||
    matches.length !== 1 ||
    JSON.stringify(matches[0]) !== JSON.stringify(expected) ||
    expected.exerciseIds.some((id) => !findExercise(id))
  )
    throw Error(
      'This program routine was edited, deleted or is unavailable. Review workouts in Profile; manual workouts remain available.',
    );
  const template: WorkoutTemplate = JSON.parse(JSON.stringify(matches[0]));
  if (
    a.reducedFirstSession &&
    a.program.firstSessionSetCap &&
    slot.context.weekIndex === 0 &&
    slot.context.slotIndex === 0
  )
    template.plannedExercises = template.plannedExercises?.map((m) => ({
      ...m,
      sets: Math.min(m.sets, a.program.firstSessionSetCap!),
    }));
  return template;
};
export const adjustProgramSchedule = (
  program: ProgramDefinition,
  offsets: number[],
): ProgramDefinition => {
  const n = program.schedule[0].length;
  if (
    offsets.length !== n ||
    offsets.some(
      (x, i) =>
        !Number.isInteger(x) ||
        x < 0 ||
        x > 6 ||
        (i > 0 && x <= offsets[i - 1]),
    )
  )
    throw Error(
      'Choose one date for every planned session. Alternative frequencies require a checked program.',
    );
  const adjusted: ProgramDefinition = JSON.parse(JSON.stringify(program));
  adjusted.schedule = adjusted.schedule.map((w) =>
    w.map((s, i) => ({ ...s, offset: offsets[i] })),
  );
  const repeated = [...adjusted.schedule, ...adjusted.schedule].flatMap(
    (w, week) => w.map((s) => ({ ...s, absolute: week * 7 + s.offset })),
  );
  for (let i = 1; i < repeated.length; i++) {
    if (n < 4 && repeated[i].absolute - repeated[i - 1].absolute < 2)
      throw Error('Keep at least one rest day between full-body sessions.');
    const previous = repeated
      .slice(0, i)
      .reverse()
      .find((s) => s.dayKey === repeated[i].dayKey);
    if (n === 4 && previous && repeated[i].absolute - previous.absolute < 2)
      throw Error('Keep recovery between repeated upper/lower sessions.');
  }
  return adjusted;
};
