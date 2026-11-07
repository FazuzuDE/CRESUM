import {
  defaultExerciseEquipment,
  exerciseEquipmentCatalog,
  parseExerciseEquipment,
} from '../exercise-equipment-catalog';
import { exerciseLibrary } from '../exercise-library';

it('uses the pictured short bar for cable curls and straight-arm pulldowns', () => {
  expect(defaultExerciseEquipment('cable-straight-arm-pulldown')).toEqual([
    'cable',
    'short-straight-bar',
  ]);
  expect(defaultExerciseEquipment('cable-biceps-curl')).toEqual([
    'cable',
    'short-straight-bar',
  ]);
  expect(
    defaultExerciseEquipment('seated-cable-row-close-neutral-v-handle'),
  ).toEqual(['cable', 'v-handle']);
});

it('keeps defaults within the shared catalog', () => {
  const ids = new Set<string>(exerciseEquipmentCatalog.map((item) => item.id));
  expect(ids.size).toBe(exerciseEquipmentCatalog.length);
  for (const exercise of exerciseLibrary) {
    const defaults = defaultExerciseEquipment(exercise.id);
    expect(defaults.length).toBeGreaterThan(0);
    expect(defaults.every((id) => ids.has(id))).toBe(true);
  }
});

it('distinguishes cleared equipment from missing or corrupt preferences', () => {
  expect(parseExerciseEquipment(null)).toBeNull();
  expect(parseExerciseEquipment('{invalid')).toBeNull();
  expect(parseExerciseEquipment('[]')).toEqual([]);
  expect(parseExerciseEquipment('["rope","rope","retired-item"]')).toEqual([
    'rope',
  ]);
});
