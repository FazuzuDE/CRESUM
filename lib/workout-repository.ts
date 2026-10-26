import { validPlanOrigin } from './workout-sharing/import';
import { validLocalDate } from './training-programs/assignment';
import type { ProgramSlotContext } from './workout-model';
import { defaultTemplates } from './workout-catalog';
import { WorkoutSession, WorkoutState, WorkoutTemplate } from './workout-model';
import {
  validPlannedExerciseShape,
  validPlannedTarget,
  validExerciseGroup,
} from './planned-exercise';
import { validGroupSequence } from './exercise-groups';
import { canonicalExerciseId } from './exercise-library';

// Stable on-device identifiers survive the CRESUM rebrand; renaming them
// without a data migration would hide existing workouts and history.
export const STATE_KEY = 'fitflow_state_v1';
export const LEGACY_KEYS = [
  'fitflow_history',
  'fitflow_active',
  'fitflow_templates',
] as const;

export type KeyValueStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;
const number = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;
const optionalNumber = (value: unknown) => value === undefined || number(value);
const string = (value: unknown): value is string => typeof value === 'string';
const invalid = (): never => {
  throw new Error(
    'Saved workout data could not be read. No data has been overwritten.',
  );
};

function parse(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return invalid();
  }
}

function template(value: unknown): WorkoutTemplate {
  if (
    !object(value) ||
    !string(value.id) ||
    !string(value.name) ||
    !Array.isArray(value.exerciseIds) ||
    !value.exerciseIds.every(string)
  )
    return invalid();
  if (value.origin !== undefined && !validPlanOrigin(value.origin))
    return invalid();
  const exerciseIds = value.exerciseIds as string[];
  let plannedExercises: WorkoutTemplate['plannedExercises'];
  if (value.plannedExercises !== undefined) {
    if (
      !Array.isArray(value.plannedExercises) ||
      !value.plannedExercises.every(validPlannedExerciseShape)
    )
      return invalid();
    const canonical = (id: string) => canonicalExerciseId(id) ?? id;
    const availableIds = new Set(exerciseIds.map(canonical));
    const ids = value.plannedExercises.map((item) =>
      canonical(item.exerciseId),
    );
    if (
      new Set(ids).size !== ids.length ||
      ids.some((id) => !availableIds.has(id))
    )
      return invalid();
    plannedExercises = value.plannedExercises.map((item) =>
      JSON.parse(JSON.stringify(item)),
    );
    if (
      !validGroupSequence(
        exerciseIds.map(
          (id) =>
            plannedExercises!.find(
              (e) =>
                (canonicalExerciseId(e.exerciseId) ?? e.exerciseId) ===
                (canonicalExerciseId(id) ?? id),
            ) ?? { exerciseId: id },
        ),
      )
    )
      return invalid();
  }
  return {
    id: value.id,
    name: value.name,
    ...(value.origin === undefined ? {} : { origin: { ...value.origin } }),
    exerciseIds,
    ...(plannedExercises === undefined ? {} : { plannedExercises }),
  };
}

type SessionKind = 'active' | 'history';

// Current v1 documents are strict: invalid nested data must stay untouched so a
// bad field can never silently reset an in-progress workout. Only the separate
// legacy-key migration below may fill fields that did not exist in that format.
function session(
  value: unknown,
  kind: SessionKind,
  legacy = false,
): WorkoutSession {
  if (
    !object(value) ||
    !string(value.id) ||
    !string(value.name) ||
    !number(value.startedAt) ||
    !optionalNumber(value.finishedAt) ||
    !optionalNumber(value.restEndsAt) ||
    !optionalNumber(value.restOverrideSeconds) ||
    !Array.isArray(value.exercises)
  )
    return invalid();
  if (value.programSlot !== undefined) {
    const slot = value.programSlot;
    if (
      !object(slot) ||
      !string(slot.assignmentId) ||
      !Number.isSafeInteger(slot.weekIndex) ||
      Number(slot.weekIndex) < 0 ||
      !Number.isSafeInteger(slot.slotIndex) ||
      Number(slot.slotIndex) < 0 ||
      !string(slot.date) ||
      !validLocalDate(slot.date)
    )
      return invalid();
  }
  const startedAt = value.startedAt;
  const finishedAt = value.finishedAt as number | undefined;
  if (
    (kind === 'active' && finishedAt !== undefined) ||
    (kind === 'history' &&
      (finishedAt === undefined ||
        finishedAt < startedAt ||
        value.restEndsAt !== undefined))
  )
    return invalid();
  const exercises = value.exercises.map((exercise) => {
    if (
      !object(exercise) ||
      !string(exercise.id) ||
      !string(exercise.name) ||
      !string(exercise.muscle) ||
      (!legacy && !string(exercise.libraryId)) ||
      (exercise.target !== undefined && !validPlannedTarget(exercise.target)) ||
      (exercise.exerciseGroup !== undefined &&
        !validExerciseGroup(exercise.exerciseGroup)) ||
      !Array.isArray(exercise.sets)
    )
      return invalid();
    return {
      id: exercise.id,
      libraryId: string(exercise.libraryId)
        ? exercise.libraryId
        : exercise.id.split('-')[0],
      name: exercise.name,
      muscle: exercise.muscle,
      ...(exercise.exerciseGroup === undefined
        ? {}
        : { exerciseGroup: { ...exercise.exerciseGroup } }),
      ...(exercise.target === undefined
        ? {}
        : { target: JSON.parse(JSON.stringify(exercise.target)) }),
      sets: exercise.sets.map((set) => {
        if (
          !object(set) ||
          !string(set.id) ||
          !string(set.weight) ||
          !string(set.reps) ||
          (set.otherSideReps !== undefined && !string(set.otherSideReps)) ||
          !optionalNumber(set.completedAt) ||
          (legacy
            ? set.done !== undefined && typeof set.done !== 'boolean'
            : set.done !== undefined)
        )
          return invalid();
        return {
          id: set.id,
          weight: legacy ? set.weight.replace(',', '.') : set.weight,
          reps: set.reps,
          ...(set.otherSideReps === undefined
            ? {}
            : { otherSideReps: set.otherSideReps as string }),
          completedAt:
            (set.completedAt as number | undefined) ??
            (legacy && set.done === true
              ? (finishedAt ?? startedAt)
              : undefined),
        };
      }),
    };
  });
  if (!validGroupSequence(exercises)) return invalid();
  if (
    !legacy &&
    (!Number.isInteger(value.currentExerciseIndex) ||
      !number(value.currentExerciseIndex) ||
      (exercises.length === 0
        ? value.currentExerciseIndex !== 0
        : value.currentExerciseIndex >= exercises.length) ||
      !Number.isInteger(value.restDurationSeconds) ||
      !number(value.restDurationSeconds) ||
      value.restDurationSeconds === 0 ||
      !string(value.templateId))
  )
    return invalid();
  const index = Number.isInteger(value.currentExerciseIndex)
    ? Number(value.currentExerciseIndex)
    : 0;
  return {
    id: value.id,
    ...(value.programSlot === undefined
      ? {}
      : { programSlot: { ...(value.programSlot as ProgramSlotContext) } }),
    name: value.name,
    templateId: string(value.templateId) ? value.templateId : 'legacy',
    startedAt,
    finishedAt,
    currentExerciseIndex: Math.max(0, Math.min(index, exercises.length - 1)),
    restDurationSeconds: number(value.restDurationSeconds)
      ? value.restDurationSeconds
      : 90,
    restEndsAt: value.restEndsAt as number | undefined,
    ...(value.restOverrideSeconds === undefined
      ? {}
      : { restOverrideSeconds: value.restOverrideSeconds as number }),
    exercises,
  };
}

// Shared strict Core reader for completed-history adapters; no storage access.
export const readCompletedWorkout = (value: unknown): WorkoutSession =>
  session(value, 'history');

export const emptyWorkoutState = (): WorkoutState => ({
  schemaVersion: 1,
  activeWorkout: null,
  history: [],
  templates: defaultTemplates,
});

function normalize(value: unknown, legacy = false): WorkoutState {
  if (
    !object(value) ||
    value.schemaVersion !== 1 ||
    (value.programInstallations !== undefined &&
      (!Array.isArray(value.programInstallations) ||
        !value.programInstallations.every(string))) ||
    !Array.isArray(value.history) ||
    !Array.isArray(value.templates)
  )
    return invalid();
  const history = value.history.map((item) => session(item, 'history', legacy));
  const active =
    value.activeWorkout === null
      ? null
      : session(value.activeWorkout, 'active', legacy);
  const historyIds = new Set(history.map((item) => item.id));
  if (historyIds.size !== history.length) return invalid();
  if (!legacy && active && historyIds.has(active.id)) return invalid();
  // A duplicated active/history session can only be recovered while importing
  // the pre-v1 multi-key format, where an interrupted finish was non-atomic.
  return {
    schemaVersion: 1,
    ...(value.programInstallations === undefined
      ? {}
      : {
          programInstallations: [...(value.programInstallations as string[])],
        }),
    history,
    activeWorkout: active && !historyIds.has(active.id) ? active : null,
    templates: value.templates.map(template),
  };
}

export class WorkoutRepository {
  private pending: Promise<void> = Promise.resolve();
  constructor(private readonly storage: KeyValueStorage) {}

  async load(): Promise<WorkoutState> {
    const raw = await this.storage.getItem(STATE_KEY);
    if (raw !== null) return normalize(parse(raw));
    const [history, active, templates] = await Promise.all(
      LEGACY_KEYS.map((key) => this.storage.getItem(key)),
    );
    const state = normalize(
      {
        schemaVersion: 1,
        history: history === null ? [] : parse(history),
        activeWorkout: active === null ? null : parse(active),
        templates: templates === null ? defaultTemplates : parse(templates),
      },
      true,
    );
    // One document commits history + active atomically; keep legacy keys as a backup.
    await this.save(state);
    return state;
  }

  save(state: WorkoutState): Promise<void> {
    const payload = JSON.stringify(state);
    const write = this.pending
      .catch(() => {})
      .then(() => this.storage.setItem(STATE_KEY, payload));
    this.pending = write;
    return write;
  }

  saveVerified(
    state: WorkoutState,
  ): Promise<{ saved: boolean; data: WorkoutState | null }> {
    const payload = JSON.stringify(state);
    const write = this.pending
      .catch(() => {})
      .then(async () => {
        try {
          await this.storage.setItem(STATE_KEY, payload);
          if ((await this.storage.getItem(STATE_KEY)) !== payload)
            throw Error('Readback mismatch');
          return { saved: true, data: state };
        } catch {
          // Recovery reads remain inside the write queue; reset must drain them too.
          try {
            const raw = await this.storage.getItem(STATE_KEY);
            return { saved: false, data: raw === payload ? state : null };
          } catch {
            return { saved: false, data: null };
          }
        }
      });
    this.pending = write.then(() => {});
    return write;
  }

  async waitForWrites(): Promise<void> {
    // A failed write is still settled; reset intentionally removes local data.
    await this.pending.catch(() => undefined);
  }
}
