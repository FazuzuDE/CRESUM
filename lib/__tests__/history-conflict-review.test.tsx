import { AccountPage } from '../../components/AccountPage';
import type { AccountSectionProps } from '../../components/AccountSection';
import { AppButton } from '../../components/AppButton';
import { conflictFixture } from './helpers/history-resolution-fixture';
const { act, create } = jest.requireActual('react-test-renderer');
const tick = () => new Promise((r) => setTimeout(r, 0));
const button = (v: ReturnType<typeof create>, title: string) =>
  v.root
    .findAllByType(AppButton)
    .find((n: { props: { title: string } }) => n.props.title === title);
const choice = (v: ReturnType<typeof create>, label: string) =>
  v.root
    .findAllByType(AppButton)
    .find(
      (n: { props: { accessibilityLabel: string } }) =>
        n.props.accessibilityLabel === label,
    );
async function screen() {
  const x = await conflictFixture();
  const props: AccountSectionProps = {
    snapshot: {
      status: 'signed_in',
      configured: true,
      identity: { id: 'A', email: 'a@example.com' },
      busy: null,
      error: null,
    },
    signOut: async () => {},
    sendEmailOtp: async () => {},
    verifyEmailOtp: async () => {},
    sync: {
      snapshot: x.engine.getSnapshot(),
      onEnable: () => {},
      onSync: () => {},
      review: {
        conflicts: () => x.engine.conflicts(),
        compare: (id) => x.engine.compare(id),
        resolve: (v, c) => x.engine.resolve(v, c),
        sync: () => x.engine.request(),
      },
    },
  };
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(<AccountPage account={props} onClose={() => {}} />);
  });
  const press = async (title: string) => {
    await act(async () => {
      expect(button(view, title)).toBeDefined();
      button(view, title)!.props.onPress();
      await tick();
      await tick();
    });
  };
  const open = async () => {
    await press('Review conflicting workouts');
    await press('Upper Body');
  };
  return { ...x, props, view, press, open };
}
it('shows real per-set differences and two choices without preselection', async () => {
  const x = await screen();
  try {
    await x.open();
    const content = JSON.stringify(x.view.toJSON());
    expect(content).toContain('60 kg × 8');
    expect(content).toContain('60 kg × 10');
    expect(content).toContain('Bench Press');
    expect(content).toContain('Edit time unknown');
    expect(choice(x.view, 'Keep device version')).toBeDefined();
    expect(choice(x.view, 'Keep cloud version')).toBeDefined();
    expect(button(x.view, 'Replace cloud version')).toBeUndefined();
    expect(button(x.view, 'Save both as separate workouts')).toBeUndefined();
    expect(x.server.resolutionCalls).toHaveLength(0);
  } finally {
    await act(async () => x.view.unmount());
  }
});
it('Decide later returns to Account without changing either version', async () => {
  const x = await screen();
  try {
    await x.open();
    const before = x.store.getSnapshot().data;
    await x.press('Decide later');
    expect(JSON.stringify(x.view.toJSON())).toContain('Account & Sync');
    expect(x.store.getSnapshot().data).toBe(before);
    expect(x.server.resolutionCalls).toHaveLength(0);
  } finally {
    await act(async () => x.view.unmount());
  }
});
it.each([
  ['Keep device version', 'Replace cloud version', '8'],
  ['Keep cloud version', 'Replace device version', '10'],
])('confirms %s before replacing data', async (label, confirm, reps) => {
  const x = await screen();
  try {
    await x.open();
    await act(async () => choice(x.view, label)!.props.onPress());
    expect(button(x.view, confirm)).toBeDefined();
    expect(x.server.resolutionCalls).toHaveLength(0);
    await x.press(confirm);
    expect(
      x.store.getSnapshot().data.history[0].exercises[0].sets[0].reps,
    ).toBe(reps);
    expect(x.engine.getSnapshot().status).toBe('synced');
    expect(JSON.stringify(x.view.toJSON())).toContain('No conflicts to review');
  } finally {
    await act(async () => x.view.unmount());
  }
});
it('places Keep both under More options and warns about Progress before confirmation', async () => {
  const x = await screen();
  try {
    await x.open();
    await x.press('More options');
    await x.press('Save both as separate workouts');
    expect(JSON.stringify(x.view.toJSON())).toContain(
      'Both workouts will count in History and Progress',
    );
    expect(x.server.resolutionCalls).toHaveLength(0);
    await x.press('Save both workouts');
    expect(x.store.getSnapshot().data.history).toHaveLength(2);
    expect(x.server.rows.get('A')!.size).toBe(2);
  } finally {
    await act(async () => x.view.unmount());
  }
});
it('shows deletion actions explicitly and confirms local removal', async () => {
  const x = await screen();
  try {
    x.server.seed('A', null, 'local');
    await x.engine.request();
    await x.open();
    expect(JSON.stringify(x.view.toJSON())).toContain('Deleted in cloud');
    expect(button(x.view, 'Save device as new workout')).toBeDefined();
    await x.press('Accept cloud deletion');
    expect(x.store.getSnapshot().data.history).toHaveLength(1);
    await x.press('Remove device workout');
    expect(x.store.getSnapshot().data.history).toHaveLength(0);
    expect(x.server.rows.get('A')!.get('local')!.workout).toBeNull();
  } finally {
    await act(async () => x.view.unmount());
  }
});
it('refreshes a stale comparison instead of applying its former selection', async () => {
  const x = await screen();
  try {
    await x.open();
    await act(async () =>
      choice(x.view, 'Keep cloud version')!.props.onPress(),
    );
    const old = x.server.rows.get('A')!.get('local')!.workout!;
    x.server.seed('A', { ...old, name: 'Changed on another device' });
    await x.press('Replace device version');
    expect(JSON.stringify(x.view.toJSON())).toContain(
      'Review the latest versions',
    );
    expect(x.server.resolutionCalls).toHaveLength(0);
    expect(
      x.store.getSnapshot().data.history[0].exercises[0].sets[0].reps,
    ).toBe('8');
  } finally {
    await act(async () => x.view.unmount());
  }
});
it('removes account A comparison immediately when the owner changes', async () => {
  const x = await screen();
  try {
    await x.open();
    x.setCurrent('B');
    await x.engine.setAccount('B', x.server.api('B'));
    const props = {
      ...x.props,
      snapshot: {
        ...x.props.snapshot,
        identity: { id: 'B', email: 'b@example.com' },
      },
    };
    await act(async () => {
      x.view.update(<AccountPage account={props} onClose={() => {}} />);
      await tick();
    });
    expect(JSON.stringify(x.view.toJSON())).not.toContain('60 kg × 8');
    expect(choice(x.view, 'Keep device version')).toBeUndefined();
  } finally {
    await act(async () => x.view.unmount());
  }
});
it('recovers a timed-out Save both through Retry sync without a duplicate', async () => {
  const x = await screen();
  try {
    await x.open();
    await x.press('More options');
    await x.press('Save both as separate workouts');
    x.server.failAfterCommit = true;
    await x.press('Save both workouts');
    expect(JSON.stringify(x.view.toJSON())).toContain(
      'Retry sync to recover your last choice',
    );
    expect(JSON.stringify(x.view.toJSON())).not.toContain(
      'No conflicts to review',
    );
    await x.press('Retry sync');
    expect(JSON.stringify(x.view.toJSON())).toContain('No conflicts to review');
    expect(x.store.getSnapshot().data.history).toHaveLength(2);
    expect(x.server.rows.get('A')!.size).toBe(2);
  } finally {
    await act(async () => x.view.unmount());
  }
});
it('explains a blocked comparison without offering replacement actions', async () => {
  const x = await screen();
  try {
    const comparison = await x.engine.compare('local');
    jest
      .spyOn(x.props.sync!.review!, 'compare')
      .mockResolvedValue({ ...comparison, blocked: 'other-account' });
    await x.open();
    expect(JSON.stringify(x.view.toJSON())).toContain(
      'belongs to another account',
    );
    expect(choice(x.view, 'Keep device version')).toBeUndefined();
    expect(choice(x.view, 'Keep cloud version')).toBeUndefined();
    expect(x.server.resolutionCalls).toHaveLength(0);
  } finally {
    await act(async () => x.view.unmount());
  }
});
it('describes saving a deleted workout as one new workout', async () => {
  const x = await screen();
  try {
    x.server.seed('A', null, 'local');
    await x.engine.request();
    await x.open();
    await x.press('Save device as new workout');
    const content = JSON.stringify(x.view.toJSON());
    expect(content).toContain('The deleted cloud workout stays deleted');
    expect(content).not.toContain('Both workouts will count');
  } finally {
    await act(async () => x.view.unmount());
  }
});
