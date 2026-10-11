import { progressScrollTarget } from '../progress-scroll';
const sections = [
  { id: 'volume', label: 'Training Volume', y: 200 },
  { id: 'performance', label: 'Logged exercise performance', y: 600 },
  { id: 'history', label: 'History', y: 900 },
];
it('moves to the current section first and page top on the second tap', () => {
  expect(progressScrollTarget(1200, sections, false)).toEqual({
    y: 900,
    label: 'History',
  });
  expect(progressScrollTarget(900, sections, true)).toEqual({
    y: 0,
    label: 'page top',
  });
  expect(progressScrollTarget(850, sections, false).y).toBe(600);
  expect(progressScrollTarget(50, sections, false).y).toBe(0);
  expect(progressScrollTarget(1200, sections, true).y).toBe(0);
});
