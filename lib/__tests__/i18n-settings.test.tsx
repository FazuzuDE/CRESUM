import { useState } from 'react';
import { Text, TextInput } from 'react-native';
import {
  LocalizationProvider,
  useLocalization,
} from '../../components/LocalizationProvider';
import { LocaleStore } from '../i18n/preference-store';
import { LanguageSettings } from '../../components/LanguageSettings';
import { AppButton } from '../../components/AppButton';
const { act, create } = jest.requireActual('react-test-renderer');
it('exposes the current choice to accessibility and hides unfinished locales', async () => {
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
  const buttons = view!.root.findAllByType(AppButton);
  expect(
    buttons.find((b: { props: { title: string } }) =>
      b.props.title.startsWith('System language'),
    )?.props.selected,
  ).toBe(true);
  expect(
    buttons.some((b: { props: { title: string } }) =>
      b.props.title.includes('Русский'),
    ),
  ).toBe(false);
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
