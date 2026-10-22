import { SetEntrySheet } from '../../components/SetEntrySheet';
import { AppPicker } from '../../components/AppPicker';
import { AppButton } from '../../components/AppButton';
import { LocalizationProvider } from '../../components/LocalizationProvider';
import { LocaleStore } from '../i18n/preference-store';
const { act, create } = jest.requireActual('react-test-renderer');
it('localizes wheel display without changing row selection or saved canonical values', async () => {
  const locale = new LocaleStore(
    {
      getItem: async () => JSON.stringify({ version: 1, preference: 'ru' }),
      setItem: async () => {},
    },
    () => ['en'],
  );
  const save = jest.fn();
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(
      <LocalizationProvider store={locale}>
        <SetEntrySheet
          set={{ id: 's', weight: '12.1234567890123456789', reps: '10' }}
          setNumber={1}
          libraryId="barbell-bench-press"
          onSave={save}
          onCancel={() => {}}
        />
      </LocalizationProvider>,
    );
  });
  try {
    let picker = view!.root.findByType(AppPicker);
    const row = picker.props.selected[0];
    expect(picker.props.columns[0][row]).toBe('12,1234567890123456789');
    await act(async () => {
      await locale.select('en');
    });
    picker = view!.root.findByType(AppPicker);
    expect(picker.props.selected[0]).toBe(row);
    expect(picker.props.columns[0][row]).toBe('12.1234567890123456789');
    const button = view!.root
      .findAllByType(AppButton)
      .find(
        (n: { props: { accessibilityLabel?: string } }) =>
          n.props.accessibilityLabel === 'Save set values',
      )!;
    act(() => button.props.onPress());
    expect(save).toHaveBeenCalledWith({
      weight: '12.1234567890123456789',
      reps: '10',
    });
  } finally {
    act(() => view!.unmount());
  }
});
