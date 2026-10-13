import type { TechniqueSourceId } from './sources';
export type ExerciseTechnique = {
  readonly revision: number;
  readonly scope: string;
  readonly setup: readonly string[];
  readonly movement: readonly string[];
  readonly checks: readonly string[];
  readonly mistakes: readonly string[];
  readonly sources: readonly TechniqueSourceId[];
  readonly adaptation?: string;
};
export type TechniquePhase = 'START' | 'FINISH';
