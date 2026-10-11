import { HomeDashboard } from '../../components/HomeDashboard';
import { DashboardGrid } from '../../components/DashboardGrid';
import { AppScrollView } from '../../components/AppScrollView';
import { AppFlatList } from '../../components/AppFlatList';
import { ScrollView, FlatList, Text, View } from 'react-native';
import { isPressable } from './pressable';
const { act, create } = jest.requireActual('react-test-renderer');
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));

it('preserves the workout native ref, scrolling callbacks and layout coordinates', () => {
  let view!: ReturnType<typeof create>;
  let native: ScrollView | null = null;
  const offsets: number[] = [];
  const layouts: number[] = [];
  let drags = 0;
  act(() => {
    view = create(
      <AppScrollView
        ref={(instance) => {
          native = instance;
        }}
        onScroll={(event) => offsets.push(event.nativeEvent.contentOffset.y)}
        onScrollBeginDrag={() => drags++}
      >
        <View onLayout={(event) => layouts.push(event.nativeEvent.layout.y)}>
          <Text>Exercise</Text>
        </View>
      </AppScrollView>,
    );
  });
  try {
    const scroll = view.root.findByType(ScrollView);
    expect(native).toBe(scroll.instance);
    const jump = jest
      .spyOn(scroll.instance, 'scrollTo')
      .mockImplementation(() => {});
    const section = view.root
      .findAllByType(View)
      .find((node: { props: { onLayout?: unknown } }) => node.props.onLayout);
    act(() => section.props.onLayout({ nativeEvent: { layout: { y: 400 } } }));
    act(() =>
      scroll.props.onScroll({ nativeEvent: { contentOffset: { y: 650 } } }),
    );
    act(() => view.root.findAll(isPressable)[0].props.onPress());
    expect(jump).toHaveBeenLastCalledWith({ y: 400, animated: true });
    act(() => scroll.props.onScrollBeginDrag({}));
    expect(offsets).toEqual([650]);
    expect(layouts).toEqual([400]);
    expect(drags).toBe(1);
    act(() =>
      view.update(
        <AppScrollView scrollEnabled={false}>
          <Text>Dragging exercise</Text>
        </AppScrollView>,
      ),
    );
    expect(view.root.findAll(isPressable)).toHaveLength(0);
  } finally {
    act(() => view.unmount());
  }
});

it('animates a virtualized detail list to its start without replacing the list', () => {
  let view!: ReturnType<typeof create>;
  act(() => {
    view = create(
      <AppFlatList
        data={['one', 'two']}
        renderItem={({ item }) => <Text>{item}</Text>}
      />,
    );
  });
  try {
    const list = view.root.findByType(FlatList);
    const jump = jest
      .spyOn(list.instance, 'scrollToOffset')
      .mockImplementation(() => {});
    act(() =>
      list.props.onScroll({ nativeEvent: { contentOffset: { y: 500 } } }),
    );
    act(() => view.root.findAll(isPressable)[0].props.onPress());
    expect(jump).toHaveBeenLastCalledWith({ offset: 0, animated: true });
  } finally {
    act(() => view.unmount());
  }
});

it('returns to the current Home widget before going to page top', () => {
  let view!: ReturnType<typeof create>;
  act(() => {
    view = create(
      <HomeDashboard
        history={[]}
        activeWorkout={null}
        templates={[]}
        onResume={() => {}}
        startTemplate={() => {}}
      />,
    );
  });
  try {
    const scroll = view.root.findByType(ScrollView);
    const jump = jest
      .spyOn(scroll.instance, 'scrollTo')
      .mockImplementation(() => {});
    const grid = view.root.findByType(DashboardGrid);
    act(() => grid.props.onLayout({ nativeEvent: { layout: { y: 200 } } }));
    act(() => grid.props.onRowLayout('week', 500));
    act(() =>
      scroll.props.onScroll({ nativeEvent: { contentOffset: { y: 900 } } }),
    );
    act(() =>
      view.root
        .findAll(isPressable)
        .find(
          (node: { props: { accessibilityLabel: string } }) =>
            node.props.accessibilityLabel === 'Back to section start',
        )
        .props.onPress(),
    );
    expect(jump).toHaveBeenLastCalledWith({ y: 700, animated: true });
    act(() =>
      view.root
        .findAll(isPressable)
        .find(
          (node: { props: { accessibilityLabel: string } }) =>
            node.props.accessibilityLabel === 'Back to page top',
        )
        .props.onPress(),
    );
    expect(jump).toHaveBeenLastCalledWith({ y: 0, animated: true });
  } finally {
    act(() => view.unmount());
  }
});
