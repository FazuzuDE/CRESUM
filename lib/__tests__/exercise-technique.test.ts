import { exerciseLibrary } from '../exercise-library';
import {
  findTechnique,
  techniqueCatalog,
  techniqueSources,
} from '../exercise-technique';

it('covers every current exercise with offline setup, execution, control and errors', () => {
  expect(Object.keys(techniqueCatalog).sort()).toEqual(
    exerciseLibrary.map((e) => e.id).sort(),
  );
  for (const e of exerciseLibrary) {
    const t = findTechnique(e.id)!;
    expect(t).toBeDefined();
    for (const key of ['setup', 'movement', 'checks', 'mistakes'] as const)
      expect(t[key].length).toBeGreaterThan(0);
    expect(t.sources.length).toBeGreaterThan(0);
    for (const source of t.sources) {
      expect(techniqueSources[source]).toBeDefined();
      expect(techniqueSources[source].url).toMatch(/^https:\/\//);
    }
  }
});
it('resolves legacy names without rewriting generic identities or inventing unknown techniques', () => {
  expect(findTechnique('pulldown')).toBe(findTechnique('lat-pulldown'));
  expect(findTechnique('not-an-exercise')).toBeUndefined();
  expect(findTechnique('lat-pulldown')!.scope).toMatch(/unspecified/i);
  expect(findTechnique('lat-pulldown-close-neutral-v-handle')!.scope).toMatch(
    /V-handle/i,
  );
  expect(findTechnique('lat-pulldown-reverse-grip')!.scope).toMatch(
    /supinated/i,
  );
  expect(findTechnique('lat-pulldown-wide-pronated-bar')!.scope).toMatch(
    /pronated/i,
  );
});
it('keeps floor bridges distinct from bench-supported thrusts and duration/distance instructions explicit', () => {
  expect(findTechnique('dumbbell-floor-glute-bridge')!.setup.join(' ')).toMatch(
    /floor/i,
  );
  expect(findTechnique('barbell-hip-thrust')!.setup.join(' ')).toMatch(
    /bench/i,
  );
  expect(findTechnique('plank')!.scope).toMatch(/hold|duration/i);
  expect(findTechnique('farmers-carry')!.scope).toMatch(/distance/i);
});

it('keeps generic barbell row grip unspecified and labels its source example', () => {
  const row = findTechnique('barbell-bent-over-row')!;
  expect(row.scope).toMatch(/grip.*unspecified/i);
  expect(row.setup.join(' ')).not.toMatch(/overhand/i);
  expect(row.adaptation).toMatch(/overhand.*example/i);
});
