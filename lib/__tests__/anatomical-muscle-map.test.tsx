import { Text } from 'react-native';
import { Image as SvgImage, Path, G, Mask, ClipPath } from 'react-native-svg';
import { MuscleMap } from '../../components/MuscleMap';
import { projectMuscleParticipation } from '../muscle-participation';
import { colors } from '../theme';
import {
  anatomicalAtlas,
  anatomicalMissingGroups,
} from '../anatomical-muscle-map';
import { muscleTaxonomy } from '../exercise-taxonomy';

const { act, create } = jest.requireActual('react-test-renderer');
const neutral = projectMuscleParticipation(
  [],
  undefined,
  '7d',
  Date.now(),
).muscles;
const source = require('../../assets/muscle-map/male-anatomy-v1/source.png');

it('preserves accepted exteriors, transforms, clips and all unresolved assignments in the runtime adapter', () => {
  const original = require('../../assets/muscle-map/male-anatomy-v1/combined-review/geometry.json');
  const chest = require('../../assets/muscle-map/male-anatomy-v1/chest-regional-study/selected-geometry.json');
  expect(anatomicalAtlas.provenance['source.png']).toBe(
    '39c66852a6e3ae4a93fac1b0ca29ede1bc17d15520f6d0106d0d135a5d8a7e4a',
  );
  expect(anatomicalAtlas.regions).toHaveLength(94);
  expect(
    anatomicalAtlas.regions.filter((r) => r.groupId === null),
  ).toHaveLength(36);
  for (const r of anatomicalAtlas.regions) {
    if (r.groupId === 'chest') {
      const accepted = chest.regions.find((p: { id: string }) => p.id === r.id);
      expect(r.path).toBe(accepted.parentPath);
      expect(r.partitionPath).toBe(accepted.partitionPath);
    } else {
      const accepted = original.regions.find(
        (p: { id: string }) => p.id === r.id,
      );
      expect(r.path).toBe(accepted.path);
      expect(r.transform).toBe(accepted.transform || '');
      expect(r.clipId).toBe(accepted.clipId);
      expect(r.groupId).toBe(accepted.muscleGroupId);
    }
    if (r.groupId !== null)
      expect(muscleTaxonomy.some((m) => m.id === r.groupId)).toBe(true);
  }
  expect(anatomicalMissingGroups.map((m) => m.id).sort()).toEqual([
    'adductors',
    'rear-delts',
    'upper-back',
  ]);
});

it('renders the selected original character in both views, with a neutral no-set state', () => {
  let view!: ReturnType<typeof create>;
  act(() => {
    view = create(<MuscleMap muscles={neutral} onSelect={() => {}} />);
  });
  expect(
    view.root
      .findAllByType(SvgImage)
      .filter((n: { props: { href: unknown } }) => n.props.href === source),
  ).toHaveLength(2);
  expect(
    view.root
      .findAllByType(Text)
      .map((n: { props: { children: unknown } }) => n.props.children),
  ).toEqual(['Front', 'Back']);
  const paths = view.root
    .findAllByType(Path)
    .filter((n: { props: { testID?: string } }) =>
      n.props.testID?.startsWith('anatomical-region-'),
    );
  expect(paths).toHaveLength(58);
  expect(
    paths.every(
      (n: { props: { fill: string } }) => n.props.fill === 'transparent',
    ),
  ).toBe(true);
  act(() => view.unmount());
});

it('opens the chest parent from an accepted region and preserves role precedence without scaling by set count', () => {
  const onSelect = jest.fn();
  const muscles = neutral.map((m) =>
    m.id === 'chest' ? { ...m, primary: 2, secondary: 4 } : m,
  );
  let view!: ReturnType<typeof create>;
  act(() => {
    view = create(
      <MuscleMap muscles={muscles} selected="chest" onSelect={onSelect} />,
    );
  });
  const path = () =>
    view.root.findByProps({
      testID: 'anatomical-region-pectoralis-major-clavicular-left',
    });
  expect(path().props.fill).toBe(colors.musclePrimary);
  expect(path().props.stroke).toBe(colors.textPrimary);
  act(() => path().props.onPress());
  expect(onSelect).toHaveBeenCalledWith('chest');
  const group = () =>
    view.root
      .findAllByType(G)
      .find(
        (n: { props: { testID?: string } }) =>
          n.props.testID === 'anatomical-group-front-chest',
      );
  const opacity = group()!.props.opacity;
  act(() =>
    view.update(
      <MuscleMap
        muscles={muscles.map((m) => ({ ...m, primary: m.primary * 10 }))}
        onSelect={onSelect}
      />,
    ),
  );
  expect(group()!.props.opacity).toBe(opacity);
  expect(path().props.stroke).toBe('none');
  act(() => view.unmount());
});

it('retains secondary role, never paints unresolved shoulder regions, and scopes mask IDs per map instance', () => {
  const muscles = neutral.map((m) => ({ ...m, secondary: 1 }));
  let view!: ReturnType<typeof create>;
  act(() => {
    view = create(
      <>
        <MuscleMap muscles={muscles} onSelect={() => {}} />
        <MuscleMap muscles={muscles} onSelect={() => {}} />
      </>,
    );
  });
  const paths = view.root
    .findAllByType(Path)
    .filter((n: { props: { testID?: string } }) =>
      n.props.testID?.startsWith('anatomical-region-'),
    );
  expect(
    paths.every(
      (n: { props: { fill: string } }) =>
        n.props.fill === colors.muscleSecondary,
    ),
  ).toBe(true);
  expect(
    paths.some((n: { props: { testID: string } }) =>
      n.props.testID.includes('posterior-shoulder-surface'),
    ),
  ).toBe(false);
  const ids = [
    ...view.root.findAllByType(Mask),
    ...view.root.findAllByType(ClipPath),
  ].map((n: { props: { id: string } }) => n.props.id);
  expect(ids.length).toBeGreaterThan(0);
  expect(new Set(ids).size).toBe(ids.length);
  act(() => view.unmount());
});
