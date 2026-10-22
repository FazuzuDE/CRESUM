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
} as const;
type ErrorKey =
  (typeof errorMessages)[keyof typeof errorMessages] | 'error.workoutOperation';
export function presentAppError(
  t: Translate,
  error: unknown,
  fallback: ErrorKey,
): string {
  const key = error instanceof AppError ? errorMessages[error.code] : fallback;
  return t(key);
}
