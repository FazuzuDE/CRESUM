import { parseOnboardingState, initialOnboardingState } from '../onboarding';
import { programEligibilityError } from '../training-programs/eligibility';

it('round-trips a name and birthday without converting a legacy age into a birthday', () => {
  const state = {
    ...initialOnboardingState,
    answers: { displayName: 'Ігор', dateOfBirth: '1989-09-27' },
  };
  expect(parseOnboardingState(state).answers).toEqual(state.answers);
  expect(
    parseOnboardingState({ ...initialOnboardingState, answers: { age: '35' } })
      .answers.dateOfBirth,
  ).toBeUndefined();
});
it('uses the actual birthday for adult program eligibility and rejects impossible dates', () => {
  expect(programEligibilityError({ dateOfBirth: '2015-01-01' })).toContain(
    'under-18',
  );
  expect(programEligibilityError({ dateOfBirth: '2020-02-31' })).toContain(
    'date of birth',
  );
  expect(
    programEligibilityError({ dateOfBirth: '1989-09-27' }),
  ).toBeUndefined();
});
