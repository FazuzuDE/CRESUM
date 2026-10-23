import { SharePlanSheet } from '../../components/workout-sharing/SharePlanSheet';
import { AppButton } from '../../components/AppButton';
const { act, create } = jest.requireActual('react-test-renderer');
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));
const id = '550e8400-e29b-41d4-a716-446655440000';
test.each(['list', 'main'])(
  'revocation through %s clears the current QR and Send/Copy actions',
  async (which) => {
    let active = true;
    const client = {
      publish: async () => ({
        origin: { publicationId: id, version: 1 },
        url: 'https://plans.example.test/shared?token=' + 'a'.repeat(64),
      }),
      owned: async () =>
        active
          ? [{ origin: { publicationId: id, version: 1 }, title: 'Plan' }]
          : [],
      revoke: async () => {
        active = false;
      },
    };
    let view: ReturnType<typeof create>;
    await act(async () => {
      view = create(
        <SharePlanSheet
          template={{
            id: 't',
            name: 'Plan',
            exerciseIds: ['barbell-bench-press'],
          }}
          client={client as never}
          signedIn
        />,
      );
    });
    await act(async () =>
      view!.root
        .findAllByType(AppButton)
        .find(
          (b: { props: { title: string } }) =>
            b.props.title === 'Create link and QR',
        )!
        .props.onPress(),
    );
    const disable = view!.root
      .findAllByType(AppButton)
      .filter(
        (b: { props: { title: string } }) =>
          b.props.title === 'Disable this link',
      );
    await act(async () =>
      disable[which === 'list' ? disable.length - 1 : 0].props.onPress(),
    );
    expect(
      view!.root
        .findAllByType(AppButton)
        .some(
          (b: { props: { title: string } }) => b.props.title === 'Send link',
        ),
    ).toBe(false);
    expect(
      view!.root
        .findAllByType(AppButton)
        .some(
          (b: { props: { title: string } }) => b.props.title === 'Copy link',
        ),
    ).toBe(false);
    await act(async () => view!.unmount());
  },
);
