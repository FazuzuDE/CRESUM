import { AppError } from '../app-error';
import type { Translate } from './messages';
const errorMessages = {
  invalid_set_values: 'error.invalidSet',
  invalid_set_entry: 'error.invalidEntry',
  empty_workout: 'error.noSets',
  invalid_finish_time: 'error.finishTime',
  workout_load_failed: 'error.workoutLoad',
  workout_unsaved: 'error.workoutUnsaved',
  workout_discard_failed: 'error.workoutDiscard',
  workout_save_failed: 'error.workoutSave',
  template_save_failed: 'error.templateSave',
  name_required: 'error.nameRequired',
  invalid_birth_date: 'error.birthDate',
  invalid_height: 'error.height',
  invalid_body_weight: 'error.bodyWeight',
  invalid_age: 'error.age',
  program_under18: 'error.under18',
  program_frequency: 'error.programFrequency',
  program_missing_exercises: 'error.programMissing',
  program_selection: 'error.programSelection',
  program_proposal: 'error.programProposal',
  program_schedule: 'error.programSchedule',
  program_rest: 'error.programRest',
  program_split_rest: 'error.programSplitRest',
} as const;
type ErrorKey =
  | (typeof errorMessages)[keyof typeof errorMessages]
  | 'error.workoutOperation'
  | 'error.programSave';
export function presentAppError(
  t: Translate,
  error: unknown,
  fallback: ErrorKey,
): string {
  const key = error instanceof AppError ? errorMessages[error.code] : fallback;
  return t(key);
}
