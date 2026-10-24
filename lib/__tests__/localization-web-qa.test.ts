const { prepareQaBundle, expandCatalog, assertQaPlan } = jest.requireActual(
  '../../scripts/localization-web-qa.cjs',
);

const registry = `__d(function(g,r,i,a,m,e,d){Object.defineProperty(e,"localeRegistry",{get:()=>registry});const registry={en:{released:!0},ru:{released:!1},de:{released:!1},fr:{released:!1}}},7,[]);`;
const messages = `__d(function(g,r,i,a,m,e,d){Object.defineProperty(e,"catalogs",{get:()=>catalogs});const catalogs={en:{hello:"Hello"}}},8,[]);`;

it('opens all locale choices only in the served QA registry module', () => {
  const unrelated = '__d(function(){const other={released:!1}},9,[]);';
  const original = registry + messages + unrelated;
  const served = prepareQaBundle(original);
  expect(served).toContain('ru:{released:!0}');
  expect(served).toContain(unrelated);
  expect(original).toContain('ru:{released:!1}');
});

it('checks exact saved plan values rather than numeric substrings', () => {
  const stored = (sets: number, weight: string) =>
    JSON.stringify({
      activeWorkout: null,
      history: [],
      templates: [
        {
          name: 'QA-localized-plan',
          exerciseIds: ['dumbbell-lateral-raise'],
          plannedExercises: [
            { exerciseId: 'dumbbell-lateral-raise', sets, weight },
          ],
        },
      ],
    });
  expect(() => assertQaPlan(stored(4, '12.5'))).not.toThrow();
  expect(() => assertQaPlan(stored(3, '12.5'))).toThrow(/planned/i);
  expect(() => assertQaPlan(stored(4, '112.5'))).toThrow(/planned/i);
});

it('fails closed if the export has missing or ambiguous registry modules', () => {
  expect(() => prepareQaBundle(messages)).toThrow(/registry/i);
  expect(() => prepareQaBundle(registry + registry)).toThrow(/registry/i);
});

it('expands literal text without changing interpolation and plural structure', () => {
  const source = {
    hello: 'Save {{name}}',
    sets: { one: '{{count}} set', other: '{{count}} sets' },
  };
  const expanded = expandCatalog(source);
  expect(expanded.hello).toContain('{{name}}');
  expect(expanded.hello.length).toBeGreaterThan(source.hello.length);
  expect(Object.keys(expanded.sets)).toEqual(['one', 'other']);
  expect(expanded.sets.other).toContain('{{count}}');
  expect(source.hello).toBe('Save {{name}}');
});

it('replaces only QA-served catalogs for expanded-text runs', () => {
  const catalogs = { en: { hello: 'Expanded {{name}}' } };
  const served = prepareQaBundle(registry + messages, catalogs);
  expect(served).toContain('Expanded {{name}}');
  expect(served).not.toContain('hello:"Hello"');
  expect(() => prepareQaBundle(registry, catalogs)).toThrow(/catalog/i);
});

it('also expands Cyrillic and accented Latin labels beyond wrapper brackets', () => {
  const input = { russian: 'Разминка {{name}}', french: 'Été {{name}}' };
  const expanded = expandCatalog(input);
  expect(expanded.russian.length).toBeGreaterThan(input.russian.length + 2);
  expect(expanded.french.length).toBeGreaterThan(input.french.length + 2);
  expect(expanded.russian).toContain('{{name}}');
});
