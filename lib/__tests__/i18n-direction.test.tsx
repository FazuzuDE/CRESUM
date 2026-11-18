import { Dock } from '../../components/Dock';
import { useState } from 'react';
import { Modal, TextInput, Text, View, StyleSheet } from 'react-native';
import {
  LayoutDirectionContext,
  LocalizedText,
  LocalizedTextInput,
  LocalizedModal,
  useLayoutDirection,
} from '../../components/LayoutDirection';
import { LocalizationProvider } from '../../components/LocalizationProvider';
import { LocaleStore } from '../i18n/preference-store';
import { textDirectionStyle, logicalIcon } from '../i18n/direction';
import { normalizedEntry } from '../set-entry';
import { parseBodyWeight } from '../body-weight';
jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual('react-native-safe-area-context'),
  SafeAreaView: jest.requireActual('react-native').View,
}));
const { act, create } = jest.requireActual('react-test-renderer');

it('mirrors logical labels and arrows but preserves centering, vertical icons and numeric value order', () => {
  expect(textDirectionStyle('rtl', 'left')).toMatchObject({
    writingDirection: 'rtl',
    textAlign: 'right',
    direction: 'ltr',
  });
  expect(textDirectionStyle('rtl', 'right').textAlign).toBe('left');
  expect(textDirectionStyle('rtl', 'center').textAlign).toBe('center');
  expect(textDirectionStyle('ltr', 'right').textAlign).toBe('right');
  expect(logicalIcon('chevron-forward', 'rtl')).toBe('chevron-back');
  expect(logicalIcon('arrow-up', 'rtl')).toBe('arrow-up');
  expect(
    normalizedEntry({ weight: '١٢٫٥٠', reps: '٨', otherSideReps: '٩' }),
  ).toEqual({ weight: '12.50', reps: '8', otherSideReps: '9' });
  expect(parseBodyWeight('٨٢٫١٢٥')).toBe(82.125);
  expect(
    normalizedEntry({ weight: '１２．５０', reps: '８', otherSideReps: '９' }),
  ).toEqual({ weight: '12.50', reps: '8', otherSideReps: '9' });
});

it('switches live RTL/LTR including modal roots without remounting or rewriting an unfinished draft', async () => {
  const store = new LocaleStore(
    { getItem: async () => null, setItem: async () => {} },
    () => ['en'],
  );
  let mounts = 0;
  function Probe() {
    const [draft, setDraft] = useState(() => {
      mounts++;
      return '12,';
    });
    const direction = useLayoutDirection();
    return (
      <LocalizedModal visible>
        <View testID="direction-probe" style={{ direction }}>
          <LocalizedText style={{ textAlign: 'left' }}>
            Mixed 12 نص
          </LocalizedText>
          <LocalizedTextInput
            value={draft}
            keyboardType="decimal-pad"
            onChangeText={setDraft}
          />
        </View>
      </LocalizedModal>
    );
  }
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(
      <LocalizationProvider store={store}>
        <Probe />
      </LocalizationProvider>,
    );
  });
  await act(async () => {
    await store.select('ar');
  });
  expect(
    view!.root.findByProps({ testID: 'direction-probe' }).props.style.direction,
  ).toBe('rtl');
  expect(
    StyleSheet.flatten(view!.root.findByType(Text).props.style),
  ).toMatchObject({ writingDirection: 'rtl', textAlign: 'right' });
  expect(
    view!.root
      .findByType(Modal)
      .findAllByType(View)
      .some(
        (v: { props: { style: unknown } }) =>
          StyleSheet.flatten(v.props.style as never)?.direction === 'rtl',
      ),
  ).toBe(true);
  expect(view!.root.findByType(TextInput).props.value).toBe('12,');
  act(() => view!.root.findByType(TextInput).props.onChangeText('١٢٫٥٠'));
  expect(view!.root.findByType(TextInput).props.value).toBe('12.50');
  await act(async () => {
    await store.select('ja');
  });
  expect(view!.root.findByType(TextInput).props.value).toBe('12.50');
  expect(mounts).toBe(1);
  expect(store.getSnapshot().locale).toBe('ja');
  expect(
    view!.root.findByProps({ testID: 'direction-probe' }).props.style.direction,
  ).toBe('ltr');
  expect(
    StyleSheet.flatten(view!.root.findByType(Text).props.style),
  ).toMatchObject({ writingDirection: 'ltr', textAlign: 'left' });
  act(() => view!.root.findByType(TextInput).props.onChangeText('１２．５０'));
  expect(view!.root.findByType(TextInput).props.value).toBe('12.50');
  act(() => view!.unmount());
});

it('keeps the dock pill under the visually selected tab in RTL without relying on device direction', async () => {
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(
      <LayoutDirectionContext.Provider value="rtl">
        <Dock active="home" onChange={() => {}} />
      </LayoutDirectionContext.Provider>,
    );
  });
  type HostNode = { props: Record<string, unknown>; children?: HostNode[] };
  const nodes = (): HostNode[] => {
    const walk = (node: HostNode): HostNode[] =>
      !node || typeof node !== 'object'
        ? []
        : [node, ...(node.children ?? []).flatMap(walk)];
    return walk(view!.toJSON());
  };
  expect(
    nodes()
      .filter((n) => n.props.accessibilityRole === 'tab')
      .map((n) => n.props.accessibilityLabel),
  ).toEqual(['Profile', 'Progress', 'Workout', 'Home']);
  const row = nodes().find(
    (n) =>
      typeof n.props.onLayout === 'function' &&
      StyleSheet.flatten(n.props.style as never)?.direction === 'ltr',
  )!;
  act(() =>
    (row.props.onLayout as (event: unknown) => void)({
      nativeEvent: { layout: { width: 400 } },
    }),
  );
  const pill = nodes().find((n) => {
    const style = StyleSheet.flatten(n.props.style as never);
    return (
      style?.position === 'absolute' &&
      style?.start === 0 &&
      style?.width === 100
    );
  })!;
  expect(
    StyleSheet.flatten(pill.props.style as never).transform[0].translateX,
  ).toBe(300);
  act(() => view!.unmount());
});
