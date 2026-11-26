import { useState } from 'react';
import type { ReactTestInstance } from 'react-test-renderer';
import { FlatList, Modal, StyleSheet, Text, TextInput } from 'react-native';
import {
  LocalizationProvider,
  useLocalization,
} from '../../components/LocalizationProvider';
import { LocaleStore } from '../i18n/preference-store';
import { localeRegistry } from '../i18n/registry';
import { LanguageSettings } from '../../components/LanguageSettings';
import { AppPicker } from '../../components/AppPicker';
import { GlassMaterial } from '../../components/GlassMaterial';
import { AppButton } from '../../components/AppButton';
const { act, create } = jest.requireActual('react-test-renderer');
it('opens at the effective language, stages wheel choices, and saves only with Done', async () => {
  const store = new LocaleStore(
    { getItem: async () => null, setItem: async () => {} },
    () => ['en'],
  );
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(
      <LocalizationProvider store={store}>
        <LanguageSettings />
      </LocalizationProvider>,
    );
  });
  const open = () =>
    act(async () => view!.root.findAllByType(AppButton)[0].props.onPress());
  const buttons = () => view!.root.findByType(Modal).findAllByType(AppButton);
  const row = (name: string) =>
    view!.root.findByType(AppPicker).props.columns[0].indexOf(name);
  await open();
  expect(view!.root.findByType(GlassMaterial).props.transparency).toBe(10);
  expect(view!.root.findByType(AppPicker).props.cyclic).toBe(true);
  expect(view!.root.findByType(AppPicker).props.columns[0]).toEqual([
    '🇮🇩  Bahasa Indonesia',
    '🇩🇪  Deutsch',
    '🇬🇧  English',
    '🇪🇸  Español',
    '🇫🇷  Français',
    '🇮🇹  Italiano',
    '🇳🇱  Nederlands',
    '🇵🇱  Polski',
    '🇧🇷  Português (Brasil)',
    '🇸🇪  Svenska',
    '🇻🇳  Tiếng Việt',
    '🇹🇷  Türkçe',
    '🇷🇺  Русский',
    '🇺🇦  Українська',
    '🇸🇦  العربية',
    '🇮🇳  मराठी',
    '🇮🇳  हिन्दी',
    '🇧🇩  বাংলা',
    '🇹🇭  ไทย',
    '🇰🇷  한국어',
    '🇯🇵  日本語',
    '🇨🇳  简体中文',
  ]);
  expect(view!.root.findByType(AppPicker).props.selected).toEqual([
    row('🇬🇧  English'),
  ]);
  expect(buttons()[0].props.title).toBe('🌐  System language ✓');
  act(() =>
    view!.root.findByType(AppPicker).props.onChange(0, row('🇮🇳  हिन्दी')),
  );
  expect(store.getSnapshot().preference).toBe('system');
  act(() => buttons()[1].props.onPress());
  await open();
  expect(view!.root.findByType(AppPicker).props.selected).toEqual([
    row('🇬🇧  English'),
  ]);
  act(() =>
    view!.root.findByType(AppPicker).props.onChange(0, row('🇮🇳  हिन्दी')),
  );
  await act(async () => buttons()[2].props.onPress());
  expect(store.getSnapshot()).toMatchObject({
    preference: 'hi',
    locale: 'hi',
  });
  expect(view!.root.findAllByType(Modal)).toHaveLength(0);
  await open();
  expect(view!.root.findByType(AppPicker).props.selected).toEqual([
    row('🇮🇳  हिन्दी'),
  ]);
  act(() => buttons()[0].props.onPress());
  expect(buttons()[0].props.selected).toBe(true);
  expect(view!.root.findByType(AppPicker).props.selected).toEqual([
    row('🇬🇧  English'),
  ]);
  expect(store.getSnapshot().preference).toBe('hi');
  await act(async () => buttons()[2].props.onPress());
  expect(store.getSnapshot().preference).toBe('system');
  act(() => view!.unmount());
});
it.each(['de-DE', 'ja-JP', 'vi-VN', 'mr-IN', 'id-ID', 'ko-KR'])(
  'centers the resolved device language for %s without saving',
  async (tag) => {
    const write = jest.fn(async () => {});
    const store = new LocaleStore(
      { getItem: async () => null, setItem: write },
      () => [tag],
    );
    let view: ReturnType<typeof create>;
    await act(async () => {
      view = create(
        <LocalizationProvider store={store}>
          <LanguageSettings compact />
        </LocalizationProvider>,
      );
    });
    await act(async () => view!.root.findByType(AppButton).props.onPress());
    const picker = view!.root.findByType(AppPicker);
    expect(picker.props.columns[0][picker.props.selected[0]]).toBe(
      tag === 'de-DE'
        ? '🇩🇪  Deutsch'
        : tag === 'ja-JP'
          ? '🇯🇵  日本語'
          : tag === 'vi-VN'
            ? '🇻🇳  Tiếng Việt'
            : tag === 'mr-IN'
              ? '🇮🇳  मराठी'
              : tag === 'id-ID'
                ? '🇮🇩  Bahasa Indonesia'
                : '🇰🇷  한국어',
    );
    expect(
      view!.root.findByType(Modal).findAllByType(AppButton)[0].props.selected,
    ).toBe(true);
    expect(write).not.toHaveBeenCalled();
    act(() => view!.unmount());
  },
);
it('keeps a failed language draft available for retry', async () => {
  let fail = true;
  const store = new LocaleStore(
    {
      getItem: async () => null,
      setItem: async () => {
        if (fail) throw Error('storage');
      },
    },
    () => ['en'],
  );
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(
      <LocalizationProvider store={store}>
        <LanguageSettings />
      </LocalizationProvider>,
    );
  });
  act(() => view!.root.findByType(AppButton).props.onPress());
  const russian = view!.root
    .findByType(AppPicker)
    .props.columns[0].indexOf('🇷🇺  Русский');
  act(() => view!.root.findByType(AppPicker).props.onChange(0, russian));
  const confirm = () =>
    view!.root.findByType(Modal).findAllByType(AppButton)[2];
  await act(async () => confirm().props.onPress());
  expect(store.getSnapshot().preference).toBe('system');
  expect(view!.root.findByType(AppPicker).props.selected).toEqual([russian]);
  expect(confirm().props.title).toBe('Retry');
  fail = false;
  await act(async () => confirm().props.onPress());
  expect(store.getSnapshot().preference).toBe('ru');
  expect(view!.root.findAllByType(Modal)).toHaveLength(0);
  act(() => view!.unmount());
});
it('switches live content without remounting a draft or resetting its value', async () => {
  const store = new LocaleStore(
    { getItem: async () => null, setItem: async () => {} },
    () => ['en'],
  );
  let mounts = 0;
  function Editor() {
    const { t } = useLocalization();
    const [draft, change] = useState(() => {
      ++mounts;
      return '12,';
    });
    return (
      <>
        <Text>{t('common.retry')}</Text>
        <TextInput value={draft} onChangeText={change} />
      </>
    );
  }
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(
      <LocalizationProvider store={store}>
        <Editor />
      </LocalizationProvider>,
    );
  });
  await act(async () => {
    await store.select('ru');
  });
  expect(view!.root.findByType(Text).props.children).toBe('Повторить');
  expect(view!.root.findByType(TextInput).props.value).toBe('12,');
  await act(async () => {
    await store.select('de');
    await store.select('fr');
  });
  expect(view!.root.findByType(Text).props.children).toBe('Réessayer');
  await act(async () => {
    await store.select('zh-Hans');
  });
  expect(view!.root.findByType(Text).props.children).toBe('重试');
  await act(async () => {
    await store.select('hi');
  });
  expect(view!.root.findByType(Text).props.children).toBe('फिर प्रयास करें');
  expect(view!.root.findByType(TextInput).props.value).toBe('12,');
  await act(async () => {
    await store.select('bn');
  });
  expect(view!.root.findByType(Text).props.children).toBe('আবার চেষ্টা করুন');
  expect(view!.root.findByType(TextInput).props.value).toBe('12,');
  await act(async () => {
    await store.select('ja');
  });
  expect(view!.root.findByType(Text).props.children).toBe('再試行');
  expect(view!.root.findByType(TextInput).props.value).toBe('12,');
  await act(async () => {
    await store.select('vi');
  });
  expect(view!.root.findByType(Text).props.children).toBe('Thử lại');
  expect(view!.root.findByType(TextInput).props.value).toBe('12,');
  await act(async () => {
    await store.select('mr');
  });
  expect(view!.root.findByType(Text).props.children).toBe('पुन्हा प्रयत्न करा');
  expect(view!.root.findByType(TextInput).props.value).toBe('12,');
  await act(async () => {
    await store.select('id');
  });
  expect(view!.root.findByType(Text).props.children).toBe('Coba lagi');
  expect(view!.root.findByType(TextInput).props.value).toBe('12,');
  await act(async () => {
    await store.select('ko');
  });
  expect(view!.root.findByType(Text).props.children).toBe('다시 시도');
  expect(view!.root.findByType(TextInput).props.value).toBe('12,');
  expect(mounts).toBe(1);
  act(() => view!.unmount());
});

it('keeps a cyclic language draft unsaved until motion settles and Done is pressed', async () => {
  const write = jest.fn(async () => {});
  const store = new LocaleStore(
    { getItem: async () => null, setItem: write },
    () => ['en'],
  );
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(
      <LocalizationProvider store={store}>
        <LanguageSettings />
      </LocalizationProvider>,
    );
  });
  try {
    act(() => view.root.findByType(AppButton).props.onPress());
    const list = () => view.root.findByType(FlatList);
    const event = {
      nativeEvent: {
        contentOffset: {
          y:
            (list().props.initialScrollIndex - 1) * list().props.snapToInterval,
        },
      },
    };
    const done = () => view.root.findByType(Modal).findAllByType(AppButton)[2];
    const system = () =>
      view.root
        .findByType(Modal)
        .findAllByType(AppButton)[0]
        .find(
          (node: ReactTestInstance) =>
            typeof node.type === 'string' &&
            node.props.accessibilityRole === 'button',
        );
    const systemStyle = () => StyleSheet.flatten(system().props.style);
    const idleSystemStyle = systemStyle();
    const columnsBeforeDrag = view.root.findByType(AppPicker).props.columns;
    act(() => {
      list().props.onScrollBeginDrag();
      list().props.onScroll(event);
    });
    expect(done().props.disabled).toBe(true);
    expect(system().props.accessibilityState.disabled).toBe(true);
    expect(systemStyle()).toEqual(idleSystemStyle);
    expect(view.root.findByType(AppPicker).props.columns).toBe(
      columnsBeforeDrag,
    );
    expect(write).not.toHaveBeenCalled();
    act(() => {
      list().props.onScrollEndDrag(event);
      list().props.onMomentumScrollBegin();
    });
    expect(done().props.disabled).toBe(true);
    expect(systemStyle()).toEqual(idleSystemStyle);
    act(() => list().props.onMomentumScrollEnd(event));
    expect(done().props.disabled).toBe(false);
    expect(system().props.accessibilityState.disabled).toBe(false);
    await act(async () => done().props.onPress());
    expect(store.getSnapshot().preference).toBe('de');
    expect(write).toHaveBeenCalledTimes(1);
  } finally {
    act(() => view.unmount());
  }
});

it('automatically lists a newly registered language and its registry flag without a separate menu entry', async () => {
  Object.defineProperty(localeRegistry, 'zz', {
    configurable: true,
    enumerable: true,
    value: {
      nativeName: 'Test Language',
      flag: '🏳️',
      direction: 'ltr',
      released: false,
    },
  });
  let view: ReturnType<typeof create> | undefined;
  try {
    const store = new LocaleStore(
      { getItem: async () => null, setItem: async () => {} },
      () => ['en'],
    );
    await act(async () => {
      view = create(
        <LocalizationProvider store={store}>
          <LanguageSettings />
        </LocalizationProvider>,
      );
    });
    act(() => view!.root.findByType(AppButton).props.onPress());
    const items = view!.root.findByType(AppPicker).props.columns[0];
    expect(items).toContain('🏳️  Test Language');
    expect(items.indexOf('🏳️  Test Language')).toBeLessThan(
      items.indexOf('🇻🇳  Tiếng Việt'),
    );
    expect(items).toHaveLength(Object.keys(localeRegistry).length);
  } finally {
    if (view) act(() => view.unmount());
    delete (localeRegistry as Record<string, unknown>).zz;
  }
});
