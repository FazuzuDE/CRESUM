import type { KeyValueStorage } from '../workout-repository';
import { makeAssignment, type ProgramAssignment } from './assignment';
import { parseOnboardingState, type OnboardingState } from '../onboarding';
export const PROGRAM_KEY = 'cresum_training_program_v1';
export type ProgramDocument = {
  version: 1;
  assignment: ProgramAssignment | null;
  pending: {
    assignment: ProgramAssignment;
    onboarding: OnboardingState;
  } | null;
};
const validateAssignment = (value: ProgramAssignment): ProgramAssignment => {
  const checked = makeAssignment(
    value.program,
    value.id,
    value.startDate,
    value.reducedFirstSession,
  );
  if (
    typeof value.reducedFirstSession !== 'boolean' ||
    JSON.stringify(checked) !== JSON.stringify(value)
  )
    throw Error('Invalid program snapshot');
  return checked;
};
export class ProgramRepository {
  constructor(private readonly storage: KeyValueStorage) {}
  async load(): Promise<ProgramDocument> {
    const raw = await this.storage.getItem(PROGRAM_KEY);
    if (raw === null) return { version: 1, assignment: null, pending: null };
    try {
      const value = JSON.parse(raw) as ProgramDocument;
      if (
        value.version !== 1 ||
        !('assignment' in value) ||
        !('pending' in value)
      )
        throw Error();
      return {
        version: 1,
        assignment:
          value.assignment === null
            ? null
            : validateAssignment(value.assignment),
        pending:
          value.pending === null
            ? null
            : {
                assignment: validateAssignment(value.pending.assignment),
                onboarding: parseOnboardingState(value.pending.onboarding),
              },
      };
    } catch {
      throw Error(
        'Saved program is unavailable. Your workouts are safe; no program data was overwritten.',
      );
    }
  }
  async save(document: ProgramDocument) {
    await this.storage.setItem(PROGRAM_KEY, JSON.stringify(document));
  }
}
