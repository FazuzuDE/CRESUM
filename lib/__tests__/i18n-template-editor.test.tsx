import { TextInput } from 'react-native';
import { TemplateEditor } from '../../components/TemplateEditor';
import { ExerciseLibrary } from '../../components/ExerciseLibrary';
import { AppButton } from '../../components/AppButton';
import { LocalizationProvider } from '../../components/LocalizationProvider';
import { LocaleStore } from '../i18n/preference-store';
import { exerciseLibrary } from '../exercise-library';
import { isPressable } from './pressable';
import { Confirmation } from '../../components/Confirmation';
const { act, create } = jest.requireActual('react-test-renderer');
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
}));
it('keeps manual workout names and numeric drafts while translating editing and save failures', async () => {
  const locale = new LocaleStore(
    {
      getItem: async () => JSON.stringify({ version: 1, preference: 'ru' }),
      setItem: async () => {},
    },
    () => ['en'],
  );
  const save = jest
    .fn()
    .mockResolvedValueOnce({ ok: false, error: 'SECRET_DIAGNOSTIC' })
    .mockResolvedValue({ ok: true });
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(
      <LocalizationProvider store={locale}>
        <TemplateEditor
          mode="create"
          busy={false}
          onSave={save}
          onCancel={() => {}}
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
    expect(input('Название тренировки')).toBeDefined();
    await act(async () => {
      input('Название тренировки').props.onChangeText('Upper Body');
    });
    await press('Далее');
    await act(async () => {
      view!.root.findByType(ExerciseLibrary).props.onAdd(exerciseLibrary[0]);
    });
    await act(async () => {
      input('Начальный вес в килограммах').props.onChangeText('12,');
    });
    await act(async () => {
      await locale.select('de');
    });
    expect(input('Startgewicht in Kilogramm').props.value).toBe('12,');
    await press('Übung hinzufügen');
    expect(JSON.stringify(view!.toJSON())).toContain(
      'Gib ein gültiges, nicht negatives Gewicht ein.',
    );
    await act(async () => {
      await locale.select('fr');
    });
    expect(JSON.stringify(view!.toJSON())).toContain(
      'Saisis une charge valide, positive ou nulle.',
    );
    await act(async () => {
      input('Charge de départ en kilogrammes').props.onChangeText('12,5');
    });
    await press('Ajouter l’exercice');
    await press('Enregistrer l’entraînement');
    expect(JSON.stringify(view!.toJSON())).not.toContain('SECRET_DIAGNOSTIC');
    await act(async () => {
      await locale.select('ru');
    });
    expect(JSON.stringify(view!.toJSON())).toContain(
      'Не удалось сохранить тренировку. Повторите попытку.',
    );
    expect(save).toHaveBeenCalledTimes(1);
    await press('Сохранить тренировку');
    expect(save).toHaveBeenCalledTimes(2);
    expect(save.mock.calls[1][0]).toEqual(save.mock.calls[0][0]);
    expect(save.mock.calls[1][0].name).toBe('Upper Body');
    expect(save.mock.calls[1][0].plannedExercises[0].weight).toBe('12.5');
  } finally {
    await act(async () => {
      view!.unmount();
    });
  }
});
it('retains editing order through translated stale-reference and discard controls', async () => {
  const locale = new LocaleStore(
    {
      getItem: async () => JSON.stringify({ version: 1, preference: 'de' }),
      setItem: async () => {},
    },
    () => ['en'],
  );
  const original = {
    id: 'custom',
    name: 'My saved template',
    exerciseIds: ['barbell-bench-press', 'seated-cable-row', 'missing-id'],
  };
  const snapshot = JSON.stringify(original);
  const save = jest.fn().mockResolvedValue({
    ok: false,
    error: 'gone',
    code: 'template_missing' as const,
  });
  const cancel = jest.fn();
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(
      <LocalizationProvider store={locale}>
        <TemplateEditor
          mode="edit"
          template={original}
          busy={false}
          onSave={save}
          onCancel={cancel}
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
  const action = async (label: string) => {
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
    await press('Training speichern');
    expect(save).not.toHaveBeenCalled();
    await act(async () => {
      await locale.select('ru');
    });
    expect(JSON.stringify(view!.toJSON())).toContain(
      'Перед сохранением удалите или замените недоступные упражнения.',
    );
    await action('Удалить: недоступное упражнение missing-id');
    await action('Переместить вниз: Жим штанги лёжа');
    await press('Отмена');
    expect(view!.root.findByType(Confirmation).props.visible).toBe(true);
    await act(async () => {
      await locale.select('fr');
    });
    expect(view!.root.findByType(Confirmation).props.title).toBe(
      'Abandonner les modifications de l’entraînement ?',
    );
    await act(async () => {
      view!.root.findByType(Confirmation).props.onCancel();
    });
    expect(cancel).not.toHaveBeenCalled();
    await press('Enregistrer l’entraînement');
    expect(save.mock.calls[0][0].exerciseIds).toEqual([
      'seated-cable-row',
      'barbell-bench-press',
    ]);
    expect(JSON.stringify(view!.toJSON())).toContain(
      'Le modèle n’est plus disponible.',
    );
    expect(JSON.stringify(original)).toBe(snapshot);
  } finally {
    await act(async () => {
      view!.unmount();
    });
  }
});
