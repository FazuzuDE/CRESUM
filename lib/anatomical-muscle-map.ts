import atlas from '@/assets/muscle-map/male-anatomy-v1/runtime-atlas.json';
import { muscleTaxonomy, type MuscleId } from './exercise-taxonomy';

export const anatomicalAtlas = atlas;
export const anatomicalGroups = muscleTaxonomy.filter((m) =>
  atlas.regions.some((r) => r.groupId === m.id),
);
export const anatomicalMissingGroups = muscleTaxonomy.filter(
  (m) => !anatomicalGroups.some((g) => g.id === m.id),
);
export const anatomicalRegions = atlas.regions as (Omit<
  (typeof atlas.regions)[number],
  'groupId'
> & { groupId: MuscleId | null })[];
