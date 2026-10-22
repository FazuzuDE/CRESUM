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
  | 'program_split_rest';
export class AppError extends Error {
  constructor(
    readonly code: AppErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
