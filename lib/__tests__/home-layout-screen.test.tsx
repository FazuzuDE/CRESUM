import AsyncStorage from '@react-native-async-storage/async-storage';
import { StrictMode } from 'react';
import { Modal, Switch } from 'react-native';
import { HomeDashboard } from '../../components/HomeDashboard';
import { DashboardGrid } from '../../components/DashboardGrid';
import { AppButton } from '../../components/AppButton';
import { defaultHomeLayout, HOME_LAYOUT_KEY } from '../home-layout';
import { defaultTemplates } from '../workout-catalog';
import { isPressable } from './pressable';
import { makeAssignment } from '../training-programs/assignment';
import { selectProgram } from '../training-programs/selectors';
import { startWorkout } from '../workout-engine';
import { exerciseLibrary } from '../exercise-library';

const { act, create } = jest.requireActual('react-test-renderer');
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock',
  ),
);
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));
jest.mock('expo-blur', () => ({
  BlurView: jest.requireActual('react-native').View,
}));
beforeEach(async () => {
  await AsyncStorage.clear();
});
afterEach(() => jest.restoreAllMocks());
const render = async () => {
  let view: any;
  await act(async () => {
    view = create(
      <HomeDashboard
        history={[]}
        activeWorkout={null}
        onResume={() => {}}
        startTemplate={() => {}}
        templates={defaultTemplates}
      />,
    );
  });
  return view;
};
const button = (v: any, title: string) =>
  v.root.findAllByType(AppButton).find((n: any) => n.props.title === title);
const ids = (v: any) =>
  v.root.findByType(DashboardGrid).props.items.map((i: any) => i.id);
const open = async (v: any) => {
  await act(async () => button(v, 'Customize Home').props.onPress());
};
const move = async (v: any, label: string) => {
  await act(async () =>
    v.root
      .findAll(isPressable)
      .find((n: any) => n.props.accessibilityLabel === label)
      .props.onPress(),
  );
};
const hideSummary = async (v: any) => {
  await act(async () =>
    v.root
      .findAllByType(Switch)
      .find((n: any) => n.props.accessibilityLabel === 'Show Training summary')
      .props.onValueChange(false),
  );
};

it('ignores an obsolete initial read after an effect replay', async () => {
  let releaseOld!: (raw: string | null) => void;
  let releaseCurrent!: (raw: string | null) => void;
  jest
    .spyOn(AsyncStorage, 'getItem')
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          releaseOld = resolve;
        }),
    )
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          releaseCurrent = resolve;
        }),
    );
  let view: any;
  await act(async () => {
    view = create(
      <StrictMode>
        <HomeDashboard
          history={[]}
          activeWorkout={null}
          templates={defaultTemplates}
          startTemplate={() => {}}
          onResume={() => {}}
        />
      </StrictMode>,
    );
  });
  expect(releaseOld).toBeDefined();
  expect(releaseCurrent).toBeDefined();
  await act(async () => releaseOld(null));
  expect(button(view, 'Customize Home').props.disabled).toBe(true);
  const layout = defaultHomeLayout();
  layout.widgets.reverse();
  await act(async () => releaseCurrent(JSON.stringify(layout)));
  expect(ids(view)[0]).toBe('templates');
  expect(button(view, 'Customize Home').props.disabled).toBe(false);
  await act(async () => view.unmount());
});

it('keeps Resume and the accepted program together even when optional modules are hidden', async () => {
  const layout = defaultHomeLayout();
  layout.widgets.reverse();
  layout.widgets.forEach((w) => {
    w.visible = w.id === 'primary';
  });
  await AsyncStorage.setItem(HOME_LAYOUT_KEY, JSON.stringify(layout));
  const assignment = makeAssignment(
    selectProgram('get_stronger', 'beginner')!,
    'layout-program',
    '2026-10-17',
  );
  const active = startWorkout(assignment.templates[0], exerciseLibrary);
  const snapshot = JSON.stringify(active);
  const onResume = jest.fn();
  let view: any;
  await act(async () => {
    view = create(
      <HomeDashboard
        history={[]}
        activeWorkout={active}
        templates={assignment.templates}
        assignment={assignment}
        startProgramSlot={() => {}}
        startTemplate={() => {}}
        onResume={onResume}
      />,
    );
  });
  expect(ids(view)).toEqual(['primary', 'program']);
  await act(async () => button(view, `Resume ${active.name}`).props.onPress());
  expect(onResume).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(active)).toBe(snapshot);
  await act(async () => view.unmount());
});

it('keeps the sheet open and disables duplicate writes and dismissal until saving finishes', async () => {
  const view = await render();
  await open(view);
  await hideSummary(view);
  const original = jest.mocked(AsyncStorage.setItem).getMockImplementation()!;
  let release!: () => void;
  jest
    .spyOn(AsyncStorage, 'setItem')
    .mockImplementationOnce(async (key, value) => {
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return original(key, value);
    });
  const save = button(view, 'Save layout').props.onPress;
  await act(async () => {
    void save();
    void save();
  });
  expect(button(view, 'Saving layout…').props.disabled).toBe(true);
  expect(button(view, 'Cancel').props.disabled).toBe(true);
  await act(async () => view.root.findByType(Modal).props.onRequestClose());
  expect(view.root.findAllByType(Modal)).toHaveLength(1);
  expect(ids(view)).toContain('summary');
  await act(async () => release());
  expect(view.root.findAllByType(Modal)).toHaveLength(0);
  expect(ids(view)).not.toContain('summary');
  await act(async () => view.unmount());
});

it('edits transactionally, cancels without writes, then saves and restores order/visibility after remount', async () => {
  let view = await render();
  await open(view);
  await move(view, 'Move Latest workout up');
  await hideSummary(view);
  expect(ids(view)).toEqual([
    'week',
    'primary',
    'summary',
    'latest',
    'templates',
  ]);
  await act(async () => button(view, 'Cancel').props.onPress());
  expect(await AsyncStorage.getItem(HOME_LAYOUT_KEY)).toBeNull();
  await open(view);
  await move(view, 'Move Latest workout up');
  await hideSummary(view);
  await act(async () => button(view, 'Save layout').props.onPress());
  expect(ids(view)).toEqual(['week', 'primary', 'latest', 'templates']);
  await act(async () => view.unmount());
  view = await render();
  expect(ids(view)).toEqual(['week', 'primary', 'latest', 'templates']);
  await open(view);
  expect(
    view.root
      .findAllByType(Switch)
      .some(
        (n: any) =>
          n.props.accessibilityLabel === 'Show Start / resume workout',
      ),
  ).toBe(false);
  await act(async () => button(view, 'Restore default order').props.onPress());
  await act(async () => view.root.findByType(Modal).props.onRequestClose());
  expect(ids(view)).toEqual(['week', 'primary', 'latest', 'templates']);
  await open(view);
  await act(async () => button(view, 'Restore default order').props.onPress());
  await act(async () => button(view, 'Save layout').props.onPress());
  expect(ids(view)).toEqual(defaultHomeLayout().widgets.map((w) => w.id));
  await act(async () => view.unmount());
});

it('keeps the editor and saved Home unchanged on write failure and allows retry', async () => {
  const view = await render();
  await open(view);
  await hideSummary(view);
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(Error('full'));
  await act(async () => button(view, 'Save layout').props.onPress());
  expect(ids(view)).toContain('summary');
  expect(JSON.stringify(view.toJSON())).toContain('Could not save Home layout');
  expect(button(view, 'Save layout')).toBeDefined();
  await act(async () => button(view, 'Save layout').props.onPress());
  expect(ids(view)).not.toContain('summary');
  await act(async () => view.unmount());
});

it('falls back without overwriting unreadable preferences and recovers after explicit reset', async () => {
  await AsyncStorage.setItem(HOME_LAYOUT_KEY, '{broken');
  const view = await render();
  expect(ids(view)).toContain('primary');
  expect(await AsyncStorage.getItem(HOME_LAYOUT_KEY)).toBe('{broken');
  expect(button(view, 'Customize Home').props.disabled).toBe(true);
  await act(async () => button(view, 'Reset Home layout').props.onPress());
  expect(JSON.parse((await AsyncStorage.getItem(HOME_LAYOUT_KEY))!)).toEqual(
    defaultHomeLayout(),
  );
  expect(button(view, 'Customize Home').props.disabled).toBe(false);
  await act(async () => view.unmount());
});

it('does not overwrite a saved layout when loading fails and can retry the read', async () => {
  const layout = defaultHomeLayout();
  layout.widgets.reverse();
  await AsyncStorage.setItem(HOME_LAYOUT_KEY, JSON.stringify(layout));
  jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(Error('read'));
  const view = await render();
  expect(ids(view)[0]).toBe('week');
  await act(async () => button(view, 'Retry layout').props.onPress());
  expect(ids(view)[0]).toBe('templates');
  await act(async () => view.unmount());
});
