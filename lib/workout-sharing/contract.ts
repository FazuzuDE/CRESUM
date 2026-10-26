import { canonicalExerciseId, findExercise } from '../exercise-library';
import { getCatalogVariant } from '../exercise-catalog-adapter';
import { validateSharedPlan } from '../../supabase/functions/_shared/plan-contract';
export { PlanValidationError } from '../../supabase/functions/_shared/plan-contract';
export type {
  SharedPlanV1,
  SharedPlanV2,
  SharedPlan,
  SharedPlanExerciseV2,
  SharedTarget,
} from '../../supabase/functions/_shared/plan-contract';
export function parseSharedPlan(input: unknown) {
  return validateSharedPlan(
    input,
    (id) => {
      const exercise = findExercise(id);
      return exercise &&
        (!exercise.measurement || exercise.measurement === 'repetitions')
        ? (canonicalExerciseId(id) ?? exercise.id)
        : null;
    },
    (id) => {
      const v = getCatalogVariant(id);
      return v?.configuration === 'specific' ? v.familyId : null;
    },
  );
}
