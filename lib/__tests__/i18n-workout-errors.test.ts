import { AppError } from '../app-error';
import { presentAppError } from '../i18n/errors';
import { createTranslator } from '../i18n/engine';
import { WorkoutStore } from '../workout-store';
import { WorkoutRepository } from '../workout-repository';
it('preserves a structured load failure while retaining the existing diagnostic snapshot', async () => {
  const store = new WorkoutStore(
    new WorkoutRepository({
      getItem: async () => {
        throw Error('secret');
      },
      setItem: async () => {},
    }),
  );
  await store.load();
  expect(store.getSnapshot().error).toContain('Could not load saved workouts');
  expect(
    presentAppError(
      createTranslator('ru'),
      store.getErrorProblems()[0],
      'error.workoutOperation',
    ),
  ).toContain('Не удалось загрузить тренировки');
});
it('translates stable app codes and never exposes arbitrary diagnostic messages', () => {
  const t = createTranslator('de');
  const error = new AppError('invalid_set_values', 'internal diagnostic');
  expect(presentAppError(t, error, 'error.workoutOperation')).toBe(
    'Gib ein gültiges Gewicht und eine ganze Wiederholungszahl ein.',
  );
  expect(
    presentAppError(
      t,
      Error('SECRET backend detail'),
      'error.workoutOperation',
    ),
  ).not.toContain('SECRET');
});
