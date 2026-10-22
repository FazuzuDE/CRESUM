import { TrainingProgramWeek } from '../../components/TrainingProgramWeek';
import { ExerciseTechnique } from '../../components/ExerciseTechnique';
import { TechniqueViewer } from '../../components/TechniqueViewer';
import { AppButton } from '../../components/AppButton';
import { LocalizationProvider } from '../../components/LocalizationProvider';
import { LocaleStore } from '../i18n/preference-store';
import { makeAssignment } from '../training-programs/assignment';
import { selectProgram } from '../training-programs/selectors';
import { exerciseLibrary } from '../exercise-library';
import { calendarTime } from '../picker-date';
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
const store = () =>
  new LocaleStore(
    {
      getItem: async () => JSON.stringify({ version: 1, preference: 'ru' }),
      setItem: async () => {},
    },
    () => ['en'],
  );
it('retains the selected planned slot and canonical template across language changes', async () => {
  const locale = store();
  const a = makeAssignment(
    selectProgram('get_stronger', 'beginner')!,
    'translated-plan',
    '2026-10-22',
  );
  const before = JSON.stringify(a);
  const start = jest.fn();
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(
      <LocalizationProvider store={locale}>
        <TrainingProgramWeek
          assignment={a}
          history={[]}
          templates={a.templates}
          active={false}
          now={calendarTime(2026, 9, 22)}
          onStart={start}
        />
      </LocalizationProvider>,
    );
  });
  try {
    expect(JSON.stringify(view!.toJSON())).toContain('Ваш план тренировок');
    const choices = view!.root
      .findAll(isPressable)
      .filter(
        (n: { props: { accessibilityRole?: string } }) =>
          n.props.accessibilityRole === 'radio',
      );
    await act(async () => {
      choices[1].props.onPress();
    });
    await act(async () => {
      await locale.select('de');
    });
    expect(start).not.toHaveBeenCalled();
    expect(
      view!.root
        .findAll(isPressable)
        .filter(
          (n: { props: { accessibilityRole?: string } }) =>
            n.props.accessibilityRole === 'radio',
        )[1].props.accessibilityState.selected,
    ).toBe(true);
    const button = view!.root
      .findAllByType(AppButton)
      .find(
        (n: { props: { title: string } }) =>
          n.props.title === 'Geplantes Training starten · B',
      )!;
    expect(button).toBeDefined();
    await act(async () => {
      button.props.onPress();
    });
    expect(start.mock.calls[0][0].dayKey).toBe('B');
    expect(start.mock.calls[0][1]).toEqual(a.templates[1]);
    expect(JSON.stringify(a)).toBe(before);
  } finally {
    await act(async () => {
      view!.unmount();
    });
  }
});
it('keeps guide disclosures and fullscreen phase when language changes', async () => {
  const locale = store();
  let view: ReturnType<typeof create>;
  const exercise = exerciseLibrary.find((e) => e.id === 'barbell-bench-press')!;
  const before = JSON.stringify(exercise);
  await act(async () => {
    view = create(
      <LocalizationProvider store={locale}>
        <ExerciseTechnique exercise={exercise} onClose={() => {}} />
      </LocalizationProvider>,
    );
  });
  const press = async (label: string) => {
    const b = view!.root
      .findAll(isPressable)
      .find(
        (n: { props: { accessibilityLabel?: string } }) =>
          n.props.accessibilityLabel === label,
      );
    expect(b).toBeDefined();
    await act(async () => {
      b!.props.onPress();
    });
  };
  try {
    await press('Частые ошибки');
    await press('Показать конечное положение');
    await press('Увеличить иллюстрацию упражнения');
    await act(async () => {
      await locale.select('fr');
    });
    expect(view!.root.findByType(TechniqueViewer).props.phase).toBe('FINISH');
    await press('Fermer l’illustration plein écran');
    expect(JSON.stringify(view!.toJSON())).toContain('Rebond de la barre');
    await press('Sources');
    await act(async () => {
      await locale.select('de');
    });
    expect(JSON.stringify(view!.toJSON())).toContain('Quellen');
    expect(JSON.stringify(exercise)).toBe(before);
  } finally {
    await act(async () => {
      view!.unmount();
    });
  }
});
