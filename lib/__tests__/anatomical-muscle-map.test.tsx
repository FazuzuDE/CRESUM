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
  expect(anatomicalAtlas.regions).toHaveLength(96);
  expect(
    anatomicalAtlas.regions.filter((r) => r.groupId === null),
  ).toHaveLength(30);
  for (const r of anatomicalAtlas.regions) {
    if (r.groupId === 'upper-back') {
      const selected = require('../../assets/muscle-map/male-anatomy-v1/upper-back-projection-study/selected-geometry.json');
      const accepted = selected.regions.find(
        (p: { id: string }) => p.id === r.id,
      );
      expect(r.path).toBe(accepted.path);
      expect(r.transform).toBe(accepted.transform);
      expect(r.representation).toBe('schematic-projection-beneath-trapezius');
    } else if (r.groupId === 'adductors') {
      const accepted = original.regions.find(
        (p: { id: string }) => p.id === r.id,
      );
      expect(r.path).toBe(accepted.path);
      expect(r.transform).toBe(accepted.transform);
      expect(r.clipId).toBe(accepted.clipId);
      expect(r.representation).toBe('partial-visible-medial-thigh-surface');
    } else if (r.groupId === 'rear-delts') {
      const selected = require('../../assets/muscle-map/male-anatomy-v1/rear-deltoid-selected-study/selected-geometry.json');
      const accepted = selected.regions.find(
        (p: { id: string }) => p.id === r.id,
      );
      expect(r.path).toBe(accepted.path);
      expect(r.transform).toBe(accepted.transform);
      expect(r.representation).toBe('schematic-posterior-shoulder-region');
    } else if (r.groupId === 'chest') {
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
  expect(anatomicalMissingGroups.map((m) => m.id).sort()).toEqual([]);
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
  expect(paths).toHaveLength(66);
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

it('retains secondary role, paints the selected shoulder regions, and scopes mask IDs per map instance', () => {
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
  ).toBe(true);
  const ids = [
    ...view.root.findAllByType(Mask),
    ...view.root.findAllByType(ClipPath),
  ].map((n: { props: { id: string } }) => n.props.id);
  expect(ids.length).toBeGreaterThan(0);
  expect(new Set(ids).size).toBe(ids.length);
  act(() => view.unmount());
});

it('renders the selected bilateral projection at fixed role opacity and the approved rightY offset', () => {
  const muscles = neutral.map((m) =>
    m.id === 'upper-back' ? { ...m, primary: 3 } : m,
  );
  const select = jest.fn();
  let v!: ReturnType<typeof create>;
  act(() => {
    v = create(<MuscleMap muscles={muscles} onSelect={select} />);
  });
  const p = v.root
    .findAllByType(Path)
    .find(
      (n: any) =>
        n.props.testID === 'anatomical-region-upper-back-projection-right',
    );
  expect(p).toBeDefined();
  expect(p!.props.transform).toBe('translate(0 -1.5)');
  expect(p!.props.fill).toBe(colors.musclePrimary);
  act(() => p!.props.onPress());
  expect(select).toHaveBeenCalledWith('upper-back');
  const groups = v.root
    .findAllByType(G)
    .filter((n: any) => n.props.testID?.startsWith('anatomical-group-back-'));
  expect(
    groups.findIndex((n: any) => n.props.testID.endsWith('upper-back')),
  ).toBeGreaterThan(
    groups.findIndex((n: any) => n.props.testID.endsWith('traps')),
  );
  expect(
    groups.find((n: any) => n.props.testID.endsWith('upper-back'))!.props
      .opacity,
  ).toBe(0.62);
  act(() => v.unmount());
});

it.each([
  [1, 0, 0, 1, 'traps', 'upper-back'],
  [0, 1, 1, 0, 'upper-back', 'traps'],
  [1, 0, 1, 0, 'traps', 'upper-back'],
  [0, 1, 0, 1, 'traps', 'upper-back'],
  [1, 0, 0, 0, null, null],
  [0, 1, 0, 0, null, null],
  [0, 0, 1, 0, null, null],
] as const)(
  'resolves projection/traps role pair %s/%s against %s/%s once',
  (up, us, tp, ts, loser, winner) => {
    const muscles = neutral.map((m) =>
      m.id === 'upper-back'
        ? { ...m, primary: up!, secondary: us! }
        : m.id === 'traps'
          ? { ...m, primary: tp!, secondary: ts! }
          : m,
    );
    const original = JSON.stringify(muscles);
    let v!: ReturnType<typeof create>;
    act(() => {
      v = create(<MuscleMap muscles={muscles} />);
    });
    const cutouts = v.root
      .findAllByType(Mask)
      .filter((n: any) => n.props.testID === 'anatomical-role-occlusion-back');
    expect(cutouts).toHaveLength(loser ? 1 : 0);
    if (loser) {
      const group = v.root
        .findAllByType(G)
        .find((n: any) => n.props.testID === 'anatomical-group-back-' + loser)!;
      expect(group.props.mask).toBe('url(#' + cutouts[0].props.id + ')');
      const expected = anatomicalAtlas.regions.filter(
        (r) => r.groupId === winner,
      );
      const black = cutouts[0]
        .findAllByType(Path)
        .filter((n: any) => n.props.fill === 'black');
      expect(black.map((n: any) => n.props.d)).toEqual(
        expected.map((r) => r.path),
      );
      expect(black.map((n: any) => n.props.transform)).toEqual(
        expected.map((r) => r.transform || undefined),
      );
    }
    expect(JSON.stringify(muscles)).toBe(original);
    act(() => v.unmount());
  },
);

it('selects both saved rear-shoulder regions as rear-delts with fixed roles and screenshot translation', () => {
  const onSelect = jest.fn();
  let v: ReturnType<typeof create>;
  act(() => {
    v = create(
      <MuscleMap
        muscles={neutral.map((m) =>
          m.id === 'rear-delts' ? { ...m, primary: 1 } : m,
        )}
        onSelect={onSelect}
      />,
    );
  });
  for (const [side, transform] of [
    ['left', 'translate(0 0)'],
    ['right', 'translate(1.5 0)'],
  ]) {
    const p = v!.root.findByProps({
      testID: `anatomical-region-posterior-shoulder-surface-${side}-reference`,
    });
    expect(p.props.fill).toBe(colors.musclePrimary);
    expect(p.props.transform).toBe(transform);
    act(() => p.props.onPress());
  }
  expect(onSelect.mock.calls).toEqual([['rear-delts'], ['rear-delts']]);
  expect(anatomicalMissingGroups.map((m) => m.id)).toEqual([]);
  act(() => v!.unmount());
});

it('binds all four accepted medial-thigh patches to the adductor parent', () => {
  const onSelect = jest.fn();
  let v: ReturnType<typeof create>;
  act(() => {
    v = create(
      <MuscleMap
        muscles={neutral.map((m) =>
          m.id === 'adductors' ? { ...m, secondary: 1 } : m,
        )}
        onSelect={onSelect}
      />,
    );
  });
  for (const [id, transform] of [
    ['adductor-longus-left', 'translate(0.5 1.5)'],
    ['adductor-longus-right', 'translate(1.5 0.5)'],
    ['gracilis-left', 'translate(0 0)'],
    ['gracilis-right', 'translate(1.5 2)'],
  ]) {
    const p = v!.root.findByProps({ testID: `anatomical-region-${id}` });
    expect(p.props.fill).toBe(colors.muscleSecondary);
    expect(p.props.transform).toBe(transform);
    act(() => p.props.onPress());
  }
  expect(onSelect.mock.calls).toEqual([
    ['adductors'],
    ['adductors'],
    ['adductors'],
    ['adductors'],
  ]);
  expect(anatomicalMissingGroups).toEqual([]);
  act(() => v!.unmount());
});
