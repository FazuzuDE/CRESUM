import { canonicalExerciseId } from '../exercise-library';
import type { WorkoutTemplate } from '../workout-model';
import type { TemplateDraft } from '../workout-templates';
import { parseSharedPlan, type SharedPlanV1 } from './contract';
export function exportSharedPlan(
  template: WorkoutTemplate,
  includeWeights: boolean,
): SharedPlanV1 {
  return parseSharedPlan({
    schemaVersion: 1,
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
export function sharedPlanDraft(input: SharedPlanV1): TemplateDraft {
  const plan = parseSharedPlan(input);
  return {
    name: plan.title,
    exerciseIds: plan.exercises.map((e) => e.exerciseId),
    plannedExercises: plan.exercises.map((e) => ({
      exerciseId: e.exerciseId,
      sets: e.sets,
      ...(e.weightKg === undefined ? {} : { weight: e.weightKg }),
      ...(e.target
        ? { target: { kind: 'authored' as const, ...e.target } }
        : {}),
    })),
  };
}
