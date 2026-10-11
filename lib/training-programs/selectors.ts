import type { TrainingExperience, TrainingGoal } from '../onboarding';
import { trainingPrograms } from './catalog';
export const selectProgram = (
  goal: TrainingGoal,
  experience: TrainingExperience,
) =>
  trainingPrograms.find((p) => p.goal === goal && p.experience === experience);
