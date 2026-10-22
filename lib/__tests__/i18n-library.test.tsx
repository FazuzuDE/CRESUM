import { TextInput, Text } from 'react-native';
import { ExerciseLibrary } from '../../components/ExerciseLibrary';
import { LocalizationProvider } from '../../components/LocalizationProvider';
import { LocaleStore } from '../i18n/preference-store';
const { act, create } = jest.requireActual('react-test-renderer');
it('renders localized catalog choices and searches without adapting persisted exercise records', async () => {
  const store = new LocaleStore(
    {
      getItem: async () => JSON.stringify({ version: 1, preference: 'de' }),
      setItem: async () => {},
    },
    () => ['en'],
  );
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(
      <LocalizationProvider store={store}>
        <ExerciseLibrary visible onClose={() => {}} />
      </LocalizationProvider>,
    );
  });
  const text = () =>
    view!.root
      .findAllByType(Text)
      .map((n: { props: { children: unknown } }) => n.props.children);
  expect(text()).toContain('Übungsbibliothek');
  expect(text()).toContain('Langhantel-Bankdrücken');
  act(() => view!.root.findByType(TextInput).props.onChangeText('Bankdrücken'));
  expect(text()).not.toContain('Wadenheben im Stehen');
  await act(async () => {
    await store.select('ru');
  });
  act(() => view!.root.findByType(TextInput).props.onChangeText('Жим штанги'));
  expect(text()).toContain('Жим штанги лёжа');
  act(() => view!.unmount());
});
