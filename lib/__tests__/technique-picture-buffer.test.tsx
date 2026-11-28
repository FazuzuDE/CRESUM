import { Image } from 'react-native';
import { TechniqueArtwork } from '../../components/TechniqueArtwork';

const { act, create } = jest.requireActual('react-test-renderer');

it('retains the visible phase until the next one loads, then reuses both images', () => {
  const artwork = (phase: 'START' | 'FINISH') => (
    <TechniqueArtwork imageKey="barbell-bench-press" phase={phase} />
  );
  let view!: ReturnType<typeof create>;
  act(() => {
    view = create(artwork('START'));
  });
  const images = () => view.root.findAllByType(Image);
  const visible = () =>
    images().filter((image: { props: { accessibilityLabel?: string } }) =>
      Boolean(image.props.accessibilityLabel),
    );
  try {
    expect(images()).toHaveLength(1);
    const start = images()[0];
    act(() => start.props.onLoad());
    expect(images()).toHaveLength(2);
    const finish = images()[1];
    act(() => view.update(artwork('FINISH')));
    expect(visible()).toEqual([start]);
    act(() => finish.props.onLoad());
    expect(visible()).toEqual([finish]);
    act(() => view.update(artwork('START')));
    expect(visible()).toEqual([start]);
    expect(images()).toEqual([start, finish]);
  } finally {
    act(() => view.unmount());
  }
});
