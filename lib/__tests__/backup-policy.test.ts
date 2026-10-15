import {
  automaticBackupDue,
  defaultBackupPolicy,
  nextBackupDate,
} from '../backup-policy';
const now = new Date(2026, 9, 15, 12).getTime();
it('does not run disabled or empty-history automatic backups', () => {
  expect(automaticBackupDue(defaultBackupPolicy, undefined, [], now)).toBe(
    false,
  );
  expect(
    automaticBackupDue(
      { ...defaultBackupPolicy, enabled: true },
      undefined,
      [],
      now,
    ),
  ).toBe(false);
});
it('backs up a newly completed workout and does not duplicate a saved one', () => {
  const policy = { ...defaultBackupPolicy, enabled: true };
  expect(automaticBackupDue(policy, undefined, ['a'], now)).toBe(true);
  expect(
    automaticBackupDue(
      policy,
      { createdAt: now, workoutIds: ['a'] },
      ['a'],
      now,
    ),
  ).toBe(false);
  expect(
    automaticBackupDue(
      policy,
      { createdAt: now, workoutIds: ['a'] },
      ['a', 'b'],
      now,
    ),
  ).toBe(true);
});
it('uses calendar week/month intervals and clamps month ends', () => {
  const last = new Date(2026, 0, 31, 12).getTime();
  expect(new Date(nextBackupDate(last, 'monthly')).getDate()).toBe(28);
  const policy = {
    ...defaultBackupPolicy,
    enabled: true,
    frequency: 'weekly' as const,
  };
  const prior = { createdAt: now - 6 * 86400000, workoutIds: ['a'] };
  expect(automaticBackupDue(policy, prior, ['a'], now)).toBe(false);
  expect(automaticBackupDue(policy, prior, ['a'], now + 86400000)).toBe(true);
});
