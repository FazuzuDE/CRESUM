import { WorkoutHistory } from '../../components/WorkoutHistory';
import { HistoryFilterModal } from '../../components/HistoryFilterModal';
import { AppPicker } from '../../components/AppPicker';
import { AppButton } from '../../components/AppButton';
import { LocalizationProvider } from '../../components/LocalizationProvider';
import { LocaleStore } from '../i18n/preference-store';
import { isPressable } from './pressable';
import { calendarTime } from '../picker-date';
import type { WorkoutSession } from '../workout-model';
const { act, create } = jest.requireActual('react-test-renderer');
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
}));
it('retains selected history, filter/date draft and exact snapshots across locale changes', async () => {
  const session: WorkoutSession = {
    id: 'saved',
    templateId: 'custom',
    name: 'Mon entraînement / Моя тренировка',
    startedAt: calendarTime(2026, 9, 21),
    finishedAt: calendarTime(2026, 9, 21) + 60000,
    currentExerciseIndex: 0,
    restDurationSeconds: 90,
    exercises: [
      {
        id: 'e',
        libraryId: 'barbell-bench-press',
        name: 'My saved name',
        muscle: 'Chest',
        sets: [
          {
            id: 's',
            weight: '12.1234567890123456789',
            reps: '10',
            otherSideReps: '9',
            completedAt: calendarTime(2026, 9, 21) + 30000,
          },
        ],
      },
    ],
  };
  const original = JSON.stringify(session);
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
      <LocalizationProvider store={locale}>
        <WorkoutHistory history={[session]} />
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
    const summary = view!.root
      .findAll(isPressable)
      .find(
        (n: { props: { accessibilityLabel?: string } }) =>
          n.props.accessibilityLabel ===
          `Открыть сведения о тренировке: ${session.name}`,
      )!;
    expect(summary).toBeDefined();
    await act(async () => {
      summary.props.onPress();
    });
    await act(async () => {
      await locale.select('de');
    });
    expect(JSON.stringify(view!.toJSON())).toContain('My saved name');
    expect(JSON.stringify(view!.toJSON())).toContain('12,1234567890123456789');
    expect(JSON.stringify(view!.toJSON())).toContain('Trainingsdetails');
    await press('Zurück zum Verlauf');
    const filter = view!.root
      .findAllByType(AppButton)
      .find(
        (n: { props: { accessibilityLabel?: string } }) =>
          n.props.accessibilityLabel === 'Verlauf filtern',
      )!;
    await act(async () => {
      filter.props.onPress();
    });
    const modal = view!.root.findByType(HistoryFilterModal);
    const from = view!.root
      .findAllByType(AppButton)
      .find((n: { props: { title: string } }) =>
        n.props.title.startsWith('Von ·'),
      )!;
    await act(async () => {
      from.props.onPress();
    });
    let picker = view!.root.findByType(AppPicker);
    await act(async () => {
      picker.props.onChange(1, 1);
    });
    const selected = picker.props.selected;
    await act(async () => {
      await locale.select('fr');
    });
    expect(view!.root.findByType(HistoryFilterModal)).toBe(modal);
    picker = view!.root.findByType(AppPicker);
    expect(picker.props.selected).toEqual(selected);
    expect(picker.props.columns[1][1]).toBe('février');
    await press('Terminé');
    await press('Afficher');
    const reopen = view!.root
      .findAllByType(AppButton)
      .find(
        (n: { props: { accessibilityLabel?: string } }) =>
          n.props.accessibilityLabel === 'Filtrer l’historique',
      )!;
    await act(async () => {
      reopen.props.onPress();
    });
    const chooseCount = view!.root
      .findAllByType(AppButton)
      .find(
        (n: { props: { accessibilityLabel?: string } }) =>
          n.props.accessibilityLabel === 'Choisir le nombre d’entraînements',
      )!;
    await act(async () => {
      chooseCount.props.onPress();
    });
    picker = view!.root.findByType(AppPicker);
    await act(async () => {
      picker.props.onChange(0, 0);
    });
    await act(async () => {
      await locale.select('ru');
    });
    picker = view!.root.findByType(AppPicker);
    expect(picker.props.selected).toEqual([0]);
    expect(picker.props.columns[0][0]).toBe('Все');
    await press('Готово');
    await press('Показать');
    expect(JSON.stringify(view!.toJSON())).toContain('Все тренировки');
    expect(JSON.stringify(session)).toBe(original);
  } finally {
    await act(async () => {
      view!.unmount();
    });
  }
});
