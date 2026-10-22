import { HomeDashboard } from '../../components/HomeDashboard';
import { HomeLayoutEditor } from '../../components/HomeLayoutEditor';
import { CalendarMonth } from '../../components/CalendarMonth';
import { LocalizationProvider } from '../../components/LocalizationProvider';
import { AppButton } from '../../components/AppButton';
import { LocaleStore } from '../i18n/preference-store';
import { defaultTemplates } from '../workout-catalog';
import { HOME_LAYOUT_KEY } from '../home-layout';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
it('changes Home language with calendar selection and unsaved layout preserved', async () => {
  await AsyncStorage.clear();
  const locale = new LocaleStore(
    {
      getItem: async () => JSON.stringify({ version: 1, preference: 'ru' }),
      setItem: async () => {},
    },
    () => ['en'],
  );
  let view: ReturnType<typeof create>;
  const start = jest.fn();
  await act(async () => {
    view = create(
      <LocalizationProvider store={locale}>
        <HomeDashboard
          history={[]}
          activeWorkout={null}
          templates={defaultTemplates}
          startTemplate={start}
          onResume={() => {}}
        />
      </LocalizationProvider>,
    );
  });
  const press = async (title: string) => {
    const button = view!.root
      .findAllByType(AppButton)
      .find((n: { props: { title: string } }) => n.props.title === title);
    expect(button).toBeDefined();
    await act(async () => {
      await button!.props.onPress();
    });
  };
  try {
    await press('Месяц');
    let calendar = view!.root.findByType(CalendarMonth);
    const selected = calendar.props.month + 5 * 86400000;
    act(() => calendar.props.onSelect(selected));
    await act(async () => {
      await locale.select('de');
    });
    calendar = view!.root.findByType(CalendarMonth);
    expect(calendar.props.selected).toBe(selected);
    expect(JSON.stringify(view!.toJSON())).toContain(
      'Keine abgeschlossenen Trainings an diesem Datum.',
    );
    await press('Kalender schließen');
    await press('Startseite anpassen');
    const editor = view!.root.findByType(HomeLayoutEditor);
    const switches = view!.root.findAll(
      (n: { props: { accessibilityLabel?: string } }) =>
        n.props.accessibilityLabel === 'Anzeigen: Deine Woche',
    );
    act(() =>
      switches
        .find(
          (n: { props: { onValueChange?: unknown } }) => n.props.onValueChange,
        )!
        .props.onValueChange(false),
    );
    await act(async () => {
      await locale.select('fr');
    });
    expect(view!.root.findByType(HomeLayoutEditor)).toBe(editor);
    const toggle = view!.root.findAll(
      (n: {
        props: { accessibilityLabel?: string; onValueChange?: unknown };
      }) =>
        n.props.accessibilityLabel === 'Afficher : Ta semaine' &&
        Boolean(n.props.onValueChange),
    )[0];
    expect(toggle.props.value).toBe(false);
    await press('Enregistrer la disposition');
    await act(async () => {});
    const saved = JSON.parse((await AsyncStorage.getItem(HOME_LAYOUT_KEY))!);
    expect(
      saved.widgets.find((w: { id: string }) => w.id === 'week').visible,
    ).toBe(false);
    expect(start).not.toHaveBeenCalled();
  } finally {
    await act(async () => {
      view!.unmount();
    });
  }
});
