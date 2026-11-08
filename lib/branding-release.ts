type LogoLayout = { x: number; y: number; width: number };

type ReleaseMetadata = {
  schema: 1;
  revision: number;
  target: 'kettlebell';
  artworkRevision: 1;
};

export type BrandingRelease = ReleaseMetadata &
  (
    | { mode: 'builtin' | 'disabled' }
    | { mode: 'custom'; logoUrl: string; layout: LogoLayout }
  );

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const percentage = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= 0 &&
  value <= 100;

export function parseBrandingRelease(
  value: unknown,
  assetOrigin: string,
): BrandingRelease | null {
  if (
    !record(value) ||
    value.schema !== 1 ||
    typeof value.revision !== 'number' ||
    !Number.isSafeInteger(value.revision) ||
    value.revision < 1 ||
    value.target !== 'kettlebell' ||
    value.artworkRevision !== 1
  )
    return null;

  const metadata: ReleaseMetadata = {
    schema: 1,
    revision: value.revision,
    target: 'kettlebell',
    artworkRevision: 1,
  };
  if (value.mode === 'builtin' || value.mode === 'disabled') {
    return { ...metadata, mode: value.mode };
  }
  if (
    value.mode !== 'custom' ||
    typeof value.logoUrl !== 'string' ||
    !record(value.layout)
  ) {
    return null;
  }
  const { x, y, width } = value.layout;
  if (!percentage(x) || !percentage(y) || !percentage(width)) return null;
  try {
    const url = new URL(value.logoUrl);
    if (
      url.protocol !== 'https:' ||
      url.origin !== assetOrigin ||
      url.username ||
      url.password
    ) {
      return null;
    }
    return {
      ...metadata,
      mode: 'custom',
      logoUrl: url.href,
      layout: { x, y, width },
    };
  } catch {
    return null;
  }
}
