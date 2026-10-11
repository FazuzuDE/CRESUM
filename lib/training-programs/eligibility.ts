import type { OnboardingAnswers } from '../onboarding';
export const programEligibilityError = (
  answers: OnboardingAnswers,
): string | undefined => {
  const age = answers.age?.trim();
  if (!age) return undefined;
  if (!/^\d+$/.test(age) || Number(age) < 1 || Number(age) > 120)
    return 'Enter a valid age, or leave it empty.';
  if (Number(age) < 18)
    return 'Adult starter programs are unavailable for under-18s. You can set up workouts manually.';
  return undefined;
};
