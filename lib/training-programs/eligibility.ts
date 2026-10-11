import type { OnboardingAnswers } from '../onboarding';
import { ageFromBirthDate } from '../personal-profile';
export const programEligibilityError = (
  answers: OnboardingAnswers,
  now = Date.now(),
): string | undefined => {
  if (answers.dateOfBirth?.trim()) {
    const age = ageFromBirthDate(answers.dateOfBirth, now);
    if (age === undefined)
      return 'Enter a valid date of birth, or leave it empty.';
    if (age < 18)
      return 'Adult starter programs are unavailable for under-18s. You can set up workouts manually.';
    return undefined;
  }
  const age = answers.age?.trim();
  if (!age) return undefined;
  if (!/^\d+$/.test(age) || Number(age) < 1 || Number(age) > 120)
    return 'Enter a valid age, or leave it empty.';
  if (Number(age) < 18)
    return 'Adult starter programs are unavailable for under-18s. You can set up workouts manually.';
  return undefined;
};
