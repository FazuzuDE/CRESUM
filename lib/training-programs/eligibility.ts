import type { OnboardingAnswers } from '../onboarding';
import { ageFromBirthDate } from '../personal-profile';
import { AppError } from '../app-error';
export const programEligibilityIssue = (
  answers: OnboardingAnswers,
  now = Date.now(),
): AppError | undefined => {
  if (answers.dateOfBirth?.trim()) {
    const age = ageFromBirthDate(answers.dateOfBirth, now);
    if (age === undefined)
      return new AppError(
        'invalid_birth_date',
        'Enter a valid date of birth, or leave it empty.',
      );
    if (age < 18)
      return new AppError(
        'program_under18',
        'Adult starter programs are unavailable for under-18s. You can set up workouts manually.',
      );
    return undefined;
  }
  const age = answers.age?.trim();
  if (!age) return undefined;
  if (!/^\d+$/.test(age) || Number(age) < 1 || Number(age) > 120)
    return new AppError('invalid_age', 'Enter a valid age, or leave it empty.');
  if (Number(age) < 18)
    return new AppError(
      'program_under18',
      'Adult starter programs are unavailable for under-18s. You can set up workouts manually.',
    );
  return undefined;
};
export const programEligibilityError = (
  answers: OnboardingAnswers,
  now = Date.now(),
): string | undefined => programEligibilityIssue(answers, now)?.message;
