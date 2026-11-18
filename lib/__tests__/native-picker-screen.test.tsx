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
    const picker = () =>
      view.root
        .findAllByType(View)
        .find(
          (node: { props: { onSelect?: unknown } }) =>
            typeof node.props.onSelect === 'function',
        );
    const native = picker();
    expect(native.props.selectionRevision).toBe(0);
    act(() => native.props.onSelect({ nativeEvent: { component: 0, row: 1 } }));
    expect(changed).toHaveBeenCalledWith(0, 1);
    expect(picker().props.selected).toEqual([0]);
    expect(picker().props.selectionRevision).toBe(1);
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  } finally {
    act(() => view.unmount());
  }
});

it('uses the shared cyclic renderer even when the bounded UIKit module is available', () => {
  let view!: ReturnType<typeof create>;
  act(() => {
    view = create(
      <AppPicker
        cyclic
        columns={[['A', 'B']]}
        selected={[0]}
        labels={['Language']}
        onChange={() => {}}
      />,
    );
  });
  try {
    expect(
      view.root.findAll(
        (node: { props: { onSelect?: unknown } }) =>
          typeof node.props.onSelect === 'function',
      ),
    ).toHaveLength(0);
    const { FlatList } = jest.requireActual('react-native');
    const list = view.root.findByType(FlatList);
    expect(list.props.data[list.props.initialScrollIndex - 1]).toBe('B');
  } finally {
    act(() => view.unmount());
  }
});
