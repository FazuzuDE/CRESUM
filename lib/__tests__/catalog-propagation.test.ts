import { resolveExerciseArtwork } from '../exercise-artwork';
import {
  cardioExerciseIds,
  exerciseLibrary,
  isManualWorkoutExercise,
} from '../exercise-library';
import { searchLocalizedExercises } from '../i18n/catalog';
import { localeRegistry, type AppLocale } from '../i18n/registry';
import { searchAliases } from '../i18n/search/aliases';
import { findMuscleExercises } from '../muscle-exercise-discovery';

const libraryCardId = (id: string) =>
  id === 'kettlebell-goblet-squat' ? 'goblet-squat' : id;

it('projects the whole catalog to browse, search and equipment filters in every app language', () => {
  const expected = [
    ...new Set(exerciseLibrary.map(({ id }) => libraryCardId(id))),
  ].sort();
  for (const locale of Object.keys(localeRegistry) as AppLocale[]) {
    expect(
      searchLocalizedExercises({}, locale)
        .map(({ id }) => id)
        .sort(),
    ).toEqual(expected);
    for (const exercise of exerciseLibrary) {
      const id = libraryCardId(exercise.id);
      const alias = searchAliases[locale].exercise[exercise.id][0];
      expect(
        searchLocalizedExercises({ query: alias }, locale).map((row) => row.id),
      ).toContain(id);
    }
  }

  for (const exercise of exerciseLibrary) {
    for (const equipment of exercise.equipment) {
      expect(
        searchLocalizedExercises({ equipment }, 'en').map(({ id }) => id),
      ).toContain(libraryCardId(exercise.id));
    }
  }
});

it('projects every declared muscle role to exercise discovery', () => {
  for (const exercise of exerciseLibrary) {
    for (const muscle of [
      ...exercise.primaryMuscles,
      ...exercise.secondaryMuscles,
    ]) {
      expect(
        findMuscleExercises(new Set([muscle]), 'any').map(
          (result) => result.exercise.id,
        ),
      ).toContain(exercise.id);
    }
  }
});

it('requires both artwork phases for both characters for new catalog records', () => {
  const legacyWithoutArtwork = new Set(['seated-cable-row', 'lat-pulldown']);
  const missing = exerciseLibrary.flatMap(({ id, imageKey }) => {
    if (legacyWithoutArtwork.has(id)) return [];
    return (['male', 'female'] as const).flatMap((model) =>
      (['start', 'finish'] as const)
        .filter((phase) => !resolveExerciseArtwork(imageKey, phase, model))
        .map((phase) => ({ id, model, phase })),
    );
  });
  expect(missing).toEqual([]);
});

it('selects exercises by their logging mode while keeping existing saved workflows usable', () => {
  const expected = exerciseLibrary
    .filter(
      ({ movementPattern, measurement, id }) =>
        (movementPattern !== 'cardio' && measurement === 'repetitions') ||
        id === 'plank' ||
        id === 'farmers-carry',
    )
    .map(({ id }) => id);
  expect(
    exerciseLibrary.filter(isManualWorkoutExercise).map(({ id }) => id),
  ).toEqual(expected);
  expect(
    isManualWorkoutExercise({
      id: 'new-duration-exercise',
      measurement: 'duration',
      movementPattern: 'isolation',
    }),
  ).toBe(false);
  for (const id of Object.values(cardioExerciseIds)) {
    expect(exerciseLibrary.find((entry) => entry.id === id)).toMatchObject({
      movementPattern: 'cardio',
      measurement: 'duration',
    });
  }
});
