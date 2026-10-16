import { HistorySyncPanel } from '../../components/HistorySyncPanel';
import { AppButton } from '../../components/AppButton';
const { act, create } = jest.requireActual('react-test-renderer');
it.each([
  ['disabled', 'Enable cloud backup', 'Cloud backup is off'],
  ['paused', 'Resume cloud backup', 'Cloud backup is paused'],
  ['synced', 'Sync Now', 'Synced'],
  ['syncing', 'Sync Now', 'Syncing…'],
  ['error', 'Sync Now', 'Couldn’t sync'],
])('shows truthful %s controls', async (status, title, copy) => {
  const enable = jest.fn(),
    syncNow = jest.fn();
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(
      <HistorySyncPanel
        snapshot={{
          status: status as 'disabled',
          kind: status === 'error' ? 'conflict' : null,
        }}
        onEnable={enable}
        onSync={syncNow}
      />,
    );
  });
  expect(JSON.stringify(view.toJSON())).toContain(copy);
  const button = view.root.findByType(AppButton);
  expect(button.props.title).toBe(title);
  expect(button.props.disabled).toBe(status === 'syncing');
  if (!button.props.disabled) act(() => button.props.onPress());
  expect(
    status === 'disabled' || status === 'paused' ? enable : syncNow,
  ).toHaveBeenCalledTimes(status === 'syncing' ? 0 : 1);
  await act(async () => view.unmount());
});
