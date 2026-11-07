import { getCatalogVariant } from './exercise-catalog-adapter';
import { findExercise } from './exercise-library';
import { equipmentTaxonomy } from './exercise-taxonomy';

type Attachment = {
  id: string;
  messageKey: `equipment.${
    | 'shortStraightBar'
    | 'wideBar'
    | 'vHandle'
    | 'compact'
    | 'rope'
    | 'singleHandle'
    | 'ankleStrap'}`;
  artworkVariant?: string;
};
const attachments: readonly Attachment[] = [
  { id: 'short-straight-bar', messageKey: 'equipment.shortStraightBar' },
  {
    id: 'wide-bar',
    messageKey: 'equipment.wideBar',
    artworkVariant: 'lat-pulldown-wide-pronated-bar',
  },
  {
    id: 'v-handle',
    messageKey: 'equipment.vHandle',
    artworkVariant: 'lat-pulldown-close-neutral-v-handle',
  },
  {
    id: 'ergonomic-handle',
    messageKey: 'equipment.compact',
    artworkVariant: 'lat-pulldown-close-neutral-ergonomic-handle',
  },
  { id: 'rope', messageKey: 'equipment.rope' },
  { id: 'single-handle', messageKey: 'equipment.singleHandle' },
  { id: 'ankle-strap', messageKey: 'equipment.ankleStrap' },
];

export const exerciseEquipmentCatalog = [...equipmentTaxonomy, ...attachments];

const illustratedAttachments: ReadonlyMap<string, string> = new Map([
  ['cable-straight-arm-pulldown', 'short-straight-bar'],
  ['cable-biceps-curl', 'short-straight-bar'],
  ['lat-pulldown-reverse-grip', 'wide-bar'],
  ['cable-triceps-pushdown', 'rope'],
  ['overhead-cable-triceps-extension', 'rope'],
  ['cable-lateral-raise', 'single-handle'],
  ['cable-chest-fly', 'single-handle'],
  ['standing-cable-anti-rotation-press', 'single-handle'],
  ['cable-crunch', 'rope'],
  ['cable-glute-kickback', 'ankle-strap'],
]);

export function defaultExerciseEquipment(exerciseId: string): string[] {
  const exercise = findExercise(exerciseId);
  if (!exercise) return [];
  const attachment =
    getCatalogVariant(exercise.id)?.attachmentType?.id ??
    illustratedAttachments.get(exercise.id);
  return attachment
    ? [...exercise.equipment, attachment]
    : [...exercise.equipment];
}

export function parseExerciseEquipment(value: string | null): string[] | null {
  if (value === null) return null;
  try {
    const ids: unknown = JSON.parse(value);
    if (!Array.isArray(ids)) return null;
    return [
      ...new Set(
        exerciseEquipmentCatalog
          .filter((item) => ids.includes(item.id))
          .map((item) => item.id),
      ),
    ];
  } catch {
    return null;
  }
}
