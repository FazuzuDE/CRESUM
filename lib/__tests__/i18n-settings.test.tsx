import { useState } from 'react';
import { Modal, Text, TextInput } from 'react-native';
import {
  LocalizationProvider,
  useLocalization,
} from '../../components/LocalizationProvider';
import { LocaleStore } from '../i18n/preference-store';
import { LanguageSettings } from '../../components/LanguageSettings';
import { AppPicker } from '../../components/AppPicker';
import { GlassMaterial } from '../../components/GlassMaterial';
import { AppButton } from '../../components/AppButton';
const { act, create } = jest.requireActual('react-test-renderer');
it('starts alphabetically, stages wheel choices, and saves only with Done', async () => {
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
    act(() => view!.root.findAllByType(AppButton)[0].props.onPress());
  const buttons = () => view!.root.findByType(Modal).findAllByType(AppButton);
  open();
  expect(view!.root.findByType(GlassMaterial).props.transparency).toBe(30);
  expect(view!.root.findByType(AppPicker).props.columns[0]).toEqual([
    '🇩🇪  Deutsch',
    '🇬🇧  English',
    '🇪🇸  Español',
    '🇫🇷  Français',
    '🇮🇹  Italiano',
    '🇵🇱  Polski',
    '🇧🇷  Português (Brasil)',
    '🇹🇷  Türkçe',
    '🇷🇺  Русский',
    '🇺🇦  Українська',
    '🇨🇳  简体中文',
  ]);
  expect(view!.root.findByType(AppPicker).props.selected).toEqual([0]);
  expect(buttons()[0].props.title).toBe('🌐  System language');
  act(() => view!.root.findByType(AppPicker).props.onChange(0, 10));
  expect(store.getSnapshot().preference).toBe('system');
  act(() => buttons()[1].props.onPress());
  open();
  expect(view!.root.findByType(AppPicker).props.selected).toEqual([0]);
  act(() => view!.root.findByType(AppPicker).props.onChange(0, 10));
  await act(async () => buttons()[2].props.onPress());
  expect(store.getSnapshot()).toMatchObject({
    preference: 'zh-Hans',
    locale: 'zh-Hans',
  });
  expect(view!.root.findAllByType(Modal)).toHaveLength(0);
  open();
  expect(view!.root.findByType(AppPicker).props.selected).toEqual([0]);
  act(() => buttons()[0].props.onPress());
  expect(buttons()[0].props.selected).toBe(true);
  await act(async () => buttons()[2].props.onPress());
  expect(store.getSnapshot().preference).toBe('system');
  act(() => view!.unmount());
});
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
  act(() => view!.root.findByType(AppPicker).props.onChange(0, 8));
  const confirm = () =>
    view!.root.findByType(Modal).findAllByType(AppButton)[2];
  await act(async () => confirm().props.onPress());
  expect(store.getSnapshot().preference).toBe('system');
  expect(view!.root.findByType(AppPicker).props.selected).toEqual([8]);
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
  expect(view!.root.findByType(TextInput).props.value).toBe('12,');
  expect(mounts).toBe(1);
  act(() => view!.unmount());
});
