import type { TrainingExperience, TrainingGoal } from '../onboarding';
export type ProgramMovement = {
  exerciseId: string;
  sets: number;
  repMin: number;
  repMax: number;
  restMin: number;
  restMax: number;
  perSide?: boolean;
  sourceRefs: string[];
  adaptation?: string;
};
export type ProgramDay = {
  key: string;
  name: string;
  movements: ProgramMovement[];
};
export type ProgramSlot = { offset: number; dayKey: string };
export type CardioGuidance = {
  offset: number;
  minutes: number;
  intensity: 'moderate';
};
export type ProgramDefinition = {
  id: string;
  revision: 1;
  goal: TrainingGoal;
  experience: TrainingExperience;
  environment: 'gym';
  name: string;
  days: ProgramDay[];
  schedule: ProgramSlot[][];
  cardio: CardioGuidance[];
  firstSessionSetCap?: number;
};
