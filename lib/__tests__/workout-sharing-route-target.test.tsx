import SharedPlanRoute from '../../app/shared';
const { act, create } = jest.requireActual('react-test-renderer');
const mockTargets: unknown[] = [];
const mockRouter = { dismissTo: (href: unknown) => mockTargets.push(href) };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({ token: 'a'.repeat(64) }),
  Redirect: () => null,
}));
test('incoming route dismisses back to the existing root instead of replacing with a second store screen', async () => {
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(<SharedPlanRoute />);
  });
  expect(mockTargets).toEqual([
    { pathname: '/', params: { sharedToken: 'a'.repeat(64) } },
  ]);
  await act(async () => view!.unmount());
});
