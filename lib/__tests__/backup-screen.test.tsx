import { useState } from 'react';
import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BackupControls } from '../../components/BackupControls';
import {
  LocalDataGate,
  type RunDataOperation,
} from '../../components/LocalDataGate';
import { AppButton } from '../../components/AppButton';
import { createLocalBackup, RESTORE_JOURNAL_KEY } from '../local-backup';
import { emptyWorkoutState, STATE_KEY } from '../workout-repository';
import { pickBackupFile } from '../backup-files';
const { act, create } = jest.requireActual('react-test-renderer');
jest.mock('../backup-files', () => ({ pickBackupFile: jest.fn() }));
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
const pick = jest.mocked(pickBackupFile);
const text = (view: any) =>
  view.root
    .findAllByType(Text)
    .map((n: any) => n.props.children)
    .flat()
    .join(' ');
const press = (view: any, title: string) =>
  view.root
    .findAllByType(AppButton)
    .find((n: any) => n.props.title === title)
    .props.onPress();
beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});
it('previews a checked copy, cancels without restore, then confirms explicitly', async () => {
  await AsyncStorage.setItem(STATE_KEY, JSON.stringify(emptyWorkoutState()));
  const backup = await createLocalBackup(AsyncStorage);
  pick.mockResolvedValue(backup);
  const restore = jest.fn();
  let view: any;
  await act(async () => {
    view = create(
      <BackupControls
        disabled={false}
        hasActiveWorkout={false}
        onExport={() => {}}
        onRestore={restore}
      />,
    );
  });
  await act(async () => press(view, 'Restore backup'));
  expect(text(view)).toContain('Replace local data?');
  expect(restore).not.toHaveBeenCalled();
  act(() => press(view, 'Keep current data'));
  expect(restore).not.toHaveBeenCalled();
  await act(async () => press(view, 'Restore backup'));
  act(() => press(view, 'Replace with backup'));
  expect(restore).toHaveBeenCalledTimes(1);
  act(() => view.unmount());
});
it('treats picker cancellation silently and rejects an invalid file before confirmation', async () => {
  let view: any;
  act(() => {
    view = create(
      <BackupControls
        disabled={false}
        hasActiveWorkout={false}
        onExport={() => {}}
        onRestore={() => {}}
      />,
    );
  });
  pick.mockResolvedValueOnce(null);
  await act(async () => press(view, 'Restore backup'));
  expect(text(view)).not.toContain('Replace local data?');
  pick.mockResolvedValueOnce('{invalid');
  await act(async () => press(view, 'Restore backup'));
  expect(text(view)).toContain('not a valid CRESUM backup');
  act(() => view.unmount());
});
it('blocks restore with an active workout but keeps export available', () => {
  let view: any;
  act(() => {
    view = create(
      <BackupControls
        disabled={false}
        hasActiveWorkout
        onExport={() => {}}
        onRestore={() => {}}
      />,
    );
  });
  const buttons = view.root.findAllByType(AppButton);
  expect(
    buttons.find((n: any) => n.props.title === 'Restore backup').props.disabled,
  ).toBe(true);
  expect(
    buttons.find((n: any) => n.props.title === 'Export backup').props.disabled,
  ).toBe(false);
  act(() => view.unmount());
});
it('does not mount writable screens until interrupted restore recovery succeeds', async () => {
  await AsyncStorage.setItem(RESTORE_JOURNAL_KEY, 'corrupt');
  const mounted = jest.fn();
  function Child() {
    mounted();
    return <Text>Writable app</Text>;
  }
  let view: any;
  await act(async () => {
    view = create(<LocalDataGate>{() => <Child />}</LocalDataGate>);
  });
  expect(mounted).not.toHaveBeenCalled();
  expect(text(view)).toContain('recovery');
  await AsyncStorage.removeItem(RESTORE_JOURNAL_KEY);
  await act(async () => press(view, 'Retry recovery'));
  expect(text(view)).toContain('Writable app');
  act(() => view.unmount());
});
it('preserves in-memory drafts after failed/export operations and remounts only after restore success', async () => {
  let run!: RunDataOperation,
    mounts = 0;
  function Child() {
    const [value] = useState(() => String(++mounts));
    return <Text>{value}</Text>;
  }
  let view: any;
  await act(async () => {
    view = create(
      <LocalDataGate>
        {(handler) => {
          run = handler;
          return <Child />;
        }}
      </LocalDataGate>,
    );
  });
  expect(mounts).toBe(1);
  await act(async () =>
    run(async () => {
      throw Error('unsaved draft');
    }, true),
  );
  expect(mounts).toBe(1);
  await act(async () => run(async () => 'export finished', true));
  expect(mounts).toBe(1);
  await act(async () => run(async () => 'restore finished', false));
  expect(mounts).toBe(2);
  act(() => view.unmount());
});

it('reloads coherent storage after an ambiguous restore error only when the saved snapshot permits it', async () => {
  let run!: RunDataOperation,
    mounts = 0;
  function Child() {
    useState(() => ++mounts);
    return <Text>Saved app</Text>;
  }
  let view: any;
  await act(async () => {
    view = create(
      <LocalDataGate>
        {(handler) => {
          run = handler;
          return <Child />;
        }}
      </LocalDataGate>,
    );
  });
  await act(async () =>
    run(async (allowReload) => {
      allowReload();
      throw Error('Read failed after restore commit');
    }, false),
  );
  expect(mounts).toBe(2);
  act(() => view.unmount());
});
