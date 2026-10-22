import {
  progressNumber,
  volumeNumber,
  periodLabel,
  fixedEstimateNumber,
} from '../i18n/progress';
import { createTranslator } from '../i18n/engine';
it('localizes analytics without truncating tiny, huge or exact volume values', () => {
  expect(progressNumber('de', 50, true)).toBe('50,0');
  expect(progressNumber('en', 1000, true)).toBe('1000.0');
  expect(progressNumber('en', 1.15, true)).toBe('1.1');
  expect(progressNumber('fr', 50.25)).toBe('50,25');
  expect(progressNumber('de', 1e-7)).toBe('1e-7');
  expect(progressNumber('de', 1.25e20)).toBe('125000000000000000000');
  expect(progressNumber('de', 1.25e25)).toBe('1,25e+25');
  expect(volumeNumber('ru', 0.123456789123456)).toBe('0,123456789123456');
  expect(volumeNumber('de', -1.25)).toBe('-1,25');
  expect(periodLabel(createTranslator('ru'), '1W')).toBe('1Н');
  expect(periodLabel(createTranslator('fr'), 'ALL')).toBe('TOUT');
});
it('preserves the overview fixed-decimal policy for tiny and huge records', () => {
  expect(fixedEstimateNumber('en', 0.01)).toBe('0.0');
  expect(fixedEstimateNumber('de', 0.01)).toBe('0,0');
  expect(fixedEstimateNumber('en', 1000000000000.25)).toBe('1000000000000.3');
  expect(fixedEstimateNumber('fr', 1000000000000.25)).toBe('1000000000000,3');
});
