import { TextInput, Text, Alert } from 'react-native';
import { HomeDashboard } from '../../components/HomeDashboard';
import { WorkoutStore } from '../workout-store';
import { defaultTemplates } from '../workout-catalog';
import { makeAssignment } from '../training-programs/assignment';
import { selectProgram } from '../training-programs/selectors';
import { projectProgramWeek } from '../training-programs/schedule';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../../app/index';
import { Workout } from '../../components/Workout';
import { SetEntrySheet } from '../../components/SetEntrySheet';
import { AppButton } from '../../components/AppButton';
import { Confirmation } from '../../components/Confirmation';
import { LocalizationProvider } from '../../components/LocalizationProvider';
import { LocaleStore } from '../i18n/preference-store';
import { STATE_KEY } from '../workout-repository';
import { completeOnboardingForTest } from './onboarding-fixture';
import { isPressable } from './pressable';
const { act, create } = jest.requireActual('react-test-renderer');
let mounted: ReturnType<typeof create> | undefined;
afterEach(() => {
  act(() => mounted?.unmount());
  mounted = undefined;
  jest.restoreAllMocks();
});
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

it('localizes normal and planned start failures without leaking diagnostic text or creating a session', async () => {
  await AsyncStorage.clear();
  await completeOnboardingForTest();
  const start = jest
    .spyOn(WorkoutStore.prototype, 'start')
    .mockImplementation(() => {
      throw Error('SECRET_DIAGNOSTIC');
    });
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const locale = new LocaleStore(
    { getItem: async () => null, setItem: async () => {} },
    () => ['en'],
  );
  await act(async () => {
    mounted = create(
      <LocalizationProvider store={locale}>
        <App />
      </LocalizationProvider>,
    );
  });
  const a = makeAssignment(
    selectProgram('get_stronger', 'beginner')!,
    'start-error',
    '2026-10-22',
  );
  const slot = projectProgramWeek(a, [], '2026-10-22').nextSlot!;
  await act(async () => {
    await locale.select('ru');
  });
  act(() =>
    mounted!.root
      .findByType(HomeDashboard)
      .props.startTemplate(defaultTemplates[0]),
  );
  expect(alert).toHaveBeenLastCalledWith(
    'Не удалось начать тренировку',
    expect.not.stringContaining('SECRET_DIAGNOSTIC'),
  );
  await act(async () => {
    await locale.select('fr');
  });
  act(() =>
    mounted!.root
      .findByType(HomeDashboard)
      .props.startProgramSlot(slot, a.templates[0]),
  );
  expect(alert).toHaveBeenLastCalledWith(
    'Impossible de démarrer l’entraînement planifié',
    expect.not.stringContaining('SECRET_DIAGNOSTIC'),
  );
  expect(start).toHaveBeenCalledTimes(2);
  expect(start).toHaveBeenLastCalledWith(a.templates[0], slot.context);
  expect(mounted!.root.findAllByType(Workout)).toHaveLength(0);
  const saved = await AsyncStorage.getItem(STATE_KEY);
  expect(saved ? JSON.parse(saved).activeWorkout : null).toBeNull();
});

it('keeps a real editor draft and rest deadline across language switches, then finishes once', async () => {
  await AsyncStorage.clear();
  await completeOnboardingForTest();
  const locale = new LocaleStore(
    { getItem: async () => null, setItem: async () => {} },
    () => ['en'],
  );
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(
      <LocalizationProvider store={locale}>
        <App />
      </LocalizationProvider>,
    );
  });
  mounted = view!;
  const byLabel = (label: string) =>
    view!.root
      .findAll(isPressable)
      .find(
        (node: { props: { accessibilityLabel?: string } }) =>
          node.props.accessibilityLabel === label,
      )!;
  const button = (label: string) =>
    view!.root
      .findAllByType(AppButton)
      .find(
        (node: { props: { title: string } }) => node.props.title === label,
      )!;
  await act(async () => {
    byLabel('Start Upper Body').props.onPress();
  });
  act(() => byLabel('Edit set 1 weight').props.onPress());
  const weight = () =>
    view!.root.findByType(SetEntrySheet).findAllByType(TextInput)[0];
  act(() => weight().props.onChangeText('12,'));
  const sessionId = view!.root.findByType(Workout).props.session.id;
  for (const next of ['ru', 'de', 'fr'] as const) {
    await act(async () => {
      await locale.select(next);
    });
    expect(weight().props.value).toBe('12,');
    expect(view!.root.findByType(Workout).props.session.id).toBe(sessionId);
    const titles = { ru: 'Подход 1', de: 'Satz 1', fr: 'Série 1' };
    expect(
      view!.root
        .findAllByType(Text)
        .some(
          (n: { props: { children: unknown } }) =>
            n.props.children === titles[next],
        ),
    ).toBe(true);
  }
  expect(
    view!.root
      .findAllByType(Text)
      .some(
        (n: { props: { children: unknown } }) => n.props.children === 'Série 1',
      ),
  ).toBe(true);
  act(() => weight().props.onChangeText('12,5'));
  await act(async () => {
    byLabel('Enregistrer les valeurs de la série').props.onPress();
  });
  await act(async () => {
    byLabel('Terminer la série 1').props.onPress();
  });
  const active = view!.root.findByType(Workout).props.session;
  expect(active.exercises[0].sets[0].weight).toBe('12.5');
  expect(active.exercises[0].sets[0].completedAt).toBeDefined();
  const state = await AsyncStorage.getItem(STATE_KEY);
  const writes = jest
    .mocked(AsyncStorage.setItem)
    .mock.calls.filter(([key]) => key === STATE_KEY).length;
  const deadline = active.restEndsAt;
  await act(async () => {
    await locale.select('de');
  });
  expect(view!.root.findByType(Workout).props.session.restEndsAt).toBe(
    deadline,
  );
  expect(await AsyncStorage.getItem(STATE_KEY)).toBe(state);
  expect(
    jest
      .mocked(AsyncStorage.setItem)
      .mock.calls.filter(([key]) => key === STATE_KEY),
  ).toHaveLength(writes);
  const write = jest.mocked(AsyncStorage.setItem).getMockImplementation()!;
  let failNext = true;
  jest.mocked(AsyncStorage.setItem).mockImplementation(async (key, value) => {
    if (key === STATE_KEY && failNext) {
      failNext = false;
      throw Error('SECRET storage detail');
    }
    return write(key, value);
  });
  await act(async () => {
    button('Satz hinzufügen').props.onPress();
  });
  expect(
    view!.root
      .findAllByType(Text)
      .some(
        (n: { props: { children: unknown } }) =>
          n.props.children ===
          'Änderungen sind noch nicht gespeichert. Lass die App geöffnet und versuche es erneut.',
      ),
  ).toBe(true);
  const errorWrites = jest.mocked(AsyncStorage.setItem).mock.calls.length;
  await act(async () => {
    await locale.select('fr');
  });
  expect(jest.mocked(AsyncStorage.setItem).mock.calls).toHaveLength(
    errorWrites,
  );
  expect(
    view!.root
      .findAllByType(Text)
      .some(
        (n: { props: { children: unknown } }) =>
          n.props.children ===
          'Les modifications ne sont pas encore enregistrées. Garde l’application ouverte et réessaie.',
      ),
  ).toBe(true);
  expect(JSON.stringify(view!.toJSON())).not.toContain('SECRET');
  await act(async () => {
    await locale.select('de');
  });
  expect(byLabel('Alle Übungen')).toBeDefined();
  act(() => byLabel('Alle Übungen').props.onPress());
  await act(async () => {
    await locale.select('ru');
  });
  expect(byLabel('Свернуть упражнения')).toBeDefined();
  expect(
    view!.root
      .findAll(isPressable)
      .some((n: { props: { accessibilityLabel?: string } }) =>
        n.props.accessibilityLabel?.startsWith('Выбрать упражнение 1:'),
      ),
  ).toBe(true);
  await act(async () => {
    await locale.select('de');
  });
  expect(button('Training beenden')).toBeDefined();
  act(() => button('Training beenden').props.onPress());
  const confirmation = view!.root
    .findAllByType(Confirmation)
    .find(
      (n: { props: { title: string; visible: boolean } }) =>
        n.props.visible && n.props.title === 'Training beenden?',
    )!;
  const clock = jest.spyOn(Date, 'now').mockReturnValue(active.startedAt - 1);
  await act(async () => {
    await confirmation.props.onConfirm();
  });
  expect(confirmation.props.error).toContain('Prüfe die Uhrzeit deines Geräts');
  expect(confirmation.props.error).toContain(
    'Änderungen sind noch nicht gespeichert',
  );
  expect(view!.root.findByType(Workout).props.session.id).toBe(sessionId);
  clock.mockRestore();
  await act(async () => {
    await confirmation.props.onConfirm();
  });
  const data = JSON.parse((await AsyncStorage.getItem(STATE_KEY))!);
  expect(data.history).toHaveLength(1);
  expect(data.history[0].id).toBe(sessionId);
  expect(data.history[0].exercises[0].name).toBe('Barbell Bench Press');
  expect(data.activeWorkout).toBeNull();
});
