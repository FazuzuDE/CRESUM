import { StarterProgramSchedule } from '../../components/StarterProgramSchedule';
import { AppPicker } from '../../components/AppPicker';
import { TextInput } from 'react-native';
import { Onboarding } from '../../components/Onboarding';
import { AppButton } from '../../components/AppButton';
import { LocalizationProvider } from '../../components/LocalizationProvider';
import { LocaleStore } from '../i18n/preference-store';
import { initialOnboardingState, type OnboardingState } from '../onboarding';
import type { ProgramAssignment } from '../training-programs/assignment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../../app/index';
import { ONBOARDING_KEY } from '../onboarding-repository';
const { act, create } = jest.requireActual('react-test-renderer');
async function chooseDays(view: ReturnType<typeof create>, days = [0, 2, 4]) {
  for (const day of days) {
    await act(async () =>
      view.root.findByType(StarterProgramSchedule).props.onToggle(day),
    );
  }
}

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));
jest.mock('expo-blur', () => ({
  BlurView: jest.requireActual('react-native').View,
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock',
  ),
);
it('retains onboarding answers, proposal identity and retry state across languages', async () => {
  const locale = new LocaleStore(
    {
      getItem: async () => JSON.stringify({ version: 1, preference: 'ru' }),
      setItem: async () => {},
    },
    () => ['en'],
  );
  const change = jest.fn();
  const complete = jest
    .fn()
    .mockRejectedValueOnce(Error('SECRET_BACKEND_DIAGNOSTIC'))
    .mockResolvedValue(undefined);
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(
      <LocalizationProvider store={locale}>
        <Onboarding
          state={initialOnboardingState}
          busy={false}
          onChange={change}
          onComplete={complete}
          onCreateWorkout={async () => ({ ok: false, error: 'unused' })}
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
  const input = (label: string) =>
    view!.root
      .findAllByType(TextInput)
      .find(
        (n: { props: { accessibilityLabel: string } }) =>
          n.props.accessibilityLabel === label,
      )!;
  try {
    expect(input('Ваше имя')).toBeDefined();
    await act(async () => {
      input('Ваше имя').props.onChangeText('  Ihor  ');
    });
    const writes = change.mock.calls.length;
    await act(async () => {
      await locale.select('de');
    });
    expect(input('Dein Name').props.value).toBe('  Ihor  ');
    expect(change).toHaveBeenCalledTimes(writes);
    await press('Weiter');
    await press('Weiblich');
    await press('Weiter');
    const weight = view!.root
      .findAllByType(AppButton)
      .find(
        (node: { props: { accessibilityLabel: string } }) =>
          node.props.accessibilityLabel === 'Körpergewicht (kg)',
      );
    await act(async () => weight.props.onPress());
    const picker = () => view!.root.findByType(AppPicker);
    await act(async () => picker().props.onChange(0, 82));
    await act(async () => picker().props.onChange(1, 5));
    await act(async () => {
      await locale.select('fr');
    });
    expect(picker().props.selected).toEqual([82, 5]);
    await press('Terminé');
    await press('Continuer');
    await press('Trouver un programme');
    await press('Développer les muscles');
    expect(JSON.stringify(view!.toJSON())).toContain(
      'Développé couché aux haltères',
    );
    await press('Configurer le planning');
    const done = () =>
      view!.root.findByType(StarterProgramSchedule).props.onDone();
    await act(async () => done());
    expect(complete).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(view!.toJSON())).not.toContain(
      'SECRET_BACKEND_DIAGNOSTIC',
    );
    await act(async () => {
      await locale.select('ru');
    });
    expect(JSON.stringify(view!.toJSON())).toContain(
      'Не удалось сохранить программу. Повторите попытку; ваши тренировки сохранены.',
    );
    expect(complete).toHaveBeenCalledTimes(1);
    await act(async () => done());
    expect(complete).toHaveBeenCalledTimes(2);
    expect(complete.mock.calls[1]).toEqual(complete.mock.calls[0]);
    const [state, proposal] = complete.mock.calls[1];
    expect(state.answers.displayName).toBe('Ihor');
    expect(state.answers.bodyWeightKg).toBe('82.5');
    expect(proposal.program.name).toBe('Build muscle');
  } finally {
    await act(async () => {
      view!.unmount();
    });
  }
});
it('preserves recurring weekdays across languages', async () => {
  const locale = new LocaleStore(
    {
      getItem: async () => JSON.stringify({ version: 1, preference: 'de' }),
      setItem: async () => {},
    },
    () => ['en'],
  );
  const complete = jest.fn<
    Promise<void>,
    [OnboardingState, ProgramAssignment?]
  >(async () => {});
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(
      <LocalizationProvider store={locale}>
        <Onboarding
          state={{
            version: 1,
            status: 'in_progress',
            step: 'complete',
            answers: {
              displayName: 'Ihor',
              goal: 'build_muscle',
              experience: 'beginner',
            },
          }}
          busy={false}
          onChange={() => {}}
          onComplete={complete}
          onCreateWorkout={async () => ({ ok: true })}
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
    await press('Zeitplan festlegen');
    const calendar = () => view!.root.findByType(StarterProgramSchedule);
    await chooseDays(view!, [1, 2, 4]);
    await act(async () => {
      await locale.select('ru');
    });
    expect(JSON.stringify(view!.toJSON())).toContain(
      'Выберите три дня недели.',
    );
    expect(calendar().props.selected.slice().sort()).toEqual([1, 2, 4]);
    await act(async () => calendar().props.onDone());
    expect(complete).toHaveBeenCalledTimes(1);
    const [state, proposal] = complete.mock.calls[0];
    expect(state.answers.scheduleWeekdays?.slice().sort()).toEqual([1, 2, 4]);
    expect(proposal!.program.schedule[0]).toHaveLength(3);
  } finally {
    await act(async () => view!.unmount());
  }
});
it('translates real-app onboarding load recovery without exposing diagnostics or retrying on locale changes', async () => {
  await AsyncStorage.clear();
  const get = jest.mocked(AsyncStorage.getItem).getMockImplementation()!;
  const read = jest
    .spyOn(AsyncStorage, 'getItem')
    .mockImplementation(async (key: string) => {
      if (key === ONBOARDING_KEY) throw Error('SECRET_LOAD_DIAGNOSTIC');
      return get(key);
    });
  const locale = new LocaleStore(
    {
      getItem: async () => JSON.stringify({ version: 1, preference: 'de' }),
      setItem: async () => {},
    },
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
  try {
    expect(JSON.stringify(view!.toJSON())).toContain(
      'Die Einrichtung konnte nicht geladen werden.',
    );
    expect(JSON.stringify(view!.toJSON())).not.toContain(
      'SECRET_LOAD_DIAGNOSTIC',
    );
    const attempts = read.mock.calls.filter(
      ([key]) => key === ONBOARDING_KEY,
    ).length;
    await act(async () => {
      await locale.select('fr');
    });
    expect(JSON.stringify(view!.toJSON())).toContain(
      'Impossible de charger la configuration.',
    );
    expect(
      read.mock.calls.filter(([key]) => key === ONBOARDING_KEY),
    ).toHaveLength(attempts);
    const retry = view!.root
      .findAllByType(AppButton)
      .find(
        (n: { props: { title: string } }) =>
          n.props.title === 'Réessayer la configuration',
      )!;
    await act(async () => {
      retry.props.onPress();
    });
    expect(
      read.mock.calls.filter(([key]) => key === ONBOARDING_KEY),
    ).toHaveLength(attempts + 1);
  } finally {
    await act(async () => {
      view!.unmount();
    });
    read.mockImplementation(get);
  }
});
