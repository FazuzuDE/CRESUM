import { ExerciseEquipmentSheet } from '../../components/ExerciseEquipmentSheet';
import { equipmentPolicyFor } from '../exercise-equipment';
import { Modal, TextInput } from 'react-native';
import { TemplateEditor } from '../../components/TemplateEditor';
import { isPressable } from './pressable';
const { act, create } = jest.requireActual('react-test-renderer');
beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));

it('selects a distinct reviewed setup and dismisses without a second permanent selector', () => {
  const selected: string[] = [];
  let closed = 0;
  let view: ReturnType<typeof create>;
  act(() => {
    view = create(
      <ExerciseEquipmentSheet
        policy={equipmentPolicyFor(
          'lat-pulldown-close-neutral-ergonomic-handle',
        )!}
        selectedVariantId="lat-pulldown-close-neutral-ergonomic-handle"
        onSelect={(id: string) => selected.push(id)}
        onClose={() => closed++}
      />,
    );
  });
  const choices = view!.root
    .findAll(isPressable)
    .filter(
      (x: { props: { accessibilityRole?: string } }) =>
        x.props.accessibilityRole === 'radio',
    );
  expect(choices).toHaveLength(3);
  expect(choices[0].props.accessibilityState.checked).toBe(true);
  act(() => choices[2].props.onPress());
  expect(selected).toEqual(['lat-pulldown-wide-pronated-bar']);
  expect(closed).toBe(1);
  act(() => view!.root.findByType(Modal).props.onRequestClose());
  expect(selected).toHaveLength(1);
  expect(closed).toBe(2);
});

it('retains each configuration draft when browsing away from an edited attachment and back', () => {
  let view: ReturnType<typeof create>;
  const id = 'lat-pulldown-close-neutral-ergonomic-handle';
  act(() => {
    view = create(
      <TemplateEditor
        mode="edit"
        template={{
          id: 'plan',
          name: 'Pull',
          exerciseIds: [id],
          plannedExercises: [{ exerciseId: id, sets: 2, weight: '45' }],
        }}
        initialExerciseId={id}
        busy={false}
        onSave={async () => ({ ok: true })}
        onCancel={() => {}}
      />,
    );
  });
  const press = (label: string) =>
    act(() =>
      view!.root
        .findAll(isPressable)
        .find(
          (x: { props: { accessibilityLabel?: string } }) =>
            x.props.accessibilityLabel === label,
        )!
        .props.onPress(),
    );
  press('Change equipment: Short ergonomic handle');
  press('V-handle');
  act(() =>
    view!.root
      .findAllByType(TextInput)
      .find(
        (x: { props: { accessibilityLabel?: string } }) =>
          x.props.accessibilityLabel === 'Starting weight in kilograms',
      )!
      .props.onChangeText('38'),
  );
  press('Change equipment: V-handle');
  press('Short ergonomic handle');
  expect(
    view!.root
      .findAllByType(TextInput)
      .find(
        (x: { props: { accessibilityLabel?: string } }) =>
          x.props.accessibilityLabel === 'Starting weight in kilograms',
      )!.props.value,
  ).toBe('45');
  press('Change equipment: Short ergonomic handle');
  press('V-handle');
  expect(
    view!.root
      .findAllByType(TextInput)
      .find(
        (x: { props: { accessibilityLabel?: string } }) =>
          x.props.accessibilityLabel === 'Starting weight in kilograms',
      )!.props.value,
  ).toBe('38');
});
