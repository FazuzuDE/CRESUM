import {
  equipmentPolicyFor,
  isValidEquipmentPolicy,
} from '../exercise-equipment';
const ergonomic = 'lat-pulldown-close-neutral-ergonomic-handle';
it('offers exact reviewed alternatives without making unknown equipment optional', () => {
  const policy = equipmentPolicyFor(ergonomic)!;
  expect(policy.requirement).toBe('required');
  expect(policy.choices.map((x: { variantId: string }) => x.variantId)).toEqual(
    [
      ergonomic,
      'lat-pulldown-close-neutral-v-handle',
      'lat-pulldown-wide-pronated-bar',
    ],
  );
  expect(equipmentPolicyFor('barbell-bench-press')).toBeNull();
  expect(
    isValidEquipmentPolicy({
      ...policy,
      choices: [{ id: 'none', variantId: ergonomic }],
    }),
  ).toBe(false);
  expect(
    isValidEquipmentPolicy({
      label: 'equipment.accessories',
      requirement: 'optional',
      choices: [{ id: 'none', variantId: 'barbell-bench-press' }],
    }),
  ).toBe(true);
  expect(
    isValidEquipmentPolicy({
      label: 'equipment.accessories',
      requirement: 'optional',
      choices: [{ id: 'none', variantId: 'unknown' }],
    }),
  ).toBe(false);
});
