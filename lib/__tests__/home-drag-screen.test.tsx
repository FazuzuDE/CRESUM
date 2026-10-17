import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AccessibilityInfo,
  Animated,
  AppState,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { HomeDashboard } from '../../components/HomeDashboard';
import { DashboardGrid } from '../../components/DashboardGrid';
import { AppButton } from '../../components/AppButton';
import { defaultTemplates } from '../workout-catalog';
import { HOME_LAYOUT_KEY } from '../home-layout';
const { act, create } = jest.requireActual('react-test-renderer');
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock',
  ),
);
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));
jest.mock('expo-blur', () => ({
  BlurView: jest.requireActual('react-native').View,
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: 'light' },
}));
jest.mock('react-native-gesture-handler', () => ({
  ...jest.requireActual('react-native-gesture-handler'),
  GestureDetector: jest.requireActual('react-native').View,
}));
beforeEach(async () => {
  await AsyncStorage.clear();
});
afterEach(() => jest.restoreAllMocks());
const original = ['week', 'primary', 'summary', 'latest', 'templates'];
const ids = (v: any) =>
  v.root.findByType(DashboardGrid).props.items.map((x: any) => x.id);
const button = (v: any, title: string) =>
  v.root.findAllByType(AppButton).find((x: any) => x.props.title === title);
const gesture = (v: any, id: string) =>
  v.root
    .findByProps({ testID: `home-drag-${id}` })
    .findAllByType(View)
    .find((x: any) => x.props.gesture?.config.activateAfterLongPress === 450)
    .props.gesture;
async function render() {
  const start = jest.fn();
  let v: any;
  await act(async () => {
    v = create(
      <HomeDashboard
        history={[]}
        activeWorkout={null}
        onResume={() => {}}
        startTemplate={start}
        templates={defaultTemplates}
      />,
    );
  });
  let y = 0;
  const heights = [100, 200, 84, 144, 100];
  ids(v).forEach((id: string, i: number) => {
    act(() => {
      v.root.findByType(DashboardGrid).props.onRowLayout(id, y);
      v.root.findByProps({ testID: `home-drag-${id}` }).props.onLayout({
        nativeEvent: { layout: { width: 340, height: heights[i], y: 0 } },
      });
    });
    y += heights[i] + 24;
  });
  return { v, start };
}
it('long-holds, drags unequal cards in a draft and saves only on Done', async () => {
  const { v, start } = await render();
  try {
    const releaseTap = button(v, 'Start Upper Body').props.onPress;
    const g = gesture(v, 'week');
    act(() => g.handlers.onStart({ absoluteY: 100 }));
    expect(button(v, 'Done')).toBeDefined();
    expect(v.root.findByType(ScrollView).props.scrollEnabled).toBe(false);
    act(() => releaseTap());
    expect(start).not.toHaveBeenCalled();
    act(() => g.handlers.onUpdate({ translationY: 700, absoluteY: 800 }));
    act(() => {
      g.handlers.onEnd({}, true);
      g.handlers.onFinalize({}, true);
    });
    expect(ids(v)).toEqual([
      'primary',
      'summary',
      'latest',
      'templates',
      'week',
    ]);
    expect(await AsyncStorage.getItem(HOME_LAYOUT_KEY)).toBeNull();
    expect(v.root.findByType(ScrollView).props.scrollEnabled).toBe(true);
    await act(async () => button(v, 'Done').props.onPress());
    expect(
      JSON.parse((await AsyncStorage.getItem(HOME_LAYOUT_KEY))!).widgets.map(
        (x: any) => x.id,
      ),
    ).toEqual(ids(v));
    expect(button(v, 'Done')).toBeUndefined();
    expect(Haptics.impactAsync).toHaveBeenCalled();
  } finally {
    await act(async () => v.unmount());
  }
});
it('cancels accessible edits and blocks a stale gesture release after Cancel', async () => {
  const { v } = await render();
  try {
    const g = gesture(v, 'week');
    act(() => g.handlers.onStart({ absoluteY: 100 }));
    act(() => g.handlers.onEnd({}, true));
    const move = v.root
      .findAllByType(View)
      .find((x: any) =>
        x.props.accessibilityLabel?.startsWith('Your week, position'),
      );
    act(() =>
      move.props.onAccessibilityAction({
        nativeEvent: { actionName: 'moveDown' },
      }),
    );
    expect(ids(v)[0]).toBe('primary');
    await act(async () => button(v, 'Cancel').props.onPress());
    act(() => g.handlers.onEnd({}, true));
    expect(ids(v)).toEqual(original);
    expect(await AsyncStorage.getItem(HOME_LAYOUT_KEY)).toBeNull();
  } finally {
    await act(async () => v.unmount());
  }
});
it('retains the draft on a failed save and permits retry', async () => {
  const { v } = await render();
  try {
    const g = gesture(v, 'week');
    act(() => g.handlers.onStart({ absoluteY: 100 }));
    act(() => g.handlers.onEnd({}, true));
    act(() =>
      v.root
        .findAllByType(View)
        .find((x: any) =>
          x.props.accessibilityLabel?.startsWith('Your week, position'),
        )
        .props.onAccessibilityAction({
          nativeEvent: { actionName: 'moveDown' },
        }),
    );
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(Error('full'));
    await act(async () => button(v, 'Done').props.onPress());
    expect(button(v, 'Done')).toBeDefined();
    expect(ids(v)[0]).toBe('primary');
    expect(JSON.stringify(v.toJSON())).toContain('Could not save Home layout');
    await act(async () => button(v, 'Done').props.onPress());
    expect(button(v, 'Done')).toBeUndefined();
  } finally {
    await act(async () => v.unmount());
  }
});
it('cancels an interrupted drag and ignores its late drop after backgrounding', async () => {
  const listeners: ((state: string) => void)[] = [];
  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_type, listener) => {
      listeners.push(listener as any);
      return { remove: jest.fn() };
    });
  const { v } = await render();
  try {
    const g = gesture(v, 'week');
    act(() => g.handlers.onStart({ absoluteY: 100 }));
    act(() => g.handlers.onUpdate({ translationY: 700, absoluteY: 800 }));
    act(() => listeners.forEach((f) => f('background')));
    act(() => g.handlers.onEnd({}, true));
    expect(ids(v)).toEqual(original);
    expect(await AsyncStorage.getItem(HOME_LAYOUT_KEY)).toBeNull();
  } finally {
    await act(async () => v.unmount());
  }
});
it('keeps reorder available while suppressing wobble with Reduce Motion', async () => {
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(true);
  const loop = jest.spyOn(Animated, 'loop');
  const { v } = await render();
  try {
    const g = gesture(v, 'week');
    act(() => g.handlers.onStart({ absoluteY: 100 }));
    expect(button(v, 'Done')).toBeDefined();
    expect(loop).not.toHaveBeenCalled();
  } finally {
    await act(async () => v.unmount());
  }
});

it('clears the lifted card immediately when Cancel interrupts a held gesture', async () => {
  const { v } = await render();
  try {
    const g = gesture(v, 'week');
    act(() => g.handlers.onStart({ absoluteY: 100 }));
    await act(async () => button(v, 'Cancel').props.onPress());
    const row = v.root.findByProps({ testID: 'home-drag-week' });
    expect(row.props.style[0].zIndex).toBe(0);
    act(() => g.handlers.onEnd({}, true));
    expect(ids(v)).toEqual(original);
  } finally {
    await act(async () => v.unmount());
  }
});

it('opens the accessible list on the same draft and cancels back without losing draft edits', async () => {
  const { v } = await render();
  try {
    const g = gesture(v, 'week');
    act(() => g.handlers.onStart({ absoluteY: 100 }));
    act(() => g.handlers.onEnd({}, true));
    act(() =>
      v.root
        .findAllByType(View)
        .find((x: any) =>
          x.props.accessibilityLabel?.startsWith('Your week, position'),
        )
        .props.onAccessibilityAction({
          nativeEvent: { actionName: 'moveDown' },
        }),
    );
    await act(async () => button(v, 'Order & visibility').props.onPress());
    const cancel = v.root
      .findAllByType(AppButton)
      .find((x: any) => x.props.title === 'Cancel');
    await act(async () => cancel.props.onPress());
    expect(button(v, 'Done')).toBeDefined();
    expect(ids(v)[0]).toBe('primary');
    await act(async () => button(v, 'Done').props.onPress());
    expect(
      JSON.parse((await AsyncStorage.getItem(HOME_LAYOUT_KEY))!).widgets[0].id,
    ).toBe('primary');
  } finally {
    await act(async () => v.unmount());
  }
});

it('bounds a taller held card by its edges at the first and last destination', async () => {
  const { v } = await render();
  try {
    const g = gesture(v, 'primary');
    act(() => g.handlers.onStart({ absoluteY: 200 }));
    act(() => g.handlers.onUpdate({ translationY: -1000, absoluteY: 0 }));
    let delta = v.root
      .findByProps({ testID: 'home-drag-primary' })
      .props.style[0].transform[0].translateY.__getValue();
    expect(delta).toBe(-124);
    act(() => g.handlers.onEnd({}, false));
    act(() => g.handlers.onStart({ absoluteY: 200 }));
    act(() => g.handlers.onUpdate({ translationY: 1000, absoluteY: 1200 }));
    delta = v.root
      .findByProps({ testID: 'home-drag-primary' })
      .props.style[0].transform[0].translateY.__getValue();
    expect(delta).toBe(400);
    act(() => g.handlers.onEnd({}, true));
    expect(ids(v).at(-1)).toBe('primary');
  } finally {
    await act(async () => v.unmount());
  }
});

it('lifts the entire grid row above its siblings during a drag', async () => {
  const { v } = await render();
  try {
    const g = gesture(v, 'week');
    act(() => g.handlers.onStart({ absoluteY: 100 }));
    const rows = v.root
      .findAllByType(View)
      .filter((n: any) => n.props.testID === 'dashboard-grid-row');
    expect(StyleSheet.flatten(rows[0].props.style).zIndex).toBe(1);
    expect(StyleSheet.flatten(rows[1].props.style).zIndex).toBe(0);
  } finally {
    await act(async () => v.unmount());
  }
});
