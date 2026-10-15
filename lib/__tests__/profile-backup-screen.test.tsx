import { Text } from 'react-native';
import { ProfileSettings } from '../../components/ProfileSettings';
import { AppButton } from '../../components/AppButton';
import { isPressable } from './pressable';
import { pickBackupFile } from '../backup-files';
import { createLocalBackup } from '../local-backup';
import { emptyWorkoutState, STATE_KEY } from '../workout-repository';
import { startWorkout, finishWorkout } from '../workout-engine';
import { defaultTemplates, exerciseLibrary } from '../workout-catalog';
const { act, create } = jest.requireActual('react-test-renderer');
jest.mock('../backup-files', () => ({ pickBackupFile: jest.fn() }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));
jest.mock('expo-blur', () => ({
  BlurView: jest.requireActual('react-native').View,
}));
const text = (view: any) =>
  view.root
    .findAllByType(Text)
    .map((n: any) => n.props.children)
    .flat()
    .join(' ');
const button = (view: any, title: string) =>
  view.root.findAllByType(AppButton).find((n: any) => n.props.title === title);
const make = () => {
  const w = startWorkout(defaultTemplates[0], exerciseLibrary, 100);
  w.id = 'a';
  w.exercises[0].sets[0] = {
    ...w.exercises[0].sets[0],
    weight: '50',
    completedAt: 110,
  };
  return finishWorkout(w, 120);
};
it('opens the compact Profile entry, applies schedule controls and returns to Profile', async () => {
  const onPolicy = jest.fn(async () => {});
  let view: any;
  const backup = {
    disabled: false,
    hasActiveWorkout: false,
    onExport: jest.fn(),
    onRestore: jest.fn(),
    policy: {
      version: 1 as const,
      enabled: false,
      frequency: 'workout' as const,
    },
    settingsLoaded: true,
    automaticSupported: true,
    onPolicy,
  };
  act(() => {
    view = create(
      <ProfileSettings
        templates={[...defaultTemplates]}
        busy={false}
        createTemplate={jest.fn()}
        updateTemplate={jest.fn()}
        deleteTemplate={jest.fn()}
        backup={backup}
      />,
    );
  });
  expect(button(view, 'Backup & restore')).toBeDefined();
  expect(button(view, 'Export backup')).toBeUndefined();
  act(() => button(view, 'Backup & restore').props.onPress());
  expect(text(view)).toContain('Automatic backups');
  expect(button(view, 'Import history')).toBeDefined();
  const radio = view.root
    .findAll(isPressable)
    .find((n: any) => n.props.accessibilityLabel === 'Backup frequency Weekly');
  await act(async () => radio.props.onPress());
  expect(onPolicy).toHaveBeenCalledWith({
    ...backup.policy,
    frequency: 'weekly',
  });
  act(() => button(view, 'Back to Profile').props.onPress());
  expect(button(view, 'Backup & restore')).toBeDefined();
  act(() => view.unmount());
});
it('previews new/existing history counts and imports only after the explicit action', async () => {
  const a = make(),
    data = { ...emptyWorkoutState(), history: [a, { ...a, id: 'b' }] };
  const raw = await createLocalBackup(
    {
      getItem: async (k) => (k === STATE_KEY ? JSON.stringify(data) : null),
      setItem: async () => {},
      removeItem: async () => {},
    },
    1000,
  );
  jest.mocked(pickBackupFile).mockResolvedValue(raw);
  const onImport = jest.fn();
  let view: any;
  act(() => {
    view = create(
      <ProfileSettings
        templates={[...defaultTemplates]}
        history={[a]}
        busy={false}
        createTemplate={jest.fn()}
        updateTemplate={jest.fn()}
        deleteTemplate={jest.fn()}
        backup={{
          disabled: false,
          hasActiveWorkout: false,
          onExport: jest.fn(),
          onRestore: jest.fn(),
          onImport,
        }}
      />,
    );
  });
  act(() => button(view, 'Backup & restore').props.onPress());
  await act(async () => button(view, 'Import history').props.onPress());
  expect(text(view)).toContain('File checked');
  expect(text(view)).toContain('Your current history stays.');
  expect(onImport).not.toHaveBeenCalled();
  act(() => button(view, 'Import 1 workout').props.onPress());
  expect(onImport).toHaveBeenCalledTimes(1);
  act(() => view.unmount());
});
