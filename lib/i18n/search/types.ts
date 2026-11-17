import type { ExerciseId } from '../../exercise-library';
import type { EquipmentId, MuscleId } from '../../exercise-taxonomy';

export type SearchAliases = readonly [string, ...string[]];
export type AttachmentSearchId =
  | 'short-straight-bar'
  | 'wide-bar'
  | 'v-handle'
  | 'ergonomic-handle'
  | 'rope'
  | 'single-handle'
  | 'ankle-strap';
export type SearchAliasCatalog = {
  exercise: Record<ExerciseId, SearchAliases>;
  equipment: Record<EquipmentId | AttachmentSearchId, SearchAliases>;
  muscle: Record<MuscleId, SearchAliases>;
};
