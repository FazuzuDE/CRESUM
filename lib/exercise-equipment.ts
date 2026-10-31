import { findExercise } from './exercise-library';
import type { MessageKey } from './i18n/messages';
type EquipmentLabelKey = Extract<
  MessageKey,
  | 'library.equipment'
  | 'catalog.equipment.dumbbell'
  | 'catalog.equipment.kettlebell'
  | 'equipment.handle'
  | 'equipment.accessories'
  | 'equipment.compact'
  | 'equipment.vHandle'
  | 'equipment.wideBar'
  | 'equipment.closeNeutral'
  | 'equipment.widePronated'
>;

export type EquipmentChoice = {
  id: string;
  variantId: string;
  nameKey?: EquipmentLabelKey;
  gripKey?: EquipmentLabelKey;
};
export type ExerciseEquipmentPolicy = {
  label: EquipmentLabelKey;
  supportsSetGroups?: boolean;
  requirement: 'required' | 'optional' | 'not-applicable';
  choices: readonly EquipmentChoice[];
};

const pulldown: ExerciseEquipmentPolicy = {
  supportsSetGroups: true,
  label: 'equipment.handle',
  requirement: 'required',
  choices: [
    {
      id: 'compact-ergonomic',
      variantId: 'lat-pulldown-close-neutral-ergonomic-handle',
      nameKey: 'equipment.compact',
      gripKey: 'equipment.closeNeutral',
    },
    {
      id: 'v-handle',
      variantId: 'lat-pulldown-close-neutral-v-handle',
      nameKey: 'equipment.vHandle',
      gripKey: 'equipment.closeNeutral',
    },
    {
      id: 'wide-bar',
      variantId: 'lat-pulldown-wide-pronated-bar',
      nameKey: 'equipment.wideBar',
      gripKey: 'equipment.widePronated',
    },
  ],
};

export function isValidEquipmentPolicy(
  policy: ExerciseEquipmentPolicy,
): boolean {
  const ids = new Set(policy.choices.map((c) => c.id));
  return (
    ids.size === policy.choices.length &&
    policy.choices.every((c) => Boolean(findExercise(c.variantId))) &&
    (policy.requirement === 'not-applicable'
      ? policy.choices.length === 0
      : policy.choices.length > 0 &&
        (policy.requirement === 'optional'
          ? policy.choices[0].id === 'none'
          : !ids.has('none')))
  );
}

export function equipmentPolicyFor(
  exerciseId: string,
): ExerciseEquipmentPolicy | null {
  const id = findExercise(exerciseId)?.id;
  if (id === 'goblet-squat' || id === 'kettlebell-goblet-squat')
    return {
      label: 'library.equipment',
      requirement: 'required',
      choices: [
        {
          id: 'dumbbell',
          variantId: 'goblet-squat',
          nameKey: 'catalog.equipment.dumbbell',
        },
        {
          id: 'kettlebell',
          variantId: 'kettlebell-goblet-squat',
          nameKey: 'catalog.equipment.kettlebell',
        },
      ],
    };
  if (id === 'seated-cable-row-close-neutral-v-handle')
    return {
      label: 'equipment.handle',
      requirement: 'required',
      choices: [
        {
          id: 'v-handle',
          variantId: id,
          nameKey: 'equipment.vHandle',
          gripKey: 'equipment.closeNeutral',
        },
      ],
    };
  if (id === 'lat-pulldown' || pulldown.choices.some((c) => c.variantId === id))
    return pulldown;
  // Reviewed unloaded configuration; step platform is still primary equipment.
  if (id === 'bodyweight-step-up')
    return {
      label: 'equipment.accessories',
      requirement: 'not-applicable',
      choices: [],
    };
  return null;
}
