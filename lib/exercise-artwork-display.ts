import type { ImageSourcePropType, ImageStyle } from 'react-native';

type Character = 'male' | 'female';

// These separate thumbnails neutralize the legacy studio matte while retaining
// the full artwork and its original phases for technique and anatomy.
const neutralThumbnails: Readonly<
  Record<string, Partial<Record<Character, ImageSourcePropType>>>
> = {
  'barbell-curl': {
    male: require('../assets/exercises/barbell-curl/thumbnail.webp'),
    female: require('../assets/exercises/barbell-curl/female/thumbnail.webp'),
  },
  'bulgarian-split-squat': {
    female: require('../assets/exercises/bulgarian-split-squat/female/thumbnail.webp'),
  },
  'cable-biceps-curl': {
    male: require('../assets/exercises/cable-biceps-curl/thumbnail.webp'),
    female: require('../assets/exercises/cable-biceps-curl/female/thumbnail.webp'),
  },
  'cable-triceps-pushdown': {
    male: require('../assets/exercises/cable-triceps-pushdown/thumbnail.webp'),
    female: require('../assets/exercises/cable-triceps-pushdown/female/thumbnail.webp'),
  },
  'dumbbell-biceps-curl': {
    female: require('../assets/exercises/dumbbell-biceps-curl/female/thumbnail.webp'),
  },
  'dumbbell-overhead-triceps-extension': {
    male: require('../assets/exercises/dumbbell-overhead-triceps-extension/thumbnail.webp'),
    female: require('../assets/exercises/dumbbell-overhead-triceps-extension/female/thumbnail.webp'),
  },
  'ez-bar-curl': {
    male: require('../assets/exercises/ez-bar-curl/thumbnail.webp'),
    female: require('../assets/exercises/ez-bar-curl/female/thumbnail.webp'),
  },
  'hammer-curl': {
    male: require('../assets/exercises/hammer-curl/thumbnail.webp'),
    female: require('../assets/exercises/hammer-curl/female/thumbnail.webp'),
  },
  'kettlebell-goblet-squat': {
    female: require('../assets/exercises/kettlebell-goblet-squat/female/thumbnail.webp'),
  },
  'lying-barbell-triceps-extension': {
    female: require('../assets/exercises/lying-barbell-triceps-extension/female/thumbnail.webp'),
  },
  'overhead-cable-triceps-extension': {
    female: require('../assets/exercises/overhead-cable-triceps-extension/female/thumbnail.webp'),
  },
};

export function resolveNeutralExerciseThumbnail(
  imageKey: string,
  model: Character,
): ImageSourcePropType | undefined {
  return neutralThumbnails[imageKey]?.[model];
}

// Each crop is a square [left, top, side] in the original 1280px contain
// canvas (the 1280 × 853 sources are vertically centered in that canvas).
// One window encloses the combined foreground bounds of both phases.
const maleCropWindows: Readonly<
  Record<string, readonly [left: number, top: number, side: number]>
> = {
  'assisted-pull-up': [216, 213.5, 853],
  'barbell-bent-over-row': [139, 130, 1010],
  'barbell-deadlift': [209, 202, 862],
  'cable-straight-arm-pulldown': [73, 66, 1148],
  'dumbbell-shoulder-press': [212.5, 213.5, 853],
  'machine-high-row': [194, 213.5, 853],
};

const percent = (pixels: number, side: number): `${number}%` =>
  `${(pixels / side) * 100}%`;

export function resolveExerciseDisplayFrame(
  imageKey: string,
  model: Character,
): ImageStyle | undefined {
  const crop = model === 'male' ? maleCropWindows[imageKey] : undefined;
  if (!crop) return undefined;
  const [left, top, side] = crop;
  return {
    position: 'absolute',
    left: percent(-left, side),
    top: percent(-top, side),
    width: percent(1280, side),
    height: percent(1280, side),
  };
}
