import type { OnboardingState } from '../onboarding';
import type { WorkoutStore } from '../workout-store';
import { exerciseLibrary } from '../exercise-library';
import type { LibraryExercise } from '../workout-model';
import { makeAssignment, type ProgramAssignment } from './assignment';
import { ProgramRepository, type ProgramDocument } from './repository';
import { projectProgramReadiness } from './readiness';
export type AcceptanceResult = {
  status: 'accepted' | 'pending' | 'conflict' | 'blocked' | 'empty';
  assignment?: ProgramAssignment;
  error?: string;
};
export class ProgramAcceptance {
  private running?: Promise<AcceptanceResult>;
  private epoch = 0;
  constructor(
    private readonly repository: ProgramRepository,
    private readonly store: WorkoutStore,
    private readonly saveOnboarding: (state: OnboardingState) => Promise<void>,
    private readonly library: readonly LibraryExercise[] = exerciseLibrary,
  ) {}
  private run(
    work: (epoch: number) => Promise<AcceptanceResult>,
  ): Promise<AcceptanceResult> {
    if (this.running) return this.running;
    const epoch = this.epoch;
    const result = work(epoch).catch((error: Error): AcceptanceResult => ({
      status: 'pending',
      error: error.message,
    }));
    this.running = result;
    void result.finally(() => {
      if (this.running === result) this.running = undefined;
    });
    return result;
  }
  private current(epoch: number) {
    if (epoch !== this.epoch) throw Error('Program operation cancelled.');
  }
  private async finish(
    document: ProgramDocument,
    epoch: number,
  ): Promise<AcceptanceResult> {
    const pending = document.pending;
    if (!pending)
      return document.assignment
        ? { status: 'accepted', assignment: document.assignment }
        : { status: 'empty' };
    this.current(epoch);
    const readiness = projectProgramReadiness(
      pending.assignment.program,
      this.library,
    );
    if (!readiness.ready)
      return {
        status: 'blocked',
        error: `Required exercises unavailable: ${readiness.blockers.join(', ')}`,
      };
    const installed = await this.store.installProgramTemplates(
      pending.assignment.id,
      pending.assignment.templates,
    );
    if (!installed.ok)
      return {
        status: installed.conflict ? 'conflict' : 'pending',
        error: installed.error,
      };
    this.current(epoch);
    await this.saveOnboarding(pending.onboarding);
    this.current(epoch);
    await this.repository.save({
      version: 1,
      assignment: pending.assignment,
      pending: null,
    });
    this.current(epoch);
    return { status: 'accepted', assignment: pending.assignment };
  }
  accept(
    assignment: ProgramAssignment,
    onboarding: OnboardingState,
  ): Promise<AcceptanceResult> {
    return this.run(async (epoch) => {
      try {
        if (
          JSON.stringify(
            makeAssignment(
              assignment.program,
              assignment.id,
              assignment.startDate,
              assignment.reducedFirstSession,
            ),
          ) !== JSON.stringify(assignment)
        )
          throw Error();
      } catch {
        return {
          status: 'blocked',
          error: 'Incomplete program proposal. Review all required movements.',
        };
      }
      const document = await this.repository.load();
      this.current(epoch);
      if (document.pending && document.pending.assignment.id !== assignment.id)
        return {
          status: 'conflict',
          error:
            'A previous proposal is pending. Review or retry it before accepting another.',
        };
      if (document.assignment?.id === assignment.id && !document.pending)
        return { status: 'accepted', assignment: document.assignment };
      if (!projectProgramReadiness(assignment.program, this.library).ready)
        return {
          status: 'blocked',
          error:
            'Required exercises are unavailable. Use manual setup or review the full program.',
        };
      const next = document.pending
        ? document
        : { ...document, pending: { assignment, onboarding } };
      if (!document.pending) {
        await this.repository.save(next);
        this.current(epoch);
      }
      return this.finish(next, epoch);
    });
  }
  recover(): Promise<AcceptanceResult> {
    return this.run(async (epoch) =>
      this.finish(await this.repository.load(), epoch),
    );
  }
  invalidate() {
    ++this.epoch;
  }
  async waitForPendingWrites() {
    await this.running;
  }
}
