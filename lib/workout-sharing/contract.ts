import { canonicalExerciseId, findExercise } from '../exercise-library';
import { validateSharedPlan } from '../../supabase/functions/_shared/plan-contract';
export { PlanValidationError } from '../../supabase/functions/_shared/plan-contract';
export type {
  SharedPlanV1,
  SharedTarget,
} from '../../supabase/functions/_shared/plan-contract';
export function parseSharedPlan(input: unknown) {
  return validateSharedPlan(input, (id) => {
    const exercise = findExercise(id);
    return exercise &&
      (!exercise.measurement || exercise.measurement === 'repetitions')
      ? (canonicalExerciseId(id) ?? exercise.id)
      : null;
  });
}
