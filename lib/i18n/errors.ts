import { AppError } from '../app-error';
import type { Translate } from './messages';
const errorMessages = {
  reset_incomplete: 'error.resetIncomplete',
  reset_recovered: 'error.resetRecovered',
  reset_untouched: 'error.resetUntouched',
  auth_generic: 'error.authGeneric',
  auth_send: 'error.authSend',
  auth_verify: 'error.authVerify',
  auth_sign_out: 'error.authSignOut',
  auth_rate: 'error.authRate',
  auth_connection: 'error.authConnection',
  auth_recovery: 'error.authRecovery',
  auth_setup: 'error.authSetup',
  auth_session: 'error.authSession',
  auth_partial_sign_out: 'error.authPartialSignOut',
  deletion_unavailable: 'error.deletionUnavailable',
  deletion_account: 'error.deletionAccount',
  deletion_cleanup: 'error.deletionCleanup',
  deletion_pending: 'error.deletionPending',
  backup_invalid: 'error.backupInvalid',
  backup_too_large: 'error.backupTooLarge',
  backup_share: 'error.backupShare',
  backup_read: 'error.backupRead',
  backup_restore: 'error.backupRestore',
  backup_pending: 'error.backupPending',
  backup_busy: 'error.backupBusy',
  backup_active: 'error.backupActive',
  backup_unsaved: 'error.backupUnsaved',
  backup_no_saved: 'error.backupNoSaved',
  local_recovery: 'error.localRecovery',
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
  | 'error.programSave'
  | 'error.backupOpen'
  | 'error.backupSettings'
  | 'error.localOperation'
  | 'error.reset';
// Unknown diagnostics use a presentation fallback rather than their raw text.
export function presentAppError(
  t: Translate,
  error: unknown,
  fallback: ErrorKey,
): string {
  const key = error instanceof AppError ? errorMessages[error.code] : fallback;
  return t(key);
}
