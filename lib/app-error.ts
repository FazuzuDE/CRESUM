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
  | 'template_save_failed';
export class AppError extends Error {
  constructor(
    readonly code: AppErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
