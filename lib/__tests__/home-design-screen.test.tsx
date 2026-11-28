import { View } from 'react-native';
import { ProfileSettings } from '../../components/ProfileSettings';
import { AppButton } from '../../components/AppButton';
import { HOME_DESIGN_KEY, useHomeDesign } from '../../components/useHomeDesign';

const { act, create } = jest.requireActual('react-test-renderer');
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));

it('selects bca through Profile Appearance, restores on re-open and reverts', async () => {
  const cache = new Map<string, string>();
  const storage = {
    getItem: jest.fn(async (key: string) => cache.get(key) ?? null),
    setItem: jest.fn(async (key: string, val: string) => {
      cache.set(key, val);
    }),
  };
  function Screen() {
    const design = useHomeDesign(storage);
    return (
      <View testID={design.value}>
        <ProfileSettings
          homeDesign={design}
          templates={[]}
          busy={false}
          createTemplate={jest.fn()}
          updateTemplate={jest.fn()}
          deleteTemplate={jest.fn()}
        />
      </View>
    );
  }
  let view: ReturnType<typeof create>;
  const open = () =>
    act(async () => {
      view = create(<Screen />);
    });
  const button = (title: string) =>
    view.root
      .findAllByType(AppButton)
      .find((b: { props: { title: string } }) => b.props.title === title)!;
  await open();
  await act(async () => button('Appearance').props.onPress());
  expect(button('Original').props.selected).toBe(true);
  await act(async () => button('bca').props.onPress());
  expect(button('bca').props.selected).toBe(true);
  expect(storage.setItem).toHaveBeenCalledWith(HOME_DESIGN_KEY, 'bca');
  await act(async () => view.unmount());
  await open();
  await act(async () => button('Appearance').props.onPress());
  expect(button('bca').props.selected).toBe(true);
  storage.setItem.mockRejectedValueOnce(new Error('disk'));
  await act(async () => button('Original').props.onPress());
  expect(button('bca').props.selected).toBe(true);
  await act(async () => button('Original').props.onPress());
  expect(cache.get(HOME_DESIGN_KEY)).toBe('original');
  expect(button('Original').props.selected).toBe(true);
  await act(async () => view.unmount());
});
