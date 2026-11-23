import { validLocalDate, type ProgramAssignment } from './assignment';
import type { ProgramDefinition } from './model';
import type {
  ProgramSlotContext,
  WorkoutSession,
  WorkoutTemplate,
} from '../workout-model';
import { findExercise } from '../exercise-library';
import { AppError } from '../app-error';
export const localDate = (date = new Date()): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const weekdayOffset = (date: Date): number => (date.getDay() + 6) % 7;

export function recurringProgramSchedule(
  program: ProgramDefinition,
  weekdays: readonly number[],
  today: Date,
) {
  if (weekdays.some((day) => !Number.isInteger(day) || day < 0 || day > 6))
    throw new AppError('program_schedule', 'Choose valid training weekdays.');
  const offset = weekdayOffset(today);
  const days = weekdays
    .map((day) => (day - offset + 7) % 7)
    .sort((a, b) => a - b);
  const first = days[0] ?? 0;
  return {
    startDate: addCalendarDays(localDate(today), first),
    program: adjustProgramSchedule(
      program,
      days.map((day) => day - first),
    ),
  };
}

export function timedActivitiesForWorkout(
  assignment: ProgramAssignment | null | undefined,
  session: WorkoutSession | null,
) {
  if (!assignment || !session || assignment.program.revision !== 2) return;
  const index = assignment.templates.findIndex(
    (template) => template.id === session.templateId,
  );
  if (index < 0) return;
  const day = assignment.program.days[index];
  const slot = assignment.program.schedule[0].find(
    ({ dayKey }) => dayKey === day.key,
  );
  return {
    hold: day.hold,
    cardio: assignment.program.cardio.find(
      ({ offset }) => offset === slot?.offset,
    ),
  };
}
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
    nextSlot: slots.find(
      (s) =>
        !s.completedWorkoutIds.length &&
        (a.program.revision === 1 || !s.missed),
    ),
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
    throw new AppError(
      'program_schedule',
      'Choose one date for every planned session. Alternative frequencies require a checked program.',
    );
  const adjusted: ProgramDefinition = JSON.parse(JSON.stringify(program));
  adjusted.schedule = adjusted.schedule.map((w) =>
    w.map((s, i) => ({ ...s, offset: offsets[i] })),
  );
  if (program.revision === 2) {
    adjusted.cardio = program.cardio.map((block) => ({
      ...block,
      offset:
        offsets[
          program.schedule[0].findIndex((slot) => slot.offset === block.offset)
        ],
    }));
    return adjusted;
  }
  const repeated = [...adjusted.schedule, ...adjusted.schedule].flatMap(
    (w, week) => w.map((s) => ({ ...s, absolute: week * 7 + s.offset })),
  );
  for (let i = 1; i < repeated.length; i++) {
    if (n < 4 && repeated[i].absolute - repeated[i - 1].absolute < 2)
      throw new AppError(
        'program_rest',
        'Keep at least one rest day between full-body sessions.',
      );
    const previous = repeated
      .slice(0, i)
      .reverse()
      .find((s) => s.dayKey === repeated[i].dayKey);
    if (n === 4 && previous && repeated[i].absolute - previous.absolute < 2)
      throw new AppError(
        'program_split_rest',
        'Keep recovery between repeated upper/lower sessions.',
      );
  }
  return adjusted;
};
