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
import { AppDatePicker } from '../../components/AppDatePicker';
import { calendarTime } from '../picker-date';
const { act, create } = jest.requireActual('react-test-renderer');
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
    await act(async () => {
      input('Körpergewicht (kg)').props.onChangeText('82,');
    });
    await press('Weiter');
    expect(JSON.stringify(view!.toJSON())).toContain(
      'Gib ein gültiges Körpergewicht ein oder lasse das Feld leer.',
    );
    await act(async () => {
      await locale.select('fr');
    });
    expect(input('Poids (kg)').props.value).toBe('82,');
    expect(JSON.stringify(view!.toJSON())).toContain(
      'Saisis un poids valide ou laisse le champ vide.',
    );
    await act(async () => {
      input('Poids (kg)').props.onChangeText('82,5');
    });
    await press('Continuer');
    await press('Développer les muscles');
    await press('Débutant');
    await press('Voir le programme complet');
    expect(JSON.stringify(view!.toJSON())).toContain(
      'Développé couché aux haltères',
    );
    await press('COMMENCER !');
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
    await press('Повторить старт');
    expect(complete).toHaveBeenCalledTimes(2);
    expect(complete.mock.calls[1]).toEqual(complete.mock.calls[0]);
    const [state, proposal] = complete.mock.calls[1];
    expect(state.answers.displayName).toBe('Ihor');
    expect(state.answers.bodyWeightKg).toBe('82,5');
    expect(proposal.program.name).toBe('Build muscle');
  } finally {
    await act(async () => {
      view!.unmount();
    });
  }
});
it('preserves custom schedule, start-date picker and frequency error across languages', async () => {
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
    await press('Zeitplanoptionen');
    const start = view!.root
      .findAllByType(AppButton)
      .find((n: { props: { title: string } }) =>
        n.props.title.startsWith('Startdatum ·'),
      )!;
    await act(async () => {
      start.props.onPress();
    });
    const date = calendarTime(2026, 10, 2);
    await act(async () => {
      view!.root.findByType(AppDatePicker).props.onChange(date);
    });
    await act(async () => {
      await locale.select('fr');
    });
    expect(view!.root.findByType(AppDatePicker).props.value).toBe(date);
    await press('Terminé');
    const inputs = view!.root.findAllByType(TextInput);
    for (let index = 0; index < 3; index++)
      await act(async () => {
        inputs[index].props.onChangeText(String(2 + 2 * index));
      });
    await press('2 entraînements');
    expect(JSON.stringify(view!.toJSON())).toContain(
      'Aucun programme vérifié pour cette fréquence.',
    );
    await act(async () => {
      await locale.select('ru');
    });
    expect(JSON.stringify(view!.toJSON())).toContain(
      'Для этой частоты нет проверенной программы.',
    );
    expect(
      view!.root
        .findAllByType(TextInput)
        .map((n: { props: { value: string } }) => n.props.value),
    ).toEqual(['2', '4', '6']);
    await press('3 тренировки');
    await act(async () => {
      await locale.select('en');
    });
    await press('START!');
    expect(complete).toHaveBeenCalledTimes(1);
    const proposal = complete.mock.calls[0][1];
    expect(proposal!.startDate).toBe('2026-11-02');
    expect(
      proposal!.program.schedule[0].map(
        (slot: { offset: number }) => slot.offset,
      ),
    ).toEqual([1, 3, 5]);
  } finally {
    await act(async () => {
      view!.unmount();
    });
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
