// Domain-owned codes; diagnostic text stays independent from UI language.
export type AppErrorCode =
  | 'invalid_set_values'
  | 'invalid_set_entry'
  | 'empty_workout'
  | 'invalid_finish_time'
  | 'workout_load_failed'
  | 'workout_unsaved'
  | 'workout_discard_failed'
  | 'workout_save_failed'
  | 'template_save_failed'
  | 'name_required'
  | 'invalid_birth_date'
  | 'invalid_height'
  | 'invalid_body_weight'
  | 'invalid_age'
  | 'program_under18'
  | 'program_frequency'
  | 'program_missing_exercises'
  | 'program_selection'
  | 'program_proposal'
  | 'program_schedule'
  | 'program_rest'
  | 'program_split_rest'
  | 'auth_generic'
  | 'auth_send'
  | 'auth_verify'
  | 'auth_sign_out'
  | 'auth_rate'
  | 'auth_connection'
  | 'auth_recovery'
  | 'auth_setup'
  | 'auth_session'
  | 'auth_partial_sign_out'
  | 'deletion_unavailable'
  | 'deletion_account'
  | 'deletion_cleanup'
  | 'deletion_pending'
  | 'backup_invalid'
  | 'backup_too_large'
  | 'backup_share'
  | 'backup_read'
  | 'backup_restore'
  | 'backup_pending'
  | 'backup_busy'
  | 'backup_active'
  | 'backup_unsaved'
  | 'backup_no_saved'
  | 'local_recovery'
  | 'reset_incomplete'
  | 'reset_recovered'
  | 'reset_untouched';
export class AppError extends Error {
  constructor(
    readonly code: AppErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
