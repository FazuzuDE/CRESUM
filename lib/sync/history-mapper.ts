import type {
  PlannedTarget,
  ProgramSlotContext,
  WorkoutSession,
  ExerciseGroupSnapshot,
} from '../workout-model';
import { readCompletedWorkout } from '../workout-repository';

export type CloudHistoryWorkout = {
  workout_id: string;
  template_id: string;
  name: string;
  started_at_ms: number;
  finished_at_ms: number;
  current_exercise_index: number;
  rest_duration_seconds: number;
  rest_override_seconds: number | null;
  program_slot: ProgramSlotContext | null;
  exercises: {
    exercise_index: number;
    exercise_id: string;
    library_id: string;
    name: string;
    muscle: string;
    target: PlannedTarget | null;
    exercise_group?: ExerciseGroupSnapshot;
    sets: {
      set_index: number;
      set_id: string;
      weight: string;
      reps: string;
      other_side_reps: string | null;
      completed_at_ms: number | null;
    }[];
  }[];
};
const invalid = (): never => {
  throw new Error('Invalid completed history snapshot.');
};
const record = (v: unknown): Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : invalid();
const array = (v: unknown): unknown[] => (Array.isArray(v) ? v : invalid());

export function encodeHistoryWorkout(
  value: WorkoutSession,
): CloudHistoryWorkout {
  const w = readCompletedWorkout(value);
  return {
    workout_id: w.id,
    template_id: w.templateId,
    name: w.name,
    started_at_ms: w.startedAt,
    finished_at_ms: w.finishedAt!,
    current_exercise_index: w.currentExerciseIndex,
    rest_duration_seconds: w.restDurationSeconds,
    rest_override_seconds: w.restOverrideSeconds ?? null,
    program_slot: w.programSlot ?? null,
    exercises: w.exercises.map((e, exercise_index) => ({
      exercise_index,
      exercise_id: e.id,
      library_id: e.libraryId,
      name: e.name,
      muscle: e.muscle,
      target: e.target ?? null,
      ...(e.exerciseGroup ? { exercise_group: { ...e.exerciseGroup } } : {}),
      sets: e.sets.map((s, set_index) => ({
        set_index,
        set_id: s.id,
        weight: s.weight,
        reps: s.reps,
        other_side_reps: s.otherSideReps ?? null,
        completed_at_ms: s.completedAt ?? null,
      })),
    })),
  };
}
export function decodeHistoryWorkout(value: unknown): WorkoutSession {
  const w = record(value);
  return readCompletedWorkout({
    id: w.workout_id,
    templateId: w.template_id,
    name: w.name,
    startedAt: w.started_at_ms,
    finishedAt: w.finished_at_ms,
    currentExerciseIndex: w.current_exercise_index,
    restDurationSeconds: w.rest_duration_seconds,
    ...(w.rest_override_seconds == null
      ? {}
      : { restOverrideSeconds: w.rest_override_seconds }),
    ...(w.program_slot == null ? {} : { programSlot: w.program_slot }),
    exercises: array(w.exercises).map((item, i) => {
      const e = record(item);
      if (e.exercise_index !== i) return invalid();
      return {
        id: e.exercise_id,
        libraryId: e.library_id,
        name: e.name,
        muscle: e.muscle,
        ...(e.exercise_group == null
          ? {}
          : { exerciseGroup: e.exercise_group }),
        ...(e.target == null ? {} : { target: e.target }),
        sets: array(e.sets).map((item, j) => {
          const s = record(item);
          if (s.set_index !== j) return invalid();
          return {
            id: s.set_id,
            weight: s.weight,
            reps: s.reps,
            ...(s.other_side_reps == null
              ? {}
              : { otherSideReps: s.other_side_reps }),
            ...(s.completed_at_ms == null
              ? {}
              : { completedAt: s.completed_at_ms }),
          };
        }),
      };
    }),
  });
}
