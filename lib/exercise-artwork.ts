import type { ImageSourcePropType, ImageStyle } from 'react-native';

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
const assistedPullUpPair = {
  start: require('../assets/exercises/assisted-pull-up/start.webp'),
  finish: require('../assets/exercises/assisted-pull-up/finish.webp'),
};
const highRowPair = {
  start: require('../assets/exercises/machine-high-row/start.webp'),
  finish: require('../assets/exercises/machine-high-row/finish.webp'),
};
const straightArmPair = {
  start: require('../assets/exercises/cable-straight-arm-pulldown/start.webp'),
  finish: require('../assets/exercises/cable-straight-arm-pulldown/finish.webp'),
};
const overheadCableTricepsPair = {
  start: require('../assets/exercises/overhead-cable-triceps-extension/start.webp'),
  finish: require('../assets/exercises/overhead-cable-triceps-extension/finish.webp'),
};
const tricepsPushdownPair = {
  start: require('../assets/exercises/cable-triceps-pushdown/start.webp'),
  finish: require('../assets/exercises/cable-triceps-pushdown/finish.webp'),
};
const cableCurlPair = {
  start: require('../assets/exercises/cable-biceps-curl/start.webp'),
  finish: require('../assets/exercises/cable-biceps-curl/finish.webp'),
};
const hammerCurlPair = {
  start: require('../assets/exercises/hammer-curl/start.webp'),
  finish: require('../assets/exercises/hammer-curl/finish.webp'),
};
const ezBarCurlPair = {
  start: require('../assets/exercises/ez-bar-curl/start.webp'),
  finish: require('../assets/exercises/ez-bar-curl/finish.webp'),
};
const barbellCurlPair = {
  start: require('../assets/exercises/barbell-curl/start.webp'),
  finish: require('../assets/exercises/barbell-curl/finish.webp'),
};
const dumbbellCurlPair = {
  start: require('../assets/exercises/dumbbell-biceps-curl/start.webp'),
  finish: require('../assets/exercises/dumbbell-biceps-curl/finish.webp'),
};
const bandPullApartPair = {
  start: require('../assets/exercises/resistance-band-pull-apart/start.webp'),
  finish: require('../assets/exercises/resistance-band-pull-apart/finish.webp'),
};
const reversePecDeckPair = {
  start: require('../assets/exercises/reverse-pec-deck/start.webp'),
  finish: require('../assets/exercises/reverse-pec-deck/finish.webp'),
};
const cableLateralRaisePair = {
  start: require('../assets/exercises/cable-lateral-raise/start.webp'),
  finish: require('../assets/exercises/cable-lateral-raise/finish.webp'),
};
const lateralRaisePair = {
  start: require('../assets/exercises/dumbbell-lateral-raise/start.webp'),
  finish: require('../assets/exercises/dumbbell-lateral-raise/finish.webp'),
};
const machineShoulderPressPair = {
  start: require('../assets/exercises/machine-shoulder-press/start.webp'),
  finish: require('../assets/exercises/machine-shoulder-press/finish.webp'),
};
const overheadPressPair = {
  start: require('../assets/exercises/barbell-overhead-press/start.webp'),
  finish: require('../assets/exercises/barbell-overhead-press/finish.webp'),
};
const shoulderPressPair = {
  start: require('../assets/exercises/dumbbell-shoulder-press/start.webp'),
  finish: require('../assets/exercises/dumbbell-shoulder-press/finish.webp'),
};
const deadliftPair = {
  start: require('../assets/exercises/barbell-deadlift/start.webp'),
  finish: require('../assets/exercises/barbell-deadlift/finish.webp'),
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
  if (variantId === 'dumbbell-lateral-raise') return lateralRaisePair[phase];
  if (variantId === 'cable-lateral-raise') return cableLateralRaisePair[phase];
  if (variantId === 'reverse-pec-deck') return reversePecDeckPair[phase];
  if (variantId === 'resistance-band-pull-apart')
    return bandPullApartPair[phase];
  if (variantId === 'barbell-curl') return barbellCurlPair[phase];
  if (variantId === 'ez-bar-curl') return ezBarCurlPair[phase];
  if (variantId === 'hammer-curl') return hammerCurlPair[phase];
  if (variantId === 'cable-biceps-curl') return cableCurlPair[phase];
  if (variantId === 'overhead-cable-triceps-extension')
    return overheadCableTricepsPair[phase];
  if (variantId === 'cable-triceps-pushdown') return tricepsPushdownPair[phase];
  if (variantId === 'dumbbell-biceps-curl') return dumbbellCurlPair[phase];
  if (variantId === 'machine-shoulder-press')
    return machineShoulderPressPair[phase];
  if (variantId === 'barbell-overhead-press') return overheadPressPair[phase];
  if (variantId === 'dumbbell-shoulder-press') return shoulderPressPair[phase];
  if (variantId === 'barbell-deadlift') return deadliftPair[phase];
  if (variantId === 'pull-up') return pullUpPair[phase];
  if (variantId === 'assisted-pull-up') return assistedPullUpPair[phase];
  if (variantId === 'machine-high-row') return highRowPair[phase];
  if (variantId === 'cable-straight-arm-pulldown')
    return straightArmPair[phase];
  return null;
}

// Whole-image placement in the shared square contain frame. Calibrated to
// this selected pair's fixed equipment; preserve aspect ratio and source bytes.
const assistedPullUpFinishPlacement: ImageStyle = {
  width: '100.9674%',
  height: '100.9674%',
  left: '-0.3432%',
  top: '1.1505%',
};

export function resolveExerciseArtworkPlacement(
  variantId: string,
  phase: 'start' | 'finish',
  model: 'male' | 'female',
): ImageStyle | undefined {
  if (
    variantId === 'assisted-pull-up' &&
    phase === 'finish' &&
    model === 'male'
  )
    return assistedPullUpFinishPlacement;
  // Align the selected near shoe baseline by ~33 source pixels at 1536px width.
  // Translation only: both phases retain the same contain scale and geometry.
  if (
    variantId === 'barbell-deadlift' &&
    phase === 'finish' &&
    model === 'male'
  )
    return { top: '-2.1484%' };
  return undefined;
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
