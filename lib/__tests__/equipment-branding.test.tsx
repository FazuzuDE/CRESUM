import { Image } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { BrandWordmark } from '../../components/BrandWordmark';
import { KettlebellCatalogArtwork } from '../../components/KettlebellCatalogArtwork';

it('renders the kettlebell base and the CRESUM mark as separate layers', () => {
  let view!: ReactTestRenderer;
  act(() => {
    view = create(<KettlebellCatalogArtwork size={48} />);
  });
  expect(view.root.findAllByType(Image)).toHaveLength(1);
  expect(view.root.findAllByType(BrandWordmark)).toHaveLength(1);
  act(() => view.unmount());
});
