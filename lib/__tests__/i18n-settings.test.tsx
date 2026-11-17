import { useState } from 'react';
import { Modal, Text, TextInput } from 'react-native';
import {
  LocalizationProvider,
  useLocalization,
} from '../../components/LocalizationProvider';
import { LocaleStore } from '../i18n/preference-store';
import { LanguageSettings } from '../../components/LanguageSettings';
import { AppButton } from '../../components/AppButton';
const { act, create } = jest.requireActual('react-test-renderer');
it('puts System first and allows a manual choice from every available language', async () => {
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
  act(() => view!.root.findByType(AppButton).props.onPress());
  const buttons = view!.root.findByType(Modal).findAllByType(AppButton);
  expect(
    buttons
      .slice(0, -1)
      .map((b: { props: { title: string } }) => b.props.title),
  ).toEqual([
    '🌐  System language ✓',
    '🇩🇪  Deutsch',
    '🇬🇧  English',
    '🇪🇸  Español',
    '🇫🇷  Français',
    '🇧🇷  Português (Brasil)',
    '🇷🇺  Русский',
    '🇺🇦  Українська',
  ]);
  expect(buttons[0].props.selected).toBe(true);
  expect(buttons[5].props.accessibilityLabel).toBe('Português (Brasil)');
  await act(async () => {
    buttons[5].props.onPress();
  });
  expect(store.getSnapshot()).toMatchObject({
    preference: 'pt-BR',
    locale: 'pt-BR',
  });
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
  expect(mounts).toBe(1);
  act(() => view!.unmount());
});
