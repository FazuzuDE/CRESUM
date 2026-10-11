import { ProgressScrollView } from '../../components/ProgressScrollView';
import { ScrollView, Text, View } from 'react-native';
import { isPressable } from './pressable';
const { act, create } = jest.requireActual('react-test-renderer');
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));
it('shows the arrow only after scrolling and resets its two-step action after manual dragging', () => {
  let view!: ReturnType<typeof create>;
  act(() => {
    view = create(
      <ProgressScrollView
        sections={[
          { id: 'history', label: 'History', content: <Text>History</Text> },
        ]}
      />,
    );
  });
  try {
    const scroll = view.root.findByType(ScrollView);
    const jump = jest
      .spyOn(scroll.instance, 'scrollTo')
      .mockImplementation(() => {});
    const section = view.root
      .findAllByType(View)
      .find((node: { props: { onLayout?: unknown } }) => node.props.onLayout);
    act(() => section?.props.onLayout({ nativeEvent: { layout: { y: 900 } } }));
    expect(view.root.findAll(isPressable)).toHaveLength(0);
    act(() =>
      scroll.props.onScroll({ nativeEvent: { contentOffset: { y: 1200 } } }),
    );
    act(() => view.root.findAll(isPressable)[0].props.onPress());
    expect(jump).toHaveBeenLastCalledWith({ y: 900, animated: false });
    act(() => view.root.findAll(isPressable)[0].props.onPress());
    expect(jump).toHaveBeenLastCalledWith({ y: 0, animated: false });
    act(() => scroll.props.onScrollBeginDrag());
    act(() =>
      scroll.props.onScroll({ nativeEvent: { contentOffset: { y: 1200 } } }),
    );
    act(() => view.root.findAll(isPressable)[0].props.onPress());
    expect(jump).toHaveBeenLastCalledWith({ y: 900, animated: false });
  } finally {
    act(() => view.unmount());
  }
});
