import type { ImageSourcePropType, ImageStyle } from 'react-native';

// Explicit exact-variant bindings; technique pairs and equipment have separate approval.
const floorBridgePair = {
  start: require('../assets/exercises/dumbbell-floor-glute-bridge/start.webp'),
  finish: require('../assets/exercises/dumbbell-floor-glute-bridge/finish.webp'),
};
const stepUpPair = {
  start: require('../assets/exercises/bodyweight-step-up/start.webp'),
  finish: require('../assets/exercises/bodyweight-step-up/finish.webp'),
};
const pallofPair = {
  start: require('../assets/exercises/standing-cable-anti-rotation-press/start.webp'),
  finish: require('../assets/exercises/standing-cable-anti-rotation-press/finish.webp'),
};
const farmersCarryPair = {
  start: require('../assets/exercises/farmers-carry/start.webp'),
  finish: require('../assets/exercises/farmers-carry/finish.webp'),
};
const shrugPair = {
  start: require('../assets/exercises/dumbbell-shrug/start.webp'),
  finish: require('../assets/exercises/dumbbell-shrug/finish.webp'),
};
const backExtensionPair = {
  start: require('../assets/exercises/back-extension/start.webp'),
  finish: require('../assets/exercises/back-extension/finish.webp'),
};
const cableCrunchPair = {
  start: require('../assets/exercises/cable-crunch/start.webp'),
  finish: require('../assets/exercises/cable-crunch/finish.webp'),
};
const kneeRaisePair = {
  start: require('../assets/exercises/hanging-knee-raise/start.webp'),
  finish: require('../assets/exercises/hanging-knee-raise/finish.webp'),
};
const straightLegRaisePair = {
  start: require('../assets/exercises/hanging-straight-leg-raise/start.webp'),
  finish: require('../assets/exercises/hanging-straight-leg-raise/finish.webp'),
};
const captainChairPair = {
  start: require('../assets/exercises/captains-chair-knee-raise/start.webp'),
  finish: require('../assets/exercises/captains-chair-knee-raise/finish.webp'),
};
const plankPair = {
  start: require('../assets/exercises/plank/start.webp'),
  finish: require('../assets/exercises/plank/finish.webp'),
};
const kettlebellSwingPair = {
  start: require('../assets/exercises/kettlebell-swing/start.webp'),
  finish: require('../assets/exercises/kettlebell-swing/finish.webp'),
};
const hipAdductionPair = {
  start: require('../assets/exercises/machine-hip-adduction/start.webp'),
  finish: require('../assets/exercises/machine-hip-adduction/finish.webp'),
};
const seatedCalfPair = {
  start: require('../assets/exercises/seated-calf-raise/start.webp'),
  finish: require('../assets/exercises/seated-calf-raise/finish.webp'),
};
const standingCalfPair = {
  start: require('../assets/exercises/standing-calf-raise/start.webp'),
  finish: require('../assets/exercises/standing-calf-raise/finish.webp'),
};
const cableKickbackPair = {
  start: require('../assets/exercises/cable-glute-kickback/start.webp'),
  finish: require('../assets/exercises/cable-glute-kickback/finish.webp'),
};
const hipThrustPair = {
  start: require('../assets/exercises/barbell-hip-thrust/start.webp'),
  finish: require('../assets/exercises/barbell-hip-thrust/finish.webp'),
};
const dumbbellRomanianDeadliftPair = {
  start: require('../assets/exercises/dumbbell-romanian-deadlift/start.webp'),
  finish: require('../assets/exercises/dumbbell-romanian-deadlift/finish.webp'),
};
const barbellRomanianDeadliftPair = {
  start: require('../assets/exercises/barbell-romanian-deadlift/start.webp'),
  finish: require('../assets/exercises/barbell-romanian-deadlift/finish.webp'),
};
const seatedLegCurlPair = {
  start: require('../assets/exercises/seated-leg-curl/start.webp'),
  finish: require('../assets/exercises/seated-leg-curl/finish.webp'),
};
const lyingLegCurlPair = {
  start: require('../assets/exercises/lying-leg-curl/start.webp'),
  finish: require('../assets/exercises/lying-leg-curl/finish.webp'),
};
const legExtensionPair = {
  start: require('../assets/exercises/leg-extension/start.webp'),
  finish: require('../assets/exercises/leg-extension/finish.webp'),
};
const bulgarianSplitSquatPair = {
  start: require('../assets/exercises/bulgarian-split-squat/start.webp'),
  finish: require('../assets/exercises/bulgarian-split-squat/finish.webp'),
};
const reverseLungePair = {
  start: require('../assets/exercises/dumbbell-reverse-lunge/start.webp'),
  finish: require('../assets/exercises/dumbbell-reverse-lunge/finish.webp'),
};
const dumbbellGobletPair = {
  start: require('../assets/exercises/goblet-squat/start.webp'),
  finish: require('../assets/exercises/goblet-squat/finish.webp'),
};
// Add reviewed female pairs by exact variant; register START and FINISH together.
const femalePairs: Readonly<
  Record<
    string,
    {
      start: ImageSourcePropType;
      finish: ImageSourcePropType;
    }
  >
> = {
  'dumbbell-shoulder-press': {
    start: require('../assets/exercises/dumbbell-shoulder-press/female/start.webp'),
    finish: require('../assets/exercises/dumbbell-shoulder-press/female/finish.webp'),
  },
  'barbell-overhead-press': {
    start: require('../assets/exercises/barbell-overhead-press/female/start.webp'),
    finish: require('../assets/exercises/barbell-overhead-press/female/finish.webp'),
  },
  'machine-shoulder-press': {
    start: require('../assets/exercises/machine-shoulder-press/female/start.webp'),
    finish: require('../assets/exercises/machine-shoulder-press/female/finish.webp'),
  },
  'dumbbell-lateral-raise': {
    start: require('../assets/exercises/dumbbell-lateral-raise/female/start.webp'),
    finish: require('../assets/exercises/dumbbell-lateral-raise/female/finish.webp'),
  },
  'cable-lateral-raise': {
    start: require('../assets/exercises/cable-lateral-raise/female/start.webp'),
    finish: require('../assets/exercises/cable-lateral-raise/female/finish.webp'),
  },
  'reverse-pec-deck': {
    start: require('../assets/exercises/reverse-pec-deck/female/start.webp'),
    finish: require('../assets/exercises/reverse-pec-deck/female/finish.webp'),
  },
  'barbell-bent-over-row': {
    start: require('../assets/exercises/barbell-bent-over-row/female/start.webp'),
    finish: require('../assets/exercises/barbell-bent-over-row/female/finish.webp'),
  },
  'one-arm-dumbbell-row': {
    start: require('../assets/exercises/one-arm-dumbbell-row/female/start.webp'),
    finish: require('../assets/exercises/one-arm-dumbbell-row/female/finish.webp'),
  },
  'chest-supported-dumbbell-row': {
    start: require('../assets/exercises/chest-supported-dumbbell-row/female/start.webp'),
    finish: require('../assets/exercises/chest-supported-dumbbell-row/female/finish.webp'),
  },
  'seated-cable-row-close-neutral-v-handle': {
    start: require('../assets/exercises/seated-cable-row-close-neutral-v-handle/female/start.webp'),
    finish: require('../assets/exercises/seated-cable-row-close-neutral-v-handle/female/finish.webp'),
  },
  'machine-high-row': {
    start: require('../assets/exercises/machine-high-row/female/start.webp'),
    finish: require('../assets/exercises/machine-high-row/female/finish.webp'),
  },
  'push-up': {
    start: require('../assets/exercises/push-up/female/start.webp'),
    finish: require('../assets/exercises/push-up/female/finish.webp'),
  },
  'cable-chest-fly': {
    start: require('../assets/exercises/cable-chest-fly/female/start.webp'),
    finish: require('../assets/exercises/cable-chest-fly/female/finish.webp'),
  },
  'pec-deck-fly': {
    start: require('../assets/exercises/pec-deck-fly/female/start.webp'),
    finish: require('../assets/exercises/pec-deck-fly/female/finish.webp'),
  },
  'machine-chest-press': {
    start: require('../assets/exercises/machine-chest-press/female/start.webp'),
    finish: require('../assets/exercises/machine-chest-press/female/finish.webp'),
  },
  'incline-dumbbell-press': {
    start: require('../assets/exercises/incline-dumbbell-press/female/start.webp'),
    finish: require('../assets/exercises/incline-dumbbell-press/female/finish.webp'),
  },
  'dumbbell-bench-press': {
    start: require('../assets/exercises/dumbbell-bench-press/female/start.webp'),
    finish: require('../assets/exercises/dumbbell-bench-press/female/finish.webp'),
  },
  'barbell-bench-press': {
    start: require('../assets/exercises/barbell-bench-press/female/start.webp'),
    finish: require('../assets/exercises/barbell-bench-press/female/finish.webp'),
  },
  'assisted-dip-machine': {
    start: require('../assets/exercises/assisted-dip-machine/female/start.webp'),
    finish: require('../assets/exercises/assisted-dip-machine/female/finish.webp'),
  },
  'close-grip-bench-press': {
    start: require('../assets/exercises/close-grip-bench-press/female/start.webp'),
    finish: require('../assets/exercises/close-grip-bench-press/female/finish.webp'),
  },
  'lying-barbell-triceps-extension': {
    start: require('../assets/exercises/lying-barbell-triceps-extension/female/start.webp'),
    finish: require('../assets/exercises/lying-barbell-triceps-extension/female/finish.webp'),
  },
  'dumbbell-overhead-triceps-extension': {
    start: require('../assets/exercises/dumbbell-overhead-triceps-extension/female/start.webp'),
    finish: require('../assets/exercises/dumbbell-overhead-triceps-extension/female/finish.webp'),
  },
  'overhead-cable-triceps-extension': {
    start: require('../assets/exercises/overhead-cable-triceps-extension/female/start.webp'),
    finish: require('../assets/exercises/overhead-cable-triceps-extension/female/finish.webp'),
  },
  'cable-triceps-pushdown': {
    start: require('../assets/exercises/cable-triceps-pushdown/female/start.webp'),
    finish: require('../assets/exercises/cable-triceps-pushdown/female/finish.webp'),
  },
  'cable-biceps-curl': {
    start: require('../assets/exercises/cable-biceps-curl/female/start.webp'),
    finish: require('../assets/exercises/cable-biceps-curl/female/finish.webp'),
  },
  'hammer-curl': {
    start: require('../assets/exercises/hammer-curl/female/start.webp'),
    finish: require('../assets/exercises/hammer-curl/female/finish.webp'),
  },
  'ez-bar-curl': {
    start: require('../assets/exercises/ez-bar-curl/female/start.webp'),
    finish: require('../assets/exercises/ez-bar-curl/female/finish.webp'),
  },
  'barbell-curl': {
    start: require('../assets/exercises/barbell-curl/female/start.webp'),
    finish: require('../assets/exercises/barbell-curl/female/finish.webp'),
  },
  'dumbbell-biceps-curl': {
    start: require('../assets/exercises/dumbbell-biceps-curl/female/start.webp'),
    finish: require('../assets/exercises/dumbbell-biceps-curl/female/finish.webp'),
  },
  'kettlebell-goblet-squat': {
    start: require('../assets/exercises/kettlebell-goblet-squat/female/start.webp'),
    finish: require('../assets/exercises/kettlebell-goblet-squat/female/finish.webp'),
  },
  'barbell-deadlift': {
    start: require('../assets/exercises/barbell-deadlift/female/start.webp'),
    finish: require('../assets/exercises/barbell-deadlift/female/finish.webp'),
  },
  'barbell-front-squat': {
    start: require('../assets/exercises/barbell-front-squat/female/start.webp'),
    finish: require('../assets/exercises/barbell-front-squat/female/finish.webp'),
  },
  'barbell-back-squat': {
    start: require('../assets/exercises/barbell-back-squat/female/start.webp'),
    finish: require('../assets/exercises/barbell-back-squat/female/finish.webp'),
  },
  'smith-machine-squat': {
    start: require('../assets/exercises/smith-machine-squat/female/start.webp'),
    finish: require('../assets/exercises/smith-machine-squat/female/finish.webp'),
  },
  'bulgarian-split-squat': {
    start: require('../assets/exercises/bulgarian-split-squat/female/start.webp'),
    finish: require('../assets/exercises/bulgarian-split-squat/female/finish.webp'),
  },
  'dumbbell-reverse-lunge': {
    start: require('../assets/exercises/dumbbell-reverse-lunge/female/start.webp'),
    finish: require('../assets/exercises/dumbbell-reverse-lunge/female/finish.webp'),
  },
  'dumbbell-floor-glute-bridge': {
    start: require('../assets/exercises/dumbbell-floor-glute-bridge/female/start.webp'),
    finish: require('../assets/exercises/dumbbell-floor-glute-bridge/female/finish.webp'),
  },
  'bodyweight-step-up': {
    start: require('../assets/exercises/bodyweight-step-up/female/start.webp'),
    finish: require('../assets/exercises/bodyweight-step-up/female/finish.webp'),
  },
  'standing-cable-anti-rotation-press': {
    start: require('../assets/exercises/standing-cable-anti-rotation-press/female/start.webp'),
    finish: require('../assets/exercises/standing-cable-anti-rotation-press/female/finish.webp'),
  },
  'farmers-carry': {
    start: require('../assets/exercises/farmers-carry/female/start.webp'),
    finish: require('../assets/exercises/farmers-carry/female/finish.webp'),
  },
  'dumbbell-shrug': {
    start: require('../assets/exercises/dumbbell-shrug/female/start.webp'),
    finish: require('../assets/exercises/dumbbell-shrug/female/finish.webp'),
  },
  'back-extension': {
    start: require('../assets/exercises/back-extension/female/start.webp'),
    finish: require('../assets/exercises/back-extension/female/finish.webp'),
  },
  'cable-crunch': {
    start: require('../assets/exercises/cable-crunch/female/start.webp'),
    finish: require('../assets/exercises/cable-crunch/female/finish.webp'),
  },
  'hanging-knee-raise': {
    start: require('../assets/exercises/hanging-knee-raise/female/start.webp'),
    finish: require('../assets/exercises/hanging-knee-raise/female/finish.webp'),
  },
  'hanging-straight-leg-raise': {
    start: require('../assets/exercises/hanging-straight-leg-raise/female/start.webp'),
    finish: require('../assets/exercises/hanging-straight-leg-raise/female/finish.webp'),
  },
  'captains-chair-knee-raise': {
    start: require('../assets/exercises/captains-chair-knee-raise/female/start.webp'),
    finish: require('../assets/exercises/captains-chair-knee-raise/female/finish.webp'),
  },
  plank: {
    start: require('../assets/exercises/plank/female/start.webp'),
    finish: require('../assets/exercises/plank/female/finish.webp'),
  },
  'kettlebell-swing': {
    start: require('../assets/exercises/kettlebell-swing/female/start.webp'),
    finish: require('../assets/exercises/kettlebell-swing/female/finish.webp'),
  },
  'machine-hip-adduction': {
    start: require('../assets/exercises/machine-hip-adduction/female/start.webp'),
    finish: require('../assets/exercises/machine-hip-adduction/female/finish.webp'),
  },
  'seated-calf-raise': {
    start: require('../assets/exercises/seated-calf-raise/female/start.webp'),
    finish: require('../assets/exercises/seated-calf-raise/female/finish.webp'),
  },
  'standing-calf-raise': {
    start: require('../assets/exercises/standing-calf-raise/female/start.webp'),
    finish: require('../assets/exercises/standing-calf-raise/female/finish.webp'),
  },
  'cable-glute-kickback': {
    start: require('../assets/exercises/cable-glute-kickback/female/start.webp'),
    finish: require('../assets/exercises/cable-glute-kickback/female/finish.webp'),
  },
  'barbell-hip-thrust': {
    start: require('../assets/exercises/barbell-hip-thrust/female/start.webp'),
    finish: require('../assets/exercises/barbell-hip-thrust/female/finish.webp'),
  },
  'barbell-romanian-deadlift': {
    start: require('../assets/exercises/barbell-romanian-deadlift/female/start.webp'),
    finish: require('../assets/exercises/barbell-romanian-deadlift/female/finish.webp'),
  },
  'dumbbell-romanian-deadlift': {
    start: require('../assets/exercises/dumbbell-romanian-deadlift/female/start.webp'),
    finish: require('../assets/exercises/dumbbell-romanian-deadlift/female/finish.webp'),
  },
  'seated-leg-curl': {
    start: require('../assets/exercises/seated-leg-curl/female/start.webp'),
    finish: require('../assets/exercises/seated-leg-curl/female/finish.webp'),
  },
  'lying-leg-curl': {
    start: require('../assets/exercises/lying-leg-curl/female/start.webp'),
    finish: require('../assets/exercises/lying-leg-curl/female/finish.webp'),
  },
  'leg-extension': {
    start: require('../assets/exercises/leg-extension/female/start.webp'),
    finish: require('../assets/exercises/leg-extension/female/finish.webp'),
  },
  'leg-press': {
    start: require('../assets/exercises/leg-press/female/start.webp'),
    finish: require('../assets/exercises/leg-press/female/finish.webp'),
  },
  'goblet-squat': {
    start: require('../assets/exercises/goblet-squat/female/start.webp'),
    finish: require('../assets/exercises/goblet-squat/female/finish.webp'),
  },
};
const kettlebellGobletPair = {
  start: require('../assets/exercises/kettlebell-goblet-squat/start.webp'),
  finish: require('../assets/exercises/kettlebell-goblet-squat/finish.webp'),
};
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
const smithSquatPair = {
  start: require('../assets/exercises/smith-machine-squat/start.webp'),
  finish: require('../assets/exercises/smith-machine-squat/finish.webp'),
};
const legPressPair = {
  start: require('../assets/exercises/leg-press/start.webp'),
  finish: require('../assets/exercises/leg-press/finish.webp'),
};
const frontSquatPair = {
  start: require('../assets/exercises/barbell-front-squat/start.webp'),
  finish: require('../assets/exercises/barbell-front-squat/finish.webp'),
};
const backSquatPair = {
  start: require('../assets/exercises/barbell-back-squat/start.webp'),
  finish: require('../assets/exercises/barbell-back-squat/finish.webp'),
};
const pushUpPair = {
  start: require('../assets/exercises/push-up/start.webp'),
  finish: require('../assets/exercises/push-up/finish.webp'),
};
const pecDeckPair = {
  start: require('../assets/exercises/pec-deck-fly/start.webp'),
  finish: require('../assets/exercises/pec-deck-fly/finish.webp'),
};
const cableChestFlyPair = {
  start: require('../assets/exercises/cable-chest-fly/start.webp'),
  finish: require('../assets/exercises/cable-chest-fly/finish.webp'),
};
const machineChestPair = {
  start: require('../assets/exercises/machine-chest-press/start.webp'),
  finish: require('../assets/exercises/machine-chest-press/finish.webp'),
};
const dumbbellBenchPair = {
  start: require('../assets/exercises/dumbbell-bench-press/start.webp'),
  finish: require('../assets/exercises/dumbbell-bench-press/finish.webp'),
};
const inclinePressPair = {
  start: require('../assets/exercises/incline-dumbbell-press/start.webp'),
  finish: require('../assets/exercises/incline-dumbbell-press/finish.webp'),
};
const benchPressPair = {
  start: require('../assets/exercises/barbell-bench-press/start.webp'),
  finish: require('../assets/exercises/barbell-bench-press/finish.webp'),
};
const assistedDipPair = {
  start: require('../assets/exercises/assisted-dip-machine/start.webp'),
  finish: require('../assets/exercises/assisted-dip-machine/finish.webp'),
};
const lyingTricepsPair = {
  start: require('../assets/exercises/lying-barbell-triceps-extension/start.webp'),
  finish: require('../assets/exercises/lying-barbell-triceps-extension/finish.webp'),
};
const closeGripBenchPair = {
  start: require('../assets/exercises/close-grip-bench-press/start.webp'),
  finish: require('../assets/exercises/close-grip-bench-press/finish.webp'),
};
const overheadDumbbellTricepsPair = {
  start: require('../assets/exercises/dumbbell-overhead-triceps-extension/start.webp'),
  finish: require('../assets/exercises/dumbbell-overhead-triceps-extension/finish.webp'),
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
  if (model === 'female') return femalePairs[variantId]?.[phase] ?? null;
  if (model !== 'male') return null;
  if (variantId === 'dumbbell-floor-glute-bridge')
    return floorBridgePair[phase];
  if (variantId === 'bodyweight-step-up') return stepUpPair[phase];
  if (variantId === 'standing-cable-anti-rotation-press')
    return pallofPair[phase];
  if (variantId === 'farmers-carry') return farmersCarryPair[phase];
  if (variantId === 'dumbbell-shrug') return shrugPair[phase];
  if (variantId === 'back-extension') return backExtensionPair[phase];
  if (variantId === 'cable-crunch') return cableCrunchPair[phase];
  if (variantId === 'hanging-knee-raise') return kneeRaisePair[phase];
  if (variantId === 'hanging-straight-leg-raise')
    return straightLegRaisePair[phase];
  if (variantId === 'captains-chair-knee-raise') return captainChairPair[phase];
  if (variantId === 'plank') return plankPair[phase];
  if (variantId === 'kettlebell-swing') return kettlebellSwingPair[phase];
  if (variantId === 'machine-hip-adduction') return hipAdductionPair[phase];
  if (variantId === 'seated-calf-raise') return seatedCalfPair[phase];
  if (variantId === 'standing-calf-raise') return standingCalfPair[phase];
  if (variantId === 'cable-glute-kickback') return cableKickbackPair[phase];
  if (variantId === 'barbell-hip-thrust') return hipThrustPair[phase];
  if (variantId === 'dumbbell-romanian-deadlift')
    return dumbbellRomanianDeadliftPair[phase];
  if (variantId === 'barbell-romanian-deadlift')
    return barbellRomanianDeadliftPair[phase];
  if (variantId === 'seated-leg-curl') return seatedLegCurlPair[phase];
  if (variantId === 'lying-leg-curl') return lyingLegCurlPair[phase];
  if (variantId === 'leg-extension') return legExtensionPair[phase];
  if (variantId === 'bulgarian-split-squat')
    return bulgarianSplitSquatPair[phase];
  if (variantId === 'dumbbell-reverse-lunge') return reverseLungePair[phase];
  if (variantId === 'goblet-squat') return dumbbellGobletPair[phase];
  if (variantId === 'kettlebell-goblet-squat')
    return kettlebellGobletPair[phase];
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
  if (variantId === 'smith-machine-squat') return smithSquatPair[phase];
  if (variantId === 'leg-press') return legPressPair[phase];
  if (variantId === 'barbell-front-squat') return frontSquatPair[phase];
  if (variantId === 'barbell-back-squat') return backSquatPair[phase];
  if (variantId === 'push-up') return pushUpPair[phase];
  if (variantId === 'pec-deck-fly') return pecDeckPair[phase];
  if (variantId === 'cable-chest-fly') return cableChestFlyPair[phase];
  if (variantId === 'machine-chest-press') return machineChestPair[phase];
  if (variantId === 'dumbbell-bench-press') return dumbbellBenchPair[phase];
  if (variantId === 'incline-dumbbell-press') return inclinePressPair[phase];
  if (variantId === 'barbell-bench-press') return benchPressPair[phase];
  if (variantId === 'assisted-dip-machine') return assistedDipPair[phase];
  if (variantId === 'lying-barbell-triceps-extension')
    return lyingTricepsPair[phase];
  if (variantId === 'close-grip-bench-press') return closeGripBenchPair[phase];
  if (variantId === 'dumbbell-overhead-triceps-extension')
    return overheadDumbbellTricepsPair[phase];
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
