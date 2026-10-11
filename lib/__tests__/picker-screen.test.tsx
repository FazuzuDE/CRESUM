import { useState } from 'react';
import { FlatList } from 'react-native';
import { AppPicker } from '../../components/AppPicker';
import { AppDatePicker } from '../../components/AppDatePicker';
import { DatePickerSheet } from '../../components/DatePickerSheet';
import { AppButton } from '../../components/AppButton';
import { HistoryCountWheel } from '../../components/HistoryCountWheel';
import * as Haptics from 'expo-haptics';
const { act, create } = jest.requireActual('react-test-renderer');
jest.mock('expo-haptics', () => ({ selectionAsync: jest.fn(async () => {}) }));
jest.mock('expo', () => ({ requireOptionalNativeModule: () => null }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));
jest.mock('expo-blur', () => ({
  BlurView: jest.requireActual('react-native').View,
}));

it('emits selection feedback once per changed row and none on mount or prop synchronization', () => {
  (Haptics.selectionAsync as jest.Mock).mockClear();
  const change = jest.fn();
  let view!: ReturnType<typeof create>;
  act(() => {
    view = create(
      <AppPicker
        columns={[['All', '1', '2']]}
        labels={['Count']}
        selected={[0]}
        onChange={change}
      />,
    );
  });
  try {
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
    const list = view.root.findByType(FlatList);
    act(() => list.props.onScrollBeginDrag());
    const scroll = (row: number) =>
      list.props.onScroll({
        nativeEvent: { contentOffset: { y: row * list.props.snapToInterval } },
      });
    act(() => {
      scroll(1);
      scroll(1);
    });
    expect(change).toHaveBeenCalledTimes(1);
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    act(() =>
      view.update(
        <AppPicker
          columns={[['All', '1', '2']]}
          labels={['Count']}
          selected={[2]}
          onChange={change}
        />,
      ),
    );
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
  } finally {
    act(() => view.unmount());
  }
});
it('does not apply date drafts until Done, and Cancel preserves the original', () => {
  const changed = jest.fn();
  function Harness() {
    const [open, setOpen] = useState(true);
    return open ? (
      <DatePickerSheet
        title="Date of birth"
        value={new Date(1989, 8, 27).getTime()}
        onCancel={() => setOpen(false)}
        onConfirm={changed}
      />
    ) : null;
  }
  let view!: ReturnType<typeof create>;
  act(() => {
    view = create(<Harness />);
  });
  try {
    act(() =>
      view.root
        .findByType(AppDatePicker)
        .props.onChange(new Date(1990, 0, 1).getTime()),
    );
    expect(changed).not.toHaveBeenCalled();
    act(() =>
      view.root
        .findAllByType(AppButton)
        .find((n: any) => n.props.title === 'Cancel')
        .props.onPress(),
    );
    expect(changed).not.toHaveBeenCalled();
    act(() =>
      view.update(
        <DatePickerSheet
          title="Date of birth"
          value={new Date(1989, 8, 27).getTime()}
          onCancel={() => {}}
          onConfirm={changed}
        />,
      ),
    );
    act(() =>
      view.root
        .findByType(AppDatePicker)
        .props.onChange(new Date(1990, 0, 1).getTime()),
    );
    act(() =>
      view.root
        .findAllByType(AppButton)
        .find((n: any) => n.props.title === 'Done')
        .props.onPress(),
    );
    expect(changed).toHaveBeenCalledWith(new Date(1990, 0, 1).getTime());
  } finally {
    act(() => view.unmount());
  }
});

it('silently recenters a rejected future date instead of displaying a date different from Done', () => {
  const today = new Date(2026, 9, 11).getTime();
  let view!: ReturnType<typeof create>;
  act(() => {
    view = create(
      <DatePickerSheet
        title="DOB"
        value={today}
        maximum={today}
        onCancel={() => {}}
        onConfirm={() => {}}
      />,
    );
  });
  try {
    const month = view.root.findAllByType(FlatList)[1];
    const scroll = jest.spyOn(month.instance, 'scrollToOffset');
    act(() =>
      month.props.onAccessibilityAction({
        nativeEvent: { actionName: 'increment' },
      }),
    );
    expect(scroll).toHaveBeenLastCalledWith({
      offset: 9 * month.props.snapToInterval,
      animated: false,
    });
  } finally {
    act(() => view.unmount());
  }
});

it('centers the selected count in a shortened wheel viewport', () => {
  let view!: ReturnType<typeof create>;
  act(() => {
    view = create(
      <HistoryCountWheel maximum={8} value={3} onChange={() => {}} />,
    );
  });
  try {
    const layout = view.root
      .findAll((n: any) => Boolean(n.props.onLayout))
      .find((n: any) => n.props.testID === 'picker-viewport');
    act(() =>
      layout.props.onLayout({ nativeEvent: { layout: { height: 132 } } }),
    );
    const list = view.root.findByType(FlatList);
    expect(list.props.contentContainerStyle.paddingVertical).toBe(
      (132 - list.props.snapToInterval) / 2,
    );
  } finally {
    act(() => view.unmount());
  }
});

it('does not emit intermediate changes during a row-tap animation after a stopped drag', () => {
  const change = jest.fn();
  let view!: ReturnType<typeof create>;
  act(() => {
    view = create(
      <AppPicker
        columns={[['0', '1', '2', '3']]}
        selected={[0]}
        labels={['Count']}
        onChange={change}
      />,
    );
  });
  try {
    const list = view.root.findByType(FlatList);
    act(() => list.props.onScrollBeginDrag());
    act(() =>
      list.props.onScrollEndDrag({
        nativeEvent: { contentOffset: { y: 0 }, velocity: { y: 0 } },
      }),
    );
    act(() =>
      list.props.onScroll({
        nativeEvent: { contentOffset: { y: list.props.snapToInterval } },
      }),
    );
    expect(change).not.toHaveBeenCalled();
  } finally {
    act(() => view.unmount());
  }
});

it('silently recenters after Dynamic Type changes the row geometry', () => {
  const dimensions = jest
    .spyOn(jest.requireActual('react-native'), 'useWindowDimensions')
    .mockReturnValue({ width: 390, height: 800, scale: 1, fontScale: 1 });
  let view!: ReturnType<typeof create>;
  act(() => {
    view = create(
      <AppPicker
        columns={[['0', '1', '2', '3']]}
        selected={[2]}
        labels={['Count']}
        onChange={() => {}}
      />,
    );
  });
  try {
    const list = view.root.findByType(FlatList),
      scroll = jest.spyOn(list.instance, 'scrollToOffset');
    dimensions.mockReturnValue({
      width: 390,
      height: 800,
      scale: 1,
      fontScale: 2,
    });
    act(() =>
      view.update(
        <AppPicker
          columns={[['0', '1', '2', '3']]}
          selected={[2]}
          labels={['Count']}
          onChange={() => {}}
        />,
      ),
    );
    const height = view.root.findByType(FlatList).props.snapToInterval;
    expect(scroll).toHaveBeenLastCalledWith({
      offset: 2 * height,
      animated: false,
    });
  } finally {
    act(() => view.unmount());
    dimensions.mockRestore();
  }
});
