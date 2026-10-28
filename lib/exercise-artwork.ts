import type { ImageSourcePropType } from 'react-native';

// Explicit exact-variant bindings; technique pairs and equipment have separate approval.
const ergonomic = 'lat-pulldown-close-neutral-ergonomic-handle';
const pair = {
  start: require('../assets/exercises/lat-pulldown-close-neutral-ergonomic-handle/start.webp'),
  finish: require('../assets/exercises/lat-pulldown-close-neutral-ergonomic-handle/finish.webp'),
};
const vHandlePair = {
  start: require('../assets/exercises/lat-pulldown-close-neutral-v-handle/start.webp'),
  finish: require('../assets/exercises/lat-pulldown-close-neutral-v-handle/finish.webp'),
};
const wideBarPair = {
  start: require('../assets/exercises/lat-pulldown-wide-pronated-bar/start.webp'),
  finish: require('../assets/exercises/lat-pulldown-wide-pronated-bar/finish.webp'),
};
const reverseGripPair = {
  start: require('../assets/exercises/lat-pulldown-reverse-grip/start.webp'),
  finish: require('../assets/exercises/lat-pulldown-reverse-grip/finish.webp'),
};
const seatedRowPair = {
  start: require('../assets/exercises/seated-cable-row-close-neutral-v-handle/start.webp'),
  finish: require('../assets/exercises/seated-cable-row-close-neutral-v-handle/finish.webp'),
};
const oneArmRowPair = {
  start: require('../assets/exercises/one-arm-dumbbell-row/start.webp'),
  finish: require('../assets/exercises/one-arm-dumbbell-row/finish.webp'),
};
const chestSupportedRowPair = {
  start: require('../assets/exercises/chest-supported-dumbbell-row/start.webp'),
  finish: require('../assets/exercises/chest-supported-dumbbell-row/finish.webp'),
};
const barbellRowPair = {
  start: require('../assets/exercises/barbell-bent-over-row/start.webp'),
  finish: require('../assets/exercises/barbell-bent-over-row/finish.webp'),
};
const pullUpPair = {
  start: require('../assets/exercises/pull-up/start.webp'),
  finish: require('../assets/exercises/pull-up/finish.webp'),
};
const attachment = require('../assets/exercises/lat-pulldown-close-neutral-ergonomic-handle/attachment.webp');
const vHandleAttachment = require('../assets/exercises/lat-pulldown-close-neutral-v-handle/attachment.webp');
const wideBarAttachment = require('../assets/exercises/lat-pulldown-wide-pronated-bar/attachment.webp');

export function resolveExerciseArtwork(
  variantId: string,
  phase: 'start' | 'finish',
  model: 'male' | 'female',
): ImageSourcePropType | null {
  if (model !== 'male') return null;
  if (variantId === ergonomic) return pair[phase];
  if (variantId === 'lat-pulldown-close-neutral-v-handle')
    return vHandlePair[phase];
  if (variantId === 'lat-pulldown-wide-pronated-bar') return wideBarPair[phase];
  if (variantId === 'lat-pulldown-reverse-grip') return reverseGripPair[phase];
  if (variantId === 'seated-cable-row-close-neutral-v-handle')
    return seatedRowPair[phase];
  if (variantId === 'one-arm-dumbbell-row') return oneArmRowPair[phase];
  if (variantId === 'chest-supported-dumbbell-row')
    return chestSupportedRowPair[phase];
  if (variantId === 'barbell-bent-over-row') return barbellRowPair[phase];
  if (variantId === 'pull-up') return pullUpPair[phase];
  return null;
}

export function resolveAttachmentArtwork(
  variantId: string,
): ImageSourcePropType | null {
  if (variantId === ergonomic) return attachment;
  if (variantId === 'lat-pulldown-close-neutral-v-handle')
    return vHandleAttachment;
  if (variantId === 'lat-pulldown-wide-pronated-bar') return wideBarAttachment;
  if (variantId === 'seated-cable-row-close-neutral-v-handle')
    return vHandleAttachment;
  return null;
}
