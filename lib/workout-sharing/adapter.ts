import { canonicalExerciseId } from '../exercise-library';
import type { WorkoutTemplate } from '../workout-model';
import type { TemplateDraft } from '../workout-templates';
import {
  parseSharedPlan,
  type SharedPlan,
  type SharedPlanExerciseV2,
} from './contract';
export function exportSharedPlan(
  template: WorkoutTemplate,
  includeWeights: boolean,
): SharedPlan {
  return parseSharedPlan({
    schemaVersion: template.plannedExercises?.some(
      (e) => e.exerciseGroup || e.plannedSets,
    )
      ? 2
      : 1,
    title: template.name,
    exercises: template.exerciseIds.map((exerciseId) => {
      const planned = template.plannedExercises?.find(
        (p) =>
          (canonicalExerciseId(p.exerciseId) ?? p.exerciseId) ===
          (canonicalExerciseId(exerciseId) ?? exerciseId),
      );
      const t = planned?.target;
      return {
        exerciseId,
        sets: planned?.sets ?? 3,
        ...(planned?.exerciseGroup
          ? { exerciseGroup: { ...planned.exerciseGroup } }
          : {}),
        ...(planned?.plannedSets
          ? {
              plannedSets: planned.plannedSets.map((s) => ({
                id: s.id,
                ...(s.reps === undefined ? {} : { reps: s.reps }),
                ...(includeWeights && s.weight !== undefined
                  ? { weight: s.weight.replace(',', '.') }
                  : {}),
              })),
            }
          : {}),
        ...(includeWeights && planned?.weight
          ? { weightKg: planned.weight.replace(',', '.') }
          : {}),
        ...(t
          ? {
              target: {
                repMin: t.repMin,
                repMax: t.repMax,
                restMin: t.restMin,
                restMax: t.restMax,
                ...(t.perSide === undefined ? {} : { perSide: t.perSide }),
              },
            }
          : {}),
      };
    }),
  });
}
export function sharedPlanDraft(input: SharedPlan): TemplateDraft {
  const plan = parseSharedPlan(input);
  return {
    name: plan.title,
    exerciseIds: plan.exercises.map((e) => e.exerciseId),
    plannedExercises: (plan.exercises as SharedPlanExerciseV2[]).map((e) => ({
      exerciseId: e.exerciseId,
      sets: e.sets,
      ...(e.exerciseGroup ? { exerciseGroup: { ...e.exerciseGroup } } : {}),
      ...(e.plannedSets
        ? { plannedSets: e.plannedSets.map((s) => ({ ...s })) }
        : {}),
      ...(e.weightKg === undefined ? {} : { weight: e.weightKg }),
      ...(e.target
        ? { target: { kind: 'authored' as const, ...e.target } }
        : {}),
    })),
  };
}
