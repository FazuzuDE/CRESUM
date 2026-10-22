import { Modal, TextInput } from 'react-native';
import { MuscleProgress } from '../../components/MuscleProgress';
import { MuscleMap } from '../../components/MuscleMap';
import { ExerciseStatistics } from '../../components/ExerciseStatistics';
import { ExercisePerformance } from '../../components/ExercisePerformance';
import { BodyWeight } from '../../components/BodyWeight';
import { TrainingVolume } from '../../components/TrainingVolume';
import { VolumeTrendChart } from '../../components/VolumeTrendChart';
import { EstimatedOneRepMaxSeries } from '../../components/EstimatedOneRepMaxSeries';
import { projectEstimatedOneRepMaxSeries } from '../exercise-performance';
import { Dock } from '../../components/Dock';
import App from '../../app/index';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STATE_KEY } from '../workout-repository';
import { AppButton } from '../../components/AppButton';
import { LocalizationProvider } from '../../components/LocalizationProvider';
import { LocaleStore } from '../i18n/preference-store';
import { createTranslator } from '../i18n/engine';
import { catalogLabel } from '../i18n/catalog';
import { muscleTaxonomy } from '../exercise-taxonomy';
import { projectMuscleParticipation } from '../muscle-participation';
import { projectExerciseStatistics } from '../exercise-statistics';
import type { WorkoutSession } from '../workout-model';
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
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock',
  ),
);
const now = new Date(2026, 9, 22, 12).getTime();
const history: WorkoutSession[] = [
  {
    id: 'saved-localization',
    templateId: 'custom',
    name: 'CUSTOM workout',
    startedAt: now - 3600000,
    finishedAt: now - 100,
    currentExerciseIndex: 0,
    restDurationSeconds: 90,
    exercises: [
      {
        id: 'bench-snapshot',
        libraryId: 'bench',
        name: 'CUSTOM bench',
        muscle: 'Historical muscle',
        sets: [
          { id: 'one', weight: '50.25', reps: '8', completedAt: now - 500 },
          { id: 'two', weight: '40', reps: '10', completedAt: now - 400 },
        ],
      },
      {
        id: 'unknown',
        libraryId: 'custom-unknown',
        name: 'CUSTOM unknown',
        muscle: 'Saved',
        sets: [
          {
            id: 'custom-set',
            weight: '12.5',
            reps: '6',
            completedAt: now - 300,
          },
        ],
      },
    ],
  },
];
const setup = async (element: React.ReactNode) => {
  const locale = new LocaleStore(
    {
      getItem: async () => JSON.stringify({ version: 1, preference: 'ru' }),
      setItem: async () => {},
    },
    () => ['en'],
  );
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(
      <LocalizationProvider store={locale}>{element}</LocalizationProvider>,
    );
  });
  const button = async (title: string) => {
    const found = view!.root
      .findAllByType(AppButton)
      .find((n: { props: { title: string } }) => n.props.title === title);
    expect(found).toBeDefined();
    await act(async () => {
      await found!.props.onPress();
    });
  };
  const press = async (label: string) => {
    const found = view!.root
      .findAll(isPressable)
      .find(
        (n: { props: { accessibilityLabel?: string } }) =>
          n.props.accessibilityLabel === label,
      );
    expect(found).toBeDefined();
    await act(async () => {
      await found!.props.onPress();
    });
  };
  return {
    view: view!,
    locale,
    button,
    press,
    text: () => JSON.stringify(view!.toJSON()),
  };
};
it('translates muscle roles, coverage and source sets without losing the selected muscle or rewriting history', async () => {
  const before = JSON.stringify(history),
    metrics = JSON.stringify(
      projectMuscleParticipation(history, undefined, '7d', now),
    );
  const ui = await setup(
    <MuscleProgress history={history} now={now} onOverview={() => {}} />,
  );
  try {
    expect(ui.text()).toContain('3 выполненных подхода');
    expect(ui.text()).toContain('1 выполненный подход не имеет привязки');
    await act(async () => {
      ui.view.root.findAllByType(MuscleMap)[0].props.onSelect('chest');
    });
    await ui.button('Показать выполненные подходы');
    for (const next of ['de', 'fr', 'en', 'ru'] as const) {
      await act(async () => {
        await ui.locale.select(next);
      });
      expect(ui.view.root.findByType(Modal).props.visible).toBe(true);
      expect(ui.text()).toContain('CUSTOM bench');
      expect(ui.text()).toContain('CUSTOM workout');
      for (const muscle of muscleTaxonomy)
        expect(ui.text()).toContain(
          catalogLabel(next, 'muscle', muscle.id, muscle.label),
        );
      expect(
        JSON.stringify(
          projectMuscleParticipation(history, undefined, '7d', now),
        ),
      ).toBe(metrics);
    }
    expect(ui.text()).toContain('Схематические анатомические области');
    expect(JSON.stringify(history)).toBe(before);
  } finally {
    act(() => ui.view.unmount());
  }
});
it('retains exercise period, metric and open completed-set details across language changes', async () => {
  const before = JSON.stringify(
    projectExerciseStatistics(
      history,
      '1W',
      now,
      'canonical:barbell-bench-press',
      'volume',
    ),
  );
  const ui = await setup(
    <ExerciseStatistics
      history={history}
      exerciseId="barbell-bench-press"
      name="CUSTOM bench"
      now={now}
    />,
  );
  try {
    await ui.press('Период упражнения 1Н');
    await ui.press('Показатель упражнения: Объём');
    await ui.press('Просмотреть подходы CUSTOM workout saved-localization');
    await act(async () => {
      await ui.locale.select('de');
    });
    expect(ui.text()).toContain('Erfasste Sätze');
    expect(ui.text()).toContain('CUSTOM bench');
    expect(ui.text()).toContain('50,25');
    await ui.press('Zurück zur Übungsstatistik');
    const selected = ui.view.root
      .findAll(isPressable)
      .filter(
        (n: { props: { accessibilityState?: { selected?: boolean } } }) =>
          n.props.accessibilityState?.selected,
      );
    expect(
      selected.map(
        (n: { props: { accessibilityLabel: string } }) =>
          n.props.accessibilityLabel,
      ),
    ).toEqual(
      expect.arrayContaining(['Übungszeitraum 1W', 'Übungskennzahl: Volumen']),
    );
    expect(
      JSON.stringify(
        projectExerciseStatistics(
          history,
          '1W',
          now,
          'canonical:barbell-bench-press',
          'volume',
        ),
      ),
    ).toBe(before);
  } finally {
    act(() => ui.view.unmount());
  }
});
it('preserves a historical unknown exercise search and logged-set selection', async () => {
  const ui = await setup(
    <ExercisePerformance history={history} period="1M" now={now} />,
  );
  try {
    await ui.press('Выбрать упражнение для истории результатов');
    await act(async () => {
      ui.view.root.findByType(TextInput).props.onChangeText('CUSTOM unknown');
      await ui.locale.select('fr');
    });
    expect(ui.view.root.findByType(TextInput).props.value).toBe(
      'CUSTOM unknown',
    );
    await ui.press('Voir les résultats de CUSTOM unknown');
    await ui.press('Voir les séries enregistrées');
    await act(async () => {
      await ui.locale.select('de');
    });
    expect(ui.text()).toContain('CUSTOM unknown');
    expect(ui.text()).toContain('CUSTOM workout');
    expect(ui.text()).toContain('12,5');
  } finally {
    act(() => ui.view.unmount());
  }
});
it('preserves an exact body-weight draft and translates validation and save errors', async () => {
  const record = jest.fn(async () => {
    throw Error('SECRET_DIAGNOSTIC');
  });
  const ui = await setup(
    <BodyWeight
      entries={[]}
      busy={false}
      onRecord={record}
      onRetry={() => {}}
      period="1M"
      now={now}
    />,
  );
  try {
    await ui.button('Добавить измерение');
    await act(async () => {
      ui.view.root.findByType(TextInput).props.onChangeText('72,');
      await ui.locale.select('de');
    });
    expect(ui.view.root.findByType(TextInput).props.value).toBe('72,');
    await ui.button('Messung speichern');
    expect(record).not.toHaveBeenCalled();
    expect(ui.text()).toContain('Gib ein gültiges Körpergewicht');
    await act(async () => {
      ui.view.root.findByType(TextInput).props.onChangeText('72,5');
    });
    await ui.button('Messung speichern');
    await act(async () => {
      await ui.locale.select('fr');
    });
    expect(ui.view.root.findByType(TextInput).props.value).toBe('72,5');
    expect(ui.text()).toContain('Impossible d’enregistrer la mesure');
    expect(ui.text()).not.toContain('SECRET_DIAGNOSTIC');
  } finally {
    act(() => ui.view.unmount());
  }
});
it('uses Russian completed-set plural forms', () => {
  const t = createTranslator('ru');
  expect(
    [0, 1, 2, 5, 21].map((count) => t('muscle.completed', { count })),
  ).toEqual([
    '0 выполненных подходов',
    '1 выполненный подход',
    '2 выполненных подхода',
    '5 выполненных подходов',
    '21 выполненный подход',
  ]);
});

it('keeps the overview period and stored records when switching sections and languages in the real app', async () => {
  await AsyncStorage.clear();
  const clock = jest.spyOn(Date, 'now').mockReturnValue(now);
  await AsyncStorage.setItem(
    STATE_KEY,
    JSON.stringify({
      schemaVersion: 1,
      activeWorkout: null,
      history,
      templates: [],
    }),
  );
  const ui = await setup(<App />);
  try {
    const stored = await AsyncStorage.getItem(STATE_KEY);
    await act(async () => {
      ui.view.root.findByType(Dock).props.onChange('progress');
    });
    expect(ui.text()).toContain('Объём и расчётные силовые рекорды');
    await ui.press('Период прогресса 3М');
    expect(ui.view.root.findByType(TrainingVolume).props.period).toBe('3M');
    await ui.button('Мышцы');
    await act(async () => {
      await ui.locale.select('fr');
    });
    await ui.button('Vue d’ensemble');
    expect(ui.view.root.findByType(TrainingVolume).props.period).toBe('3M');
    expect(ui.text()).toContain('Volume et records de force estimés');
    expect(ui.text()).toContain('CUSTOM bench');
    expect(await AsyncStorage.getItem(STATE_KEY)).toBe(stored);
  } finally {
    act(() => ui.view.unmount());
    clock.mockRestore();
  }
});

it('retains a selected chart point and honest one-point and empty states across locales', async () => {
  const workouts = [
    {
      workoutId: 'first',
      workoutName: 'CUSTOM first',
      finishedAt: now - 500000,
      volume: 50.25,
    },
    {
      workoutId: 'second',
      workoutName: 'CUSTOM second',
      finishedAt: now - 100,
      volume: 100,
    },
  ];
  const ui = await setup(
    <VolumeTrendChart workouts={workouts} start={now - 86400000} end={now} />,
  );
  try {
    const chart = () =>
      ui.view.root
        .findAll(isPressable)
        .find(
          (n: { props: { accessibilityRole?: string } }) =>
            n.props.accessibilityRole === 'adjustable',
        )!;
    await act(async () => {
      chart().props.onAccessibilityAction({
        nativeEvent: { actionName: 'decrement' },
      });
    });
    expect(chart().props.accessibilityLabel).toContain('CUSTOM first');
    await act(async () => {
      await ui.locale.select('de');
    });
    expect(chart().props.accessibilityLabel).toContain('CUSTOM first');
    expect(chart().props.accessibilityLabel).toContain('50,25');
  } finally {
    act(() => ui.view.unmount());
  }
  const single = await setup(
    <VolumeTrendChart
      workouts={[workouts[0]]}
      start={now - 86400000}
      end={now}
    />,
  );
  try {
    expect(single.text()).toContain(
      'Сохранена одна тренировка; кривой пока нет.',
    );
  } finally {
    act(() => single.view.unmount());
  }
  const empty = await setup(
    <ExerciseStatistics
      history={[]}
      exerciseId="unknown"
      name="CUSTOM unknown"
      now={now}
    />,
  );
  try {
    expect(empty.text()).toContain(
      'Нет выполненных подходов этого упражнения за период.',
    );
  } finally {
    act(() => empty.view.unmount());
  }
});

it('keeps source-weight precision in statistics and estimated-record charts and rows', async () => {
  const precise = structuredClone(history);
  precise[0].exercises[0].sets[0].weight = '50.12345678912346';
  const stats = await setup(
    <ExerciseStatistics
      history={precise}
      exerciseId="barbell-bench-press"
      name="CUSTOM bench"
      now={now}
    />,
  );
  try {
    await act(async () => {
      await stats.locale.select('en');
    });
    await stats.press('View CUSTOM workout sets saved-localization');
    expect(stats.text()).toContain(
      'From 50.12345678912346 kg × 8 · Epley estimate',
    );
  } finally {
    act(() => stats.view.unmount());
  }
  const points = projectEstimatedOneRepMaxSeries(
    precise,
    '1M',
    now,
    'canonical:barbell-bench-press',
  );
  const series = await setup(
    <EstimatedOneRepMaxSeries points={points} period="1M" now={now} />,
  );
  try {
    const chart = series.view.root
      .findAll(isPressable)
      .find(
        (n: { props: { accessibilityRole?: string } }) =>
          n.props.accessibilityRole === 'adjustable',
      )!;
    expect(chart.props.accessibilityLabel).toContain('50,12345678912346');
    await series.press('Показать 1 точку расчётного 1ПМ за 1М');
    expect(series.text()).toContain('По 50,12345678912346 кг × 8');
  } finally {
    act(() => series.view.unmount());
  }
});
