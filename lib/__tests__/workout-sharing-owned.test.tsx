import { OwnedLinks } from '../../components/workout-sharing/OwnedLinks';
import { AppButton } from '../../components/AppButton';
const { act, create } = jest.requireActual('react-test-renderer');
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));
test('author can disable an older link without editing local plans', async () => {
  let exists = true;
  const client = {
    owned: async () =>
      exists
        ? [
            {
              origin: {
                publicationId: '550e8400-e29b-41d4-a716-446655440000',
                version: 1,
              },
              title: 'Earlier plan',
            },
          ]
        : [],
    revoke: async () => {
      exists = false;
    },
  };
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(<OwnedLinks client={client as never} />);
  });
  expect(JSON.stringify(view!.toJSON())).toContain('Earlier plan');
  await act(async () =>
    view!.root
      .findAllByType(AppButton)
      .find(
        (b: { props: { title: string } }) =>
          b.props.title === 'Disable this link',
      )!
      .props.onPress(),
  );
  expect(JSON.stringify(view!.toJSON())).not.toContain('Earlier plan');
  await act(async () => view!.unmount());
});

test('same-title snapshots have a visible distinct reference for selective revocation', async () => {
  const client = {
    owned: async () => [
      {
        origin: {
          publicationId: '550e8400-e29b-41d4-a716-446655440000',
          version: 1,
        },
        title: 'Plan',
        createdAt: 1000,
      },
      {
        origin: {
          publicationId: '660e8400-e29b-41d4-a716-446655440000',
          version: 1,
        },
        title: 'Plan',
        createdAt: 2000,
      },
    ],
    revoke: async () => {},
  };
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(<OwnedLinks client={client as never} />);
  });
  const json = JSON.stringify(view!.toJSON());
  expect(json).toContain('550e8400');
  expect(json).toContain('660e8400');
  await act(async () => view!.unmount());
});
