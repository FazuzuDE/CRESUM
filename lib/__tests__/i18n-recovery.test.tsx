import { TextInput } from 'react-native';
import { AccountSection } from '../../components/AccountSection';
import { BackupControls } from '../../components/BackupControls';
import { BackupPage } from '../../components/BackupPage';
import { HistorySyncPanel } from '../../components/HistorySyncPanel';
import { LocalizationProvider } from '../../components/LocalizationProvider';
import { AppButton } from '../../components/AppButton';
import { LocaleStore } from '../i18n/preference-store';
import { pickBackupFile } from '../backup-files';
import { LocalDataResetError } from '../local-data-reset';
import { presentAppError } from '../i18n/errors';
import { createTranslator } from '../i18n/engine';
import { AuthActionError } from '../auth-store';
import { LocalDataGate } from '../../components/LocalDataGate';
import { AccountDeletionSection } from '../../components/AccountDeletionSection';
import { HistoryConflictReview } from '../../components/HistoryConflictReview';
import { conflictFixture } from './helpers/history-resolution-fixture';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RESTORE_JOURNAL_KEY } from '../local-backup';
const { act, create } = jest.requireActual('react-test-renderer');
jest.mock('../backup-files', () => ({ pickBackupFile: jest.fn() }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock',
  ),
);
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));
jest.mock('expo-blur', () => ({
  BlurView: jest.requireActual('react-native').View,
}));
const copy = {
  en: {
    email: 'Email address',
    send: 'Send code',
    verify: 'Verify code',
    invalid: 'Code invalid or expired. Try again or resend it.',
    restore: 'Restore backup',
    invalidBackup:
      'This is not a valid CRESUM backup. No local data was changed.',
    import: 'Import history',
    open: 'Backup could not be opened. Try again.',
    deletion: 'Account deletion is not available yet in this build.',
    conflict: 'Review conflicting workouts',
  },
  ru: {
    email: 'Электронная почта',
    send: 'Отправить код',
    verify: 'Подтвердить код',
    invalid:
      'Код недействителен или истёк. Попробуйте ещё раз или запросите новый.',
    restore: 'Восстановить копию',
    invalidBackup:
      'Это некорректная резервная копия CRESUM. Локальные данные не изменены.',
    import: 'Импортировать историю',
    open: 'Не удалось открыть копию. Попробуйте ещё раз.',
    deletion: 'Удаление аккаунта пока недоступно в этой версии.',
    conflict: 'Проверить конфликтующие тренировки',
  },
  de: {
    email: 'E-Mail-Adresse',
    send: 'Code senden',
    verify: 'Code bestätigen',
    invalid:
      'Code ungültig oder abgelaufen. Erneut versuchen oder neuen Code anfordern.',
    restore: 'Sicherung wiederherstellen',
    invalidBackup:
      'Dies ist keine gültige CRESUM-Sicherung. Lokale Daten wurden nicht verändert.',
    import: 'Verlauf importieren',
    open: 'Sicherung konnte nicht geöffnet werden. Bitte erneut versuchen.',
    deletion: 'Die Kontolöschung ist in dieser Version noch nicht verfügbar.',
    conflict: 'Widersprüchliche Trainings prüfen',
  },
  fr: {
    email: 'Adresse e-mail',
    send: 'Envoyer le code',
    verify: 'Valider le code',
    invalid: 'Code invalide ou expiré. Réessayez ou demandez un nouveau code.',
    restore: 'Restaurer une sauvegarde',
    invalidBackup:
      'Cette sauvegarde CRESUM est invalide. Aucune donnée locale n’a été modifiée.',
    import: 'Importer l’historique',
    open: 'Impossible d’ouvrir la sauvegarde. Réessayez.',
    deletion:
      'La suppression du compte n’est pas encore disponible dans cette version.',
    conflict: 'Examiner les entraînements en conflit',
  },
} as const;
async function setup(element: React.ReactNode) {
  const locale = new LocaleStore(
    { getItem: async () => null, setItem: async () => {} },
    () => ['en'],
  );
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(
      <LocalizationProvider store={locale}>{element}</LocalizationProvider>,
    );
  });
  return {
    view: view!,
    text: () => JSON.stringify(view!.toJSON()),
    select: async (language: keyof typeof copy) => {
      await act(async () => {
        await locale.select(language);
      });
    },
    button: (title: string) =>
      view!.root
        .findAllByType(AppButton)
        .find((n: any) => n.props.title === title),
    press: async (title: string) => {
      const found = view!.root
        .findAllByType(AppButton)
        .find((n: any) => n.props.title === title);
      expect(found).toBeDefined();
      await act(async () => {
        await found!.props.onPress();
      });
    },
    close: async () => {
      await act(async () => {
        view!.unmount();
      });
    },
  };
}
const signedOut = {
  status: 'signed_out' as const,
  configured: true,
  identity: null,
  error: null,
  busy: null,
};
it('keeps incomplete reset recovery distinct from recovered data in all locales', () => {
  const expected = {
    en: 'Keep the app open',
    ru: 'Оставьте приложение открытым',
    de: 'Lass die App geöffnet',
    fr: 'Gardez l’application ouverte',
  };
  for (const locale of ['en', 'ru', 'de', 'fr'] as const) {
    const t = createTranslator(locale);
    const incomplete = presentAppError(
      t,
      new LocalDataResetError(true),
      'error.reset',
    );
    const recovered = presentAppError(
      t,
      new LocalDataResetError(false),
      'error.reset',
    );
    expect(incomplete).toContain(expected[locale]);
    expect(recovered).not.toBe(incomplete);
  }
});
it('preserves blocked recovery across languages until explicit retry', async () => {
  await AsyncStorage.clear();
  await AsyncStorage.setItem(RESTORE_JOURNAL_KEY, 'BROKEN SECRET journal');
  const ui = await setup(
    <LocalDataGate>
      {() => <AppButton title="CHILD" onPress={() => {}} />}
    </LocalDataGate>,
  );
  try {
    const reads = jest.mocked(AsyncStorage.getItem).mock.calls.length;
    for (const locale of ['ru', 'de', 'fr', 'en'] as const) {
      await ui.select(locale);
      expect(
        ui.button(createTranslator(locale)('recovery.retry')),
      ).toBeDefined();
      expect(ui.text()).toContain(
        createTranslator(locale)('error.localRecovery'),
      );
      expect(ui.text()).not.toContain('SECRET');
      expect(ui.button('CHILD')).toBeUndefined();
    }
    expect(jest.mocked(AsyncStorage.getItem).mock.calls.length).toBe(reads);
    await AsyncStorage.removeItem(RESTORE_JOURNAL_KEY);
    await ui.press('Retry recovery');
    expect(ui.button('CHILD')).toBeDefined();
  } finally {
    await ui.close();
    await AsyncStorage.clear();
  }
});
it('keeps the DELETE confirmation draft and capability gate while language changes', async () => {
  const deleted = jest.fn();
  const ui = await setup(
    <AccountDeletionSection
      snapshot={{
        ...signedOut,
        status: 'signed_in',
        identity: { id: 'A', email: 'UNCHANGED@example.com' },
      }}
      deleteAccount={deleted}
      busy={false}
      setBusy={() => {}}
    />,
  );
  try {
    await ui.press('Delete account');
    await act(async () => {
      ui.view.root.findByType(TextInput).props.onChangeText('DEL');
    });
    for (const locale of ['ru', 'de', 'fr', 'en'] as const) {
      await ui.select(locale);
      expect(ui.view.root.findByType(TextInput).props.value).toBe('DEL');
      expect(
        ui.button(createTranslator(locale)('deletion.permanent'))?.props
          .disabled,
      ).toBe(true);
    }
    expect(deleted).not.toHaveBeenCalled();
  } finally {
    await ui.close();
  }
});
it('preserves a chosen conflict version, historical names and exact set values across languages', async () => {
  const x = await conflictFixture();
  const actions = {
    conflicts: () => x.engine.conflicts(),
    compare: (id: string) => x.engine.compare(id),
    resolve: jest.fn(),
    sync: () => x.engine.request(),
  };
  const ui = await setup(
    <HistoryConflictReview
      actions={actions}
      onClose={() => {}}
      onSignOut={async () => {}}
    />,
  );
  try {
    await ui.press('Upper Body');
    expect(ui.text()).toContain('Bench Press');
    const comparisons = x.server.getCalls;
    await ui.press('Keep this version');
    for (const locale of ['ru', 'de', 'fr', 'en'] as const) {
      await ui.select(locale);
      const t = createTranslator(locale);
      expect(ui.text()).toContain(t('conflict.keepDeviceQuestion'));
      expect(ui.button(t('conflict.replaceCloud'))).toBeDefined();
    }
    expect(actions.resolve).not.toHaveBeenCalled();
    expect(x.server.getCalls).toBe(comparisons);
    await ui.press('Back to comparison');
    expect(ui.text()).toContain('Bench Press');
    expect(ui.text()).toContain('60 kg × 8');
  } finally {
    await ui.close();
  }
});
it('keeps email/code drafts and OTP failure across all four locales without retrying', async () => {
  const send = jest.fn(async () => {}),
    verify = jest.fn(async () => {
      throw new AuthActionError('token=SECRET SDK diagnostic', 'auth_verify');
    });
  const ui = await setup(
    <AccountSection
      snapshot={signedOut}
      sendEmailOtp={send}
      verifyEmailOtp={verify}
      signOut={async () => {}}
    />,
  );
  try {
    expect(ui.button(copy.en.send)?.props.disabled).toBe(true);
    await act(async () => {
      ui.view.root.findByType(TextInput).props.onChangeText('invalid');
    });
    expect(ui.button(copy.en.send)?.props.disabled).toBe(true);
    await act(async () => {
      ui.view.root
        .findByType(TextInput)
        .props.onChangeText('person@example.com');
    });
    await ui.press(copy.en.send);
    await act(async () => {
      ui.view.root.findAllByType(TextInput)[1].props.onChangeText('123456');
    });
    await ui.press(copy.en.verify);
    for (const locale of ['ru', 'de', 'fr', 'en'] as const) {
      await ui.select(locale);
      expect(ui.text()).toContain(copy[locale].invalid);
      expect(ui.text()).not.toContain('SECRET');
      expect(ui.view.root.findAllByType(TextInput)[1].props.value).toBe(
        '123456',
      );
      expect(ui.button(copy[locale].verify)).toBeDefined();
    }
    expect(send).toHaveBeenCalledTimes(1);
    expect(verify).toHaveBeenCalledTimes(1);
  } finally {
    await ui.close();
  }
});
it('retains invalid-backup failure on language changes and never restores it', async () => {
  jest.mocked(pickBackupFile).mockResolvedValue('{invalid');
  const restore = jest.fn();
  const ui = await setup(
    <BackupControls
      disabled={false}
      hasActiveWorkout={false}
      onExport={() => {}}
      onRestore={restore}
    />,
  );
  try {
    await ui.press(copy.en.restore);
    for (const locale of ['ru', 'de', 'fr', 'en'] as const) {
      await ui.select(locale);
      expect(ui.text()).toContain(copy[locale].invalidBackup);
    }
    expect(restore).not.toHaveBeenCalled();
  } finally {
    await ui.close();
  }
});
it('hides unknown picker diagnostics in every locale and keeps import failed', async () => {
  const pick = jest.mocked(pickBackupFile);
  pick.mockClear();
  pick.mockRejectedValue(new Error('token=SECRET path=/private'));
  const imported = jest.fn();
  const ui = await setup(
    <BackupPage
      history={[]}
      onClose={() => {}}
      backup={{
        disabled: false,
        hasActiveWorkout: false,
        onExport: () => {},
        onRestore: () => {},
        onImport: imported,
      }}
    />,
  );
  try {
    await ui.press(copy.en.import);
    for (const locale of ['ru', 'de', 'fr', 'en'] as const) {
      await ui.select(locale);
      expect(ui.text()).toContain(copy[locale].open);
      expect(ui.text()).not.toContain('SECRET');
    }
    expect(pick).toHaveBeenCalledTimes(1);
    expect(imported).not.toHaveBeenCalled();
  } finally {
    await ui.close();
  }
});
it('translates disabled deletion and sync conflict without enabling or retrying either', async () => {
  const sync = jest.fn();
  const ui = await setup(
    <>
      <AccountSection
        snapshot={{
          ...signedOut,
          status: 'signed_in',
          identity: { id: 'A', email: 'USER@EXAMPLE.COM' },
        }}
        sendEmailOtp={async () => {}}
        verifyEmailOtp={async () => {}}
        signOut={async () => {}}
      />
      <HistorySyncPanel
        snapshot={{ status: 'error', kind: 'conflict' }}
        onEnable={sync}
        onSync={sync}
        review={{
          conflicts: async () => [],
          compare: jest.fn(),
          resolve: jest.fn(),
          sync: jest.fn(),
        }}
        onReview={() => {}}
      />
    </>,
  );
  try {
    for (const locale of ['ru', 'de', 'fr', 'en'] as const) {
      await ui.select(locale);
      expect(ui.text()).toContain(copy[locale].deletion);
      expect(ui.button(copy[locale].conflict)).toBeDefined();
      expect(ui.text()).toContain('USER@EXAMPLE.COM');
    }
    expect(sync).not.toHaveBeenCalled();
  } finally {
    await ui.close();
  }
});
