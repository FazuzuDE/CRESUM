import { useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { GlassMaterial } from '../../components/GlassMaterial';
import { AppPicker } from '../../components/AppPicker';
import { AppDatePicker } from '../../components/AppDatePicker';
import { DatePickerSheet } from '../../components/DatePickerSheet';
import { AppButton } from '../../components/AppButton';
import { HistoryCountWheel } from '../../components/HistoryCountWheel';
import * as Haptics from 'expo-haptics';
const { act, create } = jest.requireActual('react-test-renderer');
jest.mock('expo-haptics', () => ({ selectionAsync: jest.fn(async () => {}) }));
const mockClick = jest.fn();
jest.mock('../../components/useWheelClick', () => ({
  useWheelClick: () => mockClick,
}));
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

it('frames the selected date across all columns and lowers the dialog transparency', () => {
  let view!: ReturnType<typeof create>;
  act(() => {
    view = create(
      <DatePickerSheet
        title="Date of birth"
        value={new Date(1989, 8, 27).getTime()}
        onCancel={() => {}}
        onConfirm={() => {}}
      />,
    );
  });
  try {
    expect(view.root.findByType(GlassMaterial).props.transparency).toBe(26.5);
    const frame = view.root.findAllByProps({
      testID: 'wheel-selection-lines',
    })[0];
    expect(StyleSheet.flatten(frame?.props.style)).toMatchObject({
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
    });
  } finally {
    act(() => view.unmount());
  }
});

it('wraps a cyclic wheel in both directions and silently recenters after a drag without momentum', () => {
  jest.useFakeTimers();
  (Haptics.selectionAsync as jest.Mock).mockClear();
  const change = jest.fn(),
    interaction = jest.fn();
  function Harness() {
    const [selected, select] = useState(0);
    return (
      <AppPicker
        cyclic
        columns={[['A', 'B', 'C']]}
        labels={['Language']}
        selected={[selected]}
        onInteractionChange={interaction}
        onChange={(_, row) => {
          change(row);
          select(row);
        }}
      />
    );
  }
  let view!: ReturnType<typeof create>;
  act(() => {
    view = create(<Harness />);
  });
  try {
    const list = () => view.root.findByType(FlatList);
    const height = list().props.snapToInterval;
    const middle = list().props.initialScrollIndex;
    const scroll = jest.spyOn(list().instance, 'scrollToOffset');
    const event = (row: number) => ({
      nativeEvent: { contentOffset: { y: row * height } },
    });
    expect(list().props.data.slice(middle - 1, middle + 2)).toEqual([
      'C',
      'A',
      'B',
    ]);
    expect(list().props.accessibilityValue).toMatchObject({
      min: 0,
      max: 2,
      now: 0,
      text: 'A',
    });
    act(() => list().props.onScrollBeginDrag());
    act(() => list().props.onScroll(event(middle - 1)));
    expect(change).not.toHaveBeenCalled();
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
    expect(scroll).not.toHaveBeenCalled();
    act(() => list().props.onScrollEndDrag(event(middle - 1)));
    expect(interaction).toHaveBeenLastCalledWith(true);
    act(() => jest.advanceTimersByTime(200));
    expect(change).toHaveBeenLastCalledWith(2);
    expect(scroll).toHaveBeenLastCalledWith({
      offset: (middle + 2) * height,
      animated: false,
    });
    expect(interaction).toHaveBeenLastCalledWith(false);
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    act(() =>
      list().props.onAccessibilityAction({
        nativeEvent: { actionName: 'increment' },
      }),
    );
    expect(change).toHaveBeenLastCalledWith(0);
    expect(list().props.accessibilityValue.text).toBe('A');
    act(() =>
      list().props.onAccessibilityAction({
        nativeEvent: { actionName: 'decrement' },
      }),
    );
    expect(change).toHaveBeenLastCalledWith(2);
    expect(list().props.accessibilityValue.text).toBe('C');
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(3);
  } finally {
    act(() => view.unmount());
    jest.useRealTimers();
  }
});

it('keeps cyclic momentum active across multiple turns and emits logical indices only', () => {
  jest.useFakeTimers();
  const interaction = jest.fn(),
    change = jest.fn();
  function Harness() {
    const [selected, select] = useState(0);
    return (
      <AppPicker
        cyclic
        columns={[['A', 'B', 'C']]}
        labels={['Language']}
        selected={[selected]}
        onInteractionChange={interaction}
        onChange={(_, row) => {
          change(row);
          select(row);
        }}
      />
    );
  }
  let view!: ReturnType<typeof create>;
  act(() => {
    view = create(<Harness />);
  });
  try {
    const list = () => view.root.findByType(FlatList);
    const height = list().props.snapToInterval,
      middle = list().props.initialScrollIndex;
    const scroll = jest.spyOn(list().instance, 'scrollToOffset');
    const event = (row: number) => ({
      nativeEvent: { contentOffset: { y: row * height } },
    });
    act(() => list().props.onScrollBeginDrag());
    act(() => list().props.onScrollEndDrag(event(middle)));
    act(() => list().props.onMomentumScrollBegin());
    act(() => jest.advanceTimersByTime(120));
    expect(scroll).not.toHaveBeenCalled();
    expect(interaction).toHaveBeenLastCalledWith(true);
    act(() => list().props.onScroll(event(middle + 7)));
    expect(change).not.toHaveBeenCalled();
    act(() => list().props.onMomentumScrollEnd(event(middle + 8)));
    expect(change).toHaveBeenLastCalledWith(2);
    expect(scroll).toHaveBeenLastCalledWith({
      offset: (middle + 2) * height,
      animated: false,
    });
    expect(interaction).toHaveBeenLastCalledWith(false);
    expect(change.mock.calls.flat().every((n: number) => n >= 0 && n < 3)).toBe(
      true,
    );
  } finally {
    act(() => view.unmount());
    jest.useRealTimers();
  }
});

it('keeps a one-option cyclic wheel stable and a normal wheel bounded', () => {
  for (const cyclic of [false, true]) {
    const change = jest.fn();
    let view!: ReturnType<typeof create>;
    act(() => {
      view = create(
        <AppPicker
          cyclic={cyclic}
          columns={[['Only']]}
          labels={['Value']}
          selected={[0]}
          onChange={change}
        />,
      );
    });
    try {
      const list = view.root.findByType(FlatList);
      for (const actionName of ['increment', 'decrement'])
        act(() =>
          list.props.onAccessibilityAction({ nativeEvent: { actionName } }),
        );
      expect(change).not.toHaveBeenCalled();
      expect(list.props.data).toEqual(['Only']);
    } finally {
      act(() => view.unmount());
    }
  }
});

it('keeps ordinary multi-option wheels bounded at their last row', () => {
  const change = jest.fn();
  let view!: ReturnType<typeof create>;
  act(() => {
    view = create(
      <AppPicker
        columns={[['A', 'B', 'C']]}
        selected={[2]}
        labels={['Value']}
        onChange={change}
      />,
    );
  });
  try {
    const list = view.root.findByType(FlatList);
    expect(list.props.data).toEqual(['A', 'B', 'C']);
    act(() =>
      list.props.onAccessibilityAction({
        nativeEvent: { actionName: 'increment' },
      }),
    );
    expect(change).not.toHaveBeenCalled();
  } finally {
    act(() => view.unmount());
  }
});

it('does not cut off coast events when a platform omits momentum callbacks', () => {
  jest.useFakeTimers();
  const change = jest.fn(),
    interaction = jest.fn();
  let view!: ReturnType<typeof create>;
  act(() => {
    view = create(
      <AppPicker
        cyclic
        columns={[['A', 'B', 'C']]}
        selected={[0]}
        labels={['Language']}
        onChange={change}
        onInteractionChange={interaction}
      />,
    );
  });
  try {
    const list = () => view.root.findByType(FlatList);
    const middle = list().props.initialScrollIndex,
      height = list().props.snapToInterval;
    const scroll = jest.spyOn(list().instance, 'scrollToOffset');
    const event = (row: number) => ({
      nativeEvent: { contentOffset: { y: row * height } },
    });
    expect(list().props.decelerationRate).toBe('normal');
    act(() => list().props.onScrollBeginDrag());
    act(() => list().props.onScrollEndDrag(event(middle + 1)));
    for (let row = 2; row <= 8; row++) {
      act(() => jest.advanceTimersByTime(150));
      act(() => list().props.onScroll(event(middle + row)));
      expect(scroll).not.toHaveBeenCalled();
      expect(change).not.toHaveBeenCalled();
      expect(interaction).toHaveBeenLastCalledWith(true);
    }
    act(() => jest.advanceTimersByTime(200));
    expect(change).toHaveBeenCalledTimes(1);
    expect(change).toHaveBeenCalledWith(0, 2);
    expect(interaction).toHaveBeenLastCalledWith(false);
  } finally {
    act(() => view.unmount());
    jest.useRealTimers();
  }
});

it('clicks on user-crossed language rows but not mount, repeated offsets or silent recentering', () => {
  mockClick.mockClear();
  let view!: ReturnType<typeof create>;
  act(() => {
    view = create(
      <AppPicker
        cyclic
        audible
        columns={[['A', 'B', 'C']]}
        selected={[0]}
        labels={['Language']}
        onChange={() => {}}
      />,
    );
  });
  try {
    const list = view.root.findByType(FlatList);
    const middle = list.props.initialScrollIndex,
      height = list.props.snapToInterval;
    const event = {
      nativeEvent: { contentOffset: { y: (middle + 1) * height } },
    };
    expect(mockClick).not.toHaveBeenCalled();
    act(() => list.props.onScrollBeginDrag());
    act(() => list.props.onScroll(event));
    act(() => list.props.onScroll(event));
    expect(mockClick).toHaveBeenCalledTimes(1);
    act(() => list.props.onScrollEndDrag(event));
    act(() => list.props.onMomentumScrollEnd(event));
    act(() => list.props.onScroll(event));
    expect(mockClick).toHaveBeenCalledTimes(1);
  } finally {
    act(() => view.unmount());
  }
});
