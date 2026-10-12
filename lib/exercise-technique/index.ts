import { canonicalExerciseId } from '../exercise-library';
import { techniqueCatalog } from './catalog';
import type { ExerciseTechnique } from './types';
export { techniqueCatalog } from './catalog';
export { techniqueSources } from './sources';
export type { ExerciseTechnique, TechniquePhase } from './types';
export function findTechnique(id: string): ExerciseTechnique | undefined {
  const canonical = canonicalExerciseId(id);
  return canonical
    ? techniqueCatalog[canonical as keyof typeof techniqueCatalog]
    : undefined;
}
