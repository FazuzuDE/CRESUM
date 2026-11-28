import type {
  EquipmentId,
  MovementPatternId,
  MuscleId,
} from './exercise-taxonomy';
import type { CardioTimer } from './cardio-timer';

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
  entered?: true;
  plannedWeight?: true;
  plannedReps?: true;
  otherSideReps?: string;
};

export type ExerciseGroupSnapshot = {
  id: string;
  familyId: string;
  name: string;
};
export type PlannedSet = { id: string; weight?: string; reps?: string };

export type WorkoutExercise = {
  cardio?: CardioTimer;
  exerciseGroup?: ExerciseGroupSnapshot;
  id: string;
  libraryId: string;
  name: string;
  muscle: string;
  target?: PlannedTarget;
  plannedRestSeconds?: number;
  restOverrideSeconds?: number;
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
  baseRestSeconds?: number;
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
  exerciseGroup?: ExerciseGroupSnapshot;
  plannedSets?: PlannedSet[];
  exerciseId: string;
  sets: number;
  weight?: string;
  target?: PlannedTarget;
  restSeconds?: number;
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
  exerciseRestSeconds?: Record<string, number>;
  activeWorkout: WorkoutSession | null;
  history: WorkoutSession[];
  templates: WorkoutTemplate[];
};

export const isSetComplete = (set: WorkoutSet): boolean =>
  typeof set.completedAt === 'number';
