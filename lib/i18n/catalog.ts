import {
  canonicalExerciseId,
  exerciseLibrary,
  filterExercises,
  legacyExerciseIds,
  type ExerciseFilters,
} from '../exercise-library';
import type { LibraryExercise } from '../workout-model';
import { catalogs, type MessageCatalog } from './messages';
import type { AppLocale } from './registry';
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
export function searchLocalizedExercises(
  filters: ExerciseFilters,
  locale: AppLocale,
): LibraryExercise[] {
  const query = filters.query?.trim().toLocaleLowerCase(locale) ?? '';
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
    .filter((item) => {
      if (!query) return true;
      const aliases = Object.entries(legacyExerciseIds)
        .filter(([, canonical]) => canonical === item.id)
        .map(([alias]) => alias);
      return [
        item.name,
        catalogLabel(locale, 'exercise', item.id, item.name),
        ...aliases,
      ].some((name) => name.toLocaleLowerCase(locale).includes(query));
    });
}
