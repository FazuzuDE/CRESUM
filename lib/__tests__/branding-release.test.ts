import { parseBrandingRelease } from '../branding-release';

const origin = 'https://assets.example.com';
const release = {
  schema: 1,
  revision: 2,
  target: 'kettlebell',
  artworkRevision: 1,
  mode: 'custom',
  logoUrl: origin + '/kettlebell/2.png',
  layout: { x: 50, y: 66, width: 41 },
};

it('accepts the approved layout and boundary slider values', () => {
  const layout = { x: 0, y: 100, width: 0 };
  expect(parseBrandingRelease({ ...release, layout }, origin)).toEqual({
    ...release,
    layout,
  });
});

it.each([
  { schema: 2 },
  { revision: 0 },
  { artworkRevision: 2 },
  { target: 'dumbbell' },
  { logoUrl: 'https://assets.example.com.evil.test/logo.png' },
  { logoUrl: 'http://assets.example.com/logo.png' },
  { layout: { x: 101, y: 66, width: 41 } },
  { layout: { x: 50, y: 66, width: 41.5 } },
])('rejects incompatible or malformed payloads %#', (override) => {
  expect(parseBrandingRelease({ ...release, ...override }, origin)).toBeNull();
});

it('distinguishes a disabled logo from the built-in CRESUM logo', () => {
  for (const mode of ['disabled', 'builtin']) {
    const payload = {
      schema: 1,
      revision: 3,
      target: 'kettlebell',
      artworkRevision: 1,
      mode,
    };
    expect(parseBrandingRelease(payload, origin)).toEqual(payload);
  }
});
