import React from 'react';
import { act, create } from 'react-test-renderer';
import { TextInput } from 'react-native';
import {
  AccountSection,
  type AccountSectionProps,
} from '../../components/AccountSection';
import { AppButton } from '../../components/AppButton';
const A = '11111111-1111-4111-8111-111111111111';
function props(): AccountSectionProps {
  return {
    snapshot: {
      status: 'signed_in',
      identity: { id: A, email: 'a@example.com' },
      configured: true,
      error: null,
      busy: null,
    },
    sendEmailOtp: async () => {},
    verifyEmailOtp: async () => {},
    signOut: async () => {},
    deleteAccount: async () => {},
  };
}
const find = (v: ReturnType<typeof create>, name: string) =>
  v.root.findAllByType(AppButton).find((n) => n.props.title === name)!;
it('requires explicit account-named DELETE confirmation and supports cancellation', async () => {
  const p = props(),
    calls: string[] = [];
  p.deleteAccount = async (id) => {
    calls.push(id);
  };
  let v!: ReturnType<typeof create>;
  await act(async () => {
    v = create(<AccountSection {...p} />);
  });
  await act(async () => find(v, 'Delete account').props.onPress());
  expect(JSON.stringify(v.toJSON())).toContain('a@example.com');
  expect(JSON.stringify(v.toJSON())).toContain('local workouts');
  expect(find(v, 'Permanently delete account').props.disabled).toBe(true);
  await act(async () =>
    v.root
      .findAllByType(TextInput)
      .find(
        (n) =>
          n.props.accessibilityLabel ===
          'Type DELETE to confirm account deletion',
      )!
      .props.onChangeText('DELETE'),
  );
  expect(find(v, 'Permanently delete account').props.disabled).toBe(false);
  await act(async () => find(v, 'Keep account').props.onPress());
  expect(calls).toEqual([]);
  await act(async () => find(v, 'Delete account').props.onPress());
  expect(find(v, 'Permanently delete account').props.disabled).toBe(true);
  await act(async () => v.unmount());
});
it('submits the confirmed owner once and prevents overlapping actions', async () => {
  const p = props();
  let done!: () => void;
  const calls: string[] = [];
  p.deleteAccount = (id) => {
    calls.push(id);
    return new Promise((r) => {
      done = r;
    });
  };
  let v!: ReturnType<typeof create>;
  await act(async () => {
    v = create(<AccountSection {...p} />);
  });
  await act(async () => find(v, 'Delete account').props.onPress());
  await act(async () =>
    v.root
      .findAllByType(TextInput)
      .find(
        (n) =>
          n.props.accessibilityLabel ===
          'Type DELETE to confirm account deletion',
      )!
      .props.onChangeText('DELETE'),
  );
  await act(async () => {
    find(v, 'Permanently delete account').props.onPress();
    find(v, 'Permanently delete account').props.onPress();
  });
  expect(calls).toEqual([A]);
  expect(find(v, 'Deleting account…').props.disabled).toBe(true);
  await act(async () => {
    done();
  });
  await act(async () => v.unmount());
});
it('does not enable deletion while the server rollout is disabled', async () => {
  const p = props();
  p.deleteAccount = undefined;
  let v!: ReturnType<typeof create>;
  await act(async () => {
    v = create(<AccountSection {...p} />);
  });
  expect(find(v, 'Delete account').props.disabled).toBe(true);
  expect(JSON.stringify(v.toJSON())).toContain('not available yet');
  await act(async () => v.unmount());
});
it('hides normal cloud resume controls while deletion is unresolved', async () => {
  const p = props();
  p.snapshot.deletion = { userId: A, status: 'pending' };
  p.sync = {
    snapshot: { status: 'paused', kind: null },
    onEnable: () => {},
    onSync: () => {},
  };
  let v!: ReturnType<typeof create>;
  await act(async () => {
    v = create(<AccountSection {...p} />);
  });
  expect(find(v, 'Resume cloud backup')).toBeUndefined();
  expect(JSON.stringify(v.toJSON())).toContain('not confirmed');
  expect(find(v, 'Retry account deletion')).toBeDefined();
  await act(async () => v.unmount());
});
it('clears confirmation when the viewed account changes', async () => {
  const p = props();
  let v!: ReturnType<typeof create>;
  await act(async () => {
    v = create(<AccountSection {...p} />);
  });
  await act(async () => find(v, 'Delete account').props.onPress());
  await act(async () => {
    v.update(
      <AccountSection
        {...p}
        snapshot={{
          ...p.snapshot,
          identity: { id: 'other', email: 'b@example.com' },
        }}
      />,
    );
  });
  expect(find(v, 'Permanently delete account')).toBeUndefined();
  await act(async () => v.unmount());
});
