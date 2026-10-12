import { View } from 'react-native';
import { AppPicker } from '../../components/AppPicker';
import * as Haptics from 'expo-haptics';
const { act, create } = jest.requireActual('react-test-renderer');
jest.mock('expo', () => ({
  requireOptionalNativeModule: () => ({}),
  requireNativeView: () => jest.requireActual('react-native').View,
}));
jest.mock('expo-haptics', () => ({ selectionAsync: jest.fn(async () => {}) }));

it('resynchronizes a rejected native row and leaves native feedback to UIKit', () => {
  let view!: ReturnType<typeof create>;
  const changed = jest.fn();
  act(() => {
    view = create(
      <AppPicker
        columns={[['Today', 'Future']]}
        selected={[0]}
        labels={['Date']}
        onChange={changed}
      />,
    );
  });
  try {
    const native = view.root.findByType(View);
    expect(native.props.selectionRevision).toBe(0);
    act(() => native.props.onSelect({ nativeEvent: { component: 0, row: 1 } }));
    expect(changed).toHaveBeenCalledWith(0, 1);
    expect(view.root.findByType(View).props.selected).toEqual([0]);
    expect(view.root.findByType(View).props.selectionRevision).toBe(1);
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  } finally {
    act(() => view.unmount());
  }
});
