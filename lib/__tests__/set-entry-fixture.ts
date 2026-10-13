import { TextInput } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { isPressable } from './pressable';
const { act } = jest.requireActual('react-test-renderer');
/** Existing workflow tests now exercise the real editor and explicit Save. */
export function editWorkoutSet(
  view: any,
  index: number,
  weight: string,
  reps?: string,
) {
  const button = (label: string) =>
    view.root
      .findAll(isPressable)
      .find((n: any) => n.props.accessibilityLabel === label);
  act(() => button(`Edit set ${index} weight`).props.onPress());
  act(() => button('Use keypad').props.onPress());
  const field = (label: string) =>
    view.root
      .findAllByType(TextInput)
      .find((n: any) => n.props.accessibilityLabel === label);
  act(() => field('Exact weight in kilograms').props.onChangeText(weight));
  if (reps !== undefined)
    act(() => field('Exact repetitions').props.onChangeText(reps));
  const save = view.root
    .findAllByType(AppButton)
    .find((n: any) => n.props.accessibilityLabel === 'Save set values');
  expect(save.props.disabled).toBe(false);
  act(() => save.props.onPress());
}
