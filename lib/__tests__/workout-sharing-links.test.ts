import { parsePlanLink, createPlanLink } from '../workout-sharing/links';
const token = 'a'.repeat(64);
test('only canonical HTTPS plan links reach resolution', () => {
  expect(
    parsePlanLink(
      createPlanLink('plans.example.test', token),
      'plans.example.test',
    ),
  ).toEqual({ token });
  for (const url of [
    `http://plans.example.test/shared?token=${token}`,
    `https://evil.test/shared?token=${token}`,
    `https://plans.example.test.evil.test/shared?token=${token}`,
    `https://user@plans.example.test/shared?token=${token}`,
    `https://plans.example.test/shared?token=${token}&redirect=evil`,
    `https://plans.example.test/shared?token=short`,
  ])
    expect(parsePlanLink(url, 'plans.example.test')).toBeNull();
});

test('normalizes a configured uppercase hostname consistently', () => {
  const url = createPlanLink('PLANS.EXAMPLE.TEST', token);
  expect(url).toBe(`https://plans.example.test/shared?token=${token}`);
  expect(parsePlanLink(url, 'PLANS.EXAMPLE.TEST')).toEqual({ token });
});
