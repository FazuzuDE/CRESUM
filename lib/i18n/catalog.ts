import {
  canonicalExerciseId,
  exerciseLibrary,
  filterExercises,
  findExercise,
  type ExerciseFilters,
} from '../exercise-library';
import type { LibraryExercise, WorkoutExercise } from '../workout-model';
import { muscleTaxonomy } from '../exercise-taxonomy';
import { catalogs, type MessageCatalog } from './messages';
import type { AppLocale } from './registry';
import { exerciseSearchScore, prepareExerciseQuery } from './search/engine';
export function catalogLabel(
  locale: AppLocale,
  kind: 'exercise' | 'muscle' | 'equipment' | 'program' | 'template',
  id: string,
  fallback: string,
): string {
  const canonical = kind === 'exercise' ? canonicalExerciseId(id) : id;
  if (!canonical) return fallback;
  const value = (catalogs[locale] as MessageCatalog)[
    `catalog.${kind}.${canonical}`
  ];
  return typeof value === 'string' ? value : fallback;
}

export function workoutExerciseLabel(
  locale: AppLocale,
  exercise: Pick<WorkoutExercise, 'libraryId' | 'name'>,
): string {
  const canonical = findExercise(exercise.libraryId);
  return canonical?.name === exercise.name
    ? catalogLabel(locale, 'exercise', canonical.id, exercise.name)
    : exercise.name;
}

export function workoutMuscleLabel(locale: AppLocale, name: string): string {
  const muscle = muscleTaxonomy.find(({ label }) => label === name);
  return muscle ? catalogLabel(locale, 'muscle', muscle.id, name) : name;
}
export function searchLocalizedExercises(
  filters: ExerciseFilters,
  locale: AppLocale,
): LibraryExercise[] {
  const query = prepareExerciseQuery(filters.query ?? '');
  // Both concrete identities persist normally; only the library listing is grouped.
  const visible = exerciseLibrary.filter(
    (x) => x.id !== 'kettlebell-goblet-squat',
  );
  return filterExercises(
    visible.map((x) =>
      x.id === 'goblet-squat'
        ? { ...x, equipment: ['dumbbell', 'kettlebell'] }
        : x,
    ),
    {
      ...filters,
      query: undefined,
    },
  )
    .map((item) => exerciseLibrary.find((x) => x.id === item.id)!)
    .map((item) => ({
      item,
      score: Math.max(
        exerciseSearchScore(item.id, query, locale),
        item.id === 'goblet-squat'
          ? exerciseSearchScore('kettlebell-goblet-squat', query, locale)
          : 0,
      ),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}
