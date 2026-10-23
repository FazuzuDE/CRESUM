import type { PlanOrigin } from '../workout-model';
export function validPlanOrigin(value: unknown): value is PlanOrigin {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    Object.keys(v).every((k) => ['publicationId', 'version'].includes(k)) &&
    typeof v.publicationId === 'string' &&
    /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(v.publicationId) &&
    Number.isSafeInteger(v.version) &&
    Number(v.version) > 0
  );
}
