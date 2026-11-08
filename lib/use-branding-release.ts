import { useEffect, useState } from 'react';
import { parseBrandingRelease, type BrandingRelease } from './branding-release';

type CachedBranding = { release: BrandingRelease; logo?: string };

function publicationUrl() {
  try {
    const url = new URL(process.env.EXPO_PUBLIC_BRANDING_RELEASE_URL ?? '');
    return url.protocol === 'https:' && !url.username && !url.password
      ? url
      : null;
  } catch {
    return null;
  }
}

const maxLogoBytes = 1024 * 1024;
const validLogo = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length <= 4 * Math.ceil(maxLogoBytes / 3) + 32 &&
  /^data:image\/(png|webp|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);

async function downloadLogo(url: string, signal: AbortSignal) {
  const response = await fetch(url, { signal, redirect: 'error' });
  if (
    !response.ok ||
    (response.url && new URL(response.url).origin !== new URL(url).origin)
  ) {
    return null;
  }
  const blob = await response.blob();
  if (
    !blob.size ||
    blob.size > maxLogoBytes ||
    !/^image\/(png|webp|jpeg)$/.test(blob.type)
  ) {
    return null;
  }
  const logo = await new Promise<unknown>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
  if (!validLogo(logo)) return null;
  return logo;
}

export function useBrandingRelease() {
  const [branding, setBranding] = useState<CachedBranding | null>(null);

  useEffect(() => {
    const endpoint = publicationUrl();
    if (!endpoint) return;
    const controller = new AbortController();
    const { signal } = controller;
    const key = 'cresum:branding:v1:' + endpoint.href;
    async function refresh() {
      if (!endpoint) return;
      const { default: storage } =
        await import('@react-native-async-storage/async-storage');
      if (signal.aborted) return;
      let currentRevision = 0;
      try {
        const stored = JSON.parse((await storage.getItem(key)) ?? 'null');
        const release = parseBrandingRelease(stored?.release, endpoint.origin);
        if (release && (release.mode !== 'custom' || validLogo(stored.logo))) {
          currentRevision = release.revision;
          if (!signal.aborted) setBranding({ release, logo: stored.logo });
        }
      } catch {
        // A corrupt or unavailable cache does not prevent a network refresh.
      }
      const response = await fetch(endpoint.href, {
        signal,
        redirect: 'error',
      });
      if (
        !response.ok ||
        (response.url && new URL(response.url).origin !== endpoint.origin)
      )
        return;
      const release = parseBrandingRelease(
        await response.json(),
        endpoint.origin,
      );
      if (!release || release.revision <= currentRevision || signal.aborted)
        return;
      const logo =
        release.mode === 'custom'
          ? await downloadLogo(release.logoUrl, signal)
          : undefined;
      if (signal.aborted || (release.mode === 'custom' && !logo)) return;
      const next = { release, logo: logo ?? undefined };
      await storage.setItem(key, JSON.stringify(next));
      if (!signal.aborted) setBranding(next);
    }
    void refresh().catch(() => {
      // Keep the last cached or bundled artwork when delivery fails.
    });
    return () => controller.abort();
  }, []);

  return branding;
}
