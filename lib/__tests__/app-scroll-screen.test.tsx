import { HomeDashboard } from '../../components/HomeDashboard';
import { DashboardGrid } from '../../components/DashboardGrid';
import { DockSpace } from '../../components/DockSpace';
import { spacing } from '../theme';
import { AppScrollView } from '../../components/AppScrollView';
import { TabContentLayout } from '../../components/TabContentMotion';
import { AppFlatList } from '../../components/AppFlatList';
import { ScrollView, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isPressable } from './pressable';
const { act, create } = jest.requireActual('react-test-renderer');
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock',
  ),
);

it('preserves the workout native ref, scrolling callbacks and layout coordinates', () => {
  let view!: ReturnType<typeof create>;
  let native: import('react').ComponentRef<typeof ScrollView> | null = null;
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

it('returns to the current Home widget before going to page top', async () => {
  let view!: ReturnType<typeof create>;
  await act(async () => {
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

it('reserves the measured dock height only within the tab scroll content', () => {
  let view!: ReturnType<typeof create>;
  const screen = (height: number) => (
    <DockSpace.Provider value={height}>
      <AppScrollView dockAware>
        <Text>Tab screen</Text>
      </AppScrollView>
      <AppScrollView>
        <Text>Independent sheet</Text>
      </AppScrollView>
    </DockSpace.Provider>
  );
  const scrolls = () => view.root.findAllByType(ScrollView);
  const insets = () =>
    scrolls().map((scroll: ReturnType<typeof create>['root']) =>
      scroll.findByType(SafeAreaView),
    );
  const bottomPadding = () =>
    insets().map(
      (node: ReturnType<typeof create>['root']) =>
        StyleSheet.flatten(node.props.style)?.paddingBottom,
    );
  const clearance = spacing.xxxl + spacing.lg;
  act(() => {
    view = create(screen(96));
  });
  expect(
    scrolls().map(
      (scroll: ReturnType<typeof create>['root']) =>
        scroll.props.contentInsetAdjustmentBehavior,
    ),
  ).toEqual(['never', 'never']);
  expect(
    insets().map((node: ReturnType<typeof create>['root']) => node.props.edges),
  ).toEqual([['top'], ['top', 'bottom']]);
  expect(bottomPadding()).toEqual([clearance + 96, clearance]);
  act(() => view.update(screen(120)));
  expect(bottomPadding()).toEqual([clearance + 120, clearance]);
  act(() => view.unmount());
});

it('keeps the standard dock header inset during interim native layout events', () => {
  let view!: ReturnType<typeof create>;
  act(() => {
    view = create(
      <TabContentLayout.Provider value={{ headerHeight: 120 }}>
        <AppScrollView branded dockAware>
          <Text>Workout</Text>
        </AppScrollView>
      </TabContentLayout.Provider>,
    );
  });
  try {
    const layout = (height: number) =>
      view.root
        .findAllByProps({ testID: 'fixed-header-overlay' })[0]
        .props.onLayout({
          nativeEvent: { layout: { height } },
        });
    const padding = () =>
      view.root.findByType(ScrollView).props.contentContainerStyle.paddingTop;
    expect(padding()).toBe(120);
    for (const height of [70, 0, 120]) {
      act(() => layout(height));
      expect(padding()).toBe(120);
    }
  } finally {
    act(() => view.unmount());
  }
});
