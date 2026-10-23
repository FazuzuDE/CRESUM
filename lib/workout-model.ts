import type {
  EquipmentId,
  MovementPatternId,
  MuscleId,
} from './exercise-taxonomy';

export type ExerciseTarget = {
  repMin: number;
  repMax: number;
  restMin: number;
  restMax: number;
  perSide?: boolean;
  programId: string;
  revision: number;
  sourceRefs: string[];
};
export type AuthoredTarget = {
  kind: 'authored';
  repMin: number;
  repMax: number;
  restMin: number;
  restMax: number;
  perSide?: boolean;
};
export type PlannedTarget = ExerciseTarget | AuthoredTarget;
export type WorkoutSet = {
  id: string;
  weight: string;
  reps: string;
  completedAt?: number;
  otherSideReps?: string;
};

export type WorkoutExercise = {
  id: string;
  libraryId: string;
  name: string;
  muscle: string;
  target?: PlannedTarget;
  sets: WorkoutSet[];
};

export type ProgramSlotContext = {
  assignmentId: string;
  weekIndex: number;
  slotIndex: number;
  date: string;
};
export type WorkoutSession = {
  programSlot?: ProgramSlotContext;
  id: string;
  templateId: string;
  name: string;
  startedAt: number;
  finishedAt?: number;
  currentExerciseIndex: number;
  restDurationSeconds: number;
  restOverrideSeconds?: number;
  restEndsAt?: number;
  exercises: WorkoutExercise[];
};

export type PlanOrigin = { publicationId: string; version: number };
export type WorkoutTemplate = {
  origin?: PlanOrigin;
  id: string;
  name: string;
  exerciseIds: string[];
  plannedExercises?: PlannedExercise[];
};

export type PlannedExercise = {
  exerciseId: string;
  sets: number;
  weight?: string;
  target?: PlannedTarget;
};

export type LibraryExercise = {
  id: string;
  name: string;
  primaryMuscles: readonly MuscleId[];
  secondaryMuscles: readonly MuscleId[];
  equipment: readonly EquipmentId[];
  movementPattern: MovementPatternId;
  imageKey: string;
  perSide?: boolean;
  measurement?: 'repetitions' | 'duration' | 'distance';
};

export type WorkoutState = {
  schemaVersion: 1;
  programInstallations?: string[];
  activeWorkout: WorkoutSession | null;
  history: WorkoutSession[];
  templates: WorkoutTemplate[];
};

export const isSetComplete = (set: WorkoutSet): boolean =>
  typeof set.completedAt === 'number';
