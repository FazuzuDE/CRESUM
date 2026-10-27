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
import { Text } from 'react-native';
import type { AppLocale } from '../i18n/registry';
const { act, create } = jest.requireActual('react-test-renderer');
const DateTimeFormat = Intl.DateTimeFormat;
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
}));
jest.mock('expo-blur', () => ({
  BlurView: jest.requireActual('react-native').View,
}));
const store = (preference: AppLocale = 'ru') =>
  new LocaleStore(
    {
      getItem: async () => JSON.stringify({ version: 1, preference }),
      setItem: async () => {},
    },
    () => ['en'],
  );

describe.each(['America/Los_Angeles', 'Pacific/Kiritimati'])(
  'source dates on a device in %s',
  (timeZone) => {
    it.each([
      ['en', 'Sources', 'Oct 12, 2026', 'Oct 27, 2026'],
      ['ru', 'Источники', '12 окт. 2026 г.', '27 окт. 2026 г.'],
      ['de', 'Quellen', '12. Okt. 2026', '27. Okt. 2026'],
      ['fr', 'Sources', '12 oct. 2026', '27 oct. 2026'],
    ] as const)(
      'keeps each reference date beside its own link in %s',
      async (language, sourcesLabel, aceDate, rowDate) => {
        const dateFormat = jest
          .spyOn(Intl, 'DateTimeFormat')
          .mockImplementation(
            (locales, options) =>
              new DateTimeFormat(locales, { timeZone, ...options }),
          );
        const locale = store(language);
        const exercise = exerciseLibrary.find(
          (e) => e.id === 'seated-cable-row-close-neutral-v-handle',
        )!;
        let view!: ReturnType<typeof create>;
        try {
          await act(async () => {
            view = create(
              <LocalizationProvider store={locale}>
                <ExerciseTechnique exercise={exercise} onClose={() => {}} />
              </LocalizationProvider>,
            );
          });
          await act(async () => {
            view.root
              .findAll(isPressable)
              .find((n: any) => n.props.accessibilityLabel === sourcesLabel)!
              .props.onPress();
          });
          const links = view.root
            .findAll(isPressable)
            .filter((n: any) => n.props.accessibilityRole === 'link');
          const sourceText = (publisher: string) => {
            const link = links.find((n: any) =>
              n
                .findAllByType(Text)
                .some((t: any) => t.props.children === publisher),
            );
            expect(link).toBeDefined();
            const date = publisher === 'Muscle & Strength' ? rowDate : aceDate;
            expect(link!.props.accessibilityLabel).toContain(date);
            return link!
              .findAllByType(Text)
              .map((n: any) => n.props.children)
              .join(' ');
          };
          expect(sourceText('American Council on Exercise')).toContain(aceDate);
          expect(sourceText('American Council on Exercise')).not.toContain(
            rowDate,
          );
          expect(sourceText('Muscle & Strength')).toContain(rowDate);
          expect(sourceText('Muscle & Strength')).not.toContain(aceDate);
        } finally {
          if (view) await act(async () => view.unmount());
          dateFormat.mockRestore();
        }
      },
      30_000,
    );
  },
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
