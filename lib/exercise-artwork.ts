import type { ImageSourcePropType } from 'react-native';

// Explicit exact-variant binding; other grips/models keep their placeholders.
const ergonomic = 'lat-pulldown-close-neutral-ergonomic-handle';
const pair = {
  start: require('../assets/exercises/lat-pulldown-close-neutral-ergonomic-handle/start.webp'),
  finish: require('../assets/exercises/lat-pulldown-close-neutral-ergonomic-handle/finish.webp'),
};
const attachment = require('../assets/exercises/lat-pulldown-close-neutral-ergonomic-handle/attachment.webp');

export function resolveExerciseArtwork(
  variantId: string,
  phase: 'start' | 'finish',
  model: 'male' | 'female',
): ImageSourcePropType | null {
  return variantId === ergonomic && model === 'male' ? pair[phase] : null;
}

export function resolveAttachmentArtwork(
  variantId: string,
): ImageSourcePropType | null {
  return variantId === ergonomic ? attachment : null;
}
