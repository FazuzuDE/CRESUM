import { WorkoutTemplates } from '../../components/WorkoutTemplates';
import { AppButton } from '../../components/AppButton';
import { Confirmation } from '../../components/Confirmation';
import { LocalizationProvider } from '../../components/LocalizationProvider';
import { LocaleStore } from '../i18n/preference-store';
import { defaultTemplates } from '../workout-catalog';
import { isPressable } from './pressable';
const { act, create } = jest.requireActual('react-test-renderer');
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
}));
jest.mock('expo-blur', () => ({
  BlurView: jest.requireActual('react-native').View,
}));
jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => ({
  __esModule: true,
  default: jest.requireActual('react-native').View,
}));
it('preserves custom names, menu selection and delete target across languages without exposing diagnostics', async () => {
  const locale = new LocaleStore(
    {
      getItem: async () => JSON.stringify({ version: 1, preference: 'ru' }),
      setItem: async () => {},
    },
    () => ['en'],
  );
  const custom = {
    ...defaultTemplates[0],
    id: 'custom-translation',
    name: defaultTemplates[0].name,
  };
  const templates = [defaultTemplates[0], custom];
  const before = JSON.stringify(templates);
  const onDelete = jest.fn(async () => ({
    ok: false as const,
    error: 'SECRET_DIAGNOSTIC',
  }));
  const onStart = jest.fn();
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(
      <LocalizationProvider store={locale}>
        <WorkoutTemplates
          templates={templates}
          busy={false}
          onCreate={jest.fn()}
          onUpdate={jest.fn()}
          onDelete={onDelete}
          onStart={onStart}
        />
      </LocalizationProvider>,
    );
  });
  const press = async (title: string) => {
    const b = view!.root
      .findAllByType(AppButton)
      .find((n: { props: { title: string } }) => n.props.title === title);
    expect(b).toBeDefined();
    await act(async () => {
      await b!.props.onPress();
    });
  };
  try {
    const more = view!.root
      .findAll(isPressable)
      .find(
        (n: { props: { accessibilityLabel?: string } }) =>
          n.props.accessibilityLabel === `Другие действия для ${custom.name}`,
      );
    expect(more).toBeDefined();
    await act(async () => {
      more!.props.onPress();
    });
    await act(async () => {
      await locale.select('de');
    });
    await press('Löschen');
    expect(view!.root.findByType(Confirmation).props.message).toContain(
      custom.name,
    );
    await act(async () => {
      await view!.root.findByType(Confirmation).props.onConfirm();
    });
    expect(onDelete).toHaveBeenCalledWith(custom.id);
    await act(async () => {
      await locale.select('fr');
    });
    expect(view!.root.findByType(Confirmation).props.visible).toBe(true);
    expect(view!.root.findByType(Confirmation).props.error).toBe(
      'Impossible de supprimer cet entraînement. Réessaie.',
    );
    expect(JSON.stringify(view!.toJSON())).not.toContain('SECRET_DIAGNOSTIC');
    expect(JSON.stringify(templates)).toBe(before);
    expect(onStart).not.toHaveBeenCalled();
  } finally {
    act(() => view!.unmount());
  }
});
