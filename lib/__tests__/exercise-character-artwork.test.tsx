import { Image, Text } from 'react-native';
import { ExerciseArtwork } from '../../components/ExerciseArtwork';
import { TechniqueArtwork } from '../../components/TechniqueArtwork';
import { TechniqueViewer } from '../../components/TechniqueViewer';
import { ExerciseCharacterProvider } from '../../components/ExerciseCharacterProvider';
import { resolveExerciseArtwork } from '../exercise-artwork';
import type { AssetModel } from '../exercise-variant-model';

const { act, create } = jest.requireActual('react-test-renderer');
jest.mock('../../assets/exercises/goblet-squat/start.webp', () => 101);
jest.mock('../../assets/exercises/goblet-squat/finish.webp', () => 102);
jest.mock('../../assets/exercises/goblet-squat/female/start.webp', () => 201, {
  virtual: true,
});
jest.mock('../../assets/exercises/goblet-squat/female/finish.webp', () => 202, {
  virtual: true,
});
jest.mock('../../assets/exercises/leg-press/start.webp', () => 301);
jest.mock('../../assets/exercises/leg-press/finish.webp', () => 302);
jest.mock('../../assets/exercises/leg-press/female/start.webp', () => 401);
jest.mock('../../assets/exercises/leg-press/female/finish.webp', () => 402);
jest.mock('../../assets/exercises/leg-extension/start.webp', () => 501);
jest.mock('../../assets/exercises/leg-extension/finish.webp', () => 502);
jest.mock('../../assets/exercises/leg-extension/female/start.webp', () => 601);
jest.mock('../../assets/exercises/leg-extension/female/finish.webp', () => 602);
jest.mock('../../assets/exercises/lying-leg-curl/start.webp', () => 701);
jest.mock('../../assets/exercises/lying-leg-curl/finish.webp', () => 702);
jest.mock('../../assets/exercises/lying-leg-curl/female/start.webp', () => 801);
jest.mock(
  '../../assets/exercises/lying-leg-curl/female/finish.webp',
  () => 802,
);
jest.mock('../../assets/exercises/seated-leg-curl/start.webp', () => 901);
jest.mock('../../assets/exercises/seated-leg-curl/finish.webp', () => 902);
jest.mock(
  '../../assets/exercises/seated-leg-curl/female/start.webp',
  () => 1001,
);
jest.mock(
  '../../assets/exercises/seated-leg-curl/female/finish.webp',
  () => 1002,
);
jest.mock(
  '../../assets/exercises/dumbbell-romanian-deadlift/start.webp',
  () => 1101,
);
jest.mock(
  '../../assets/exercises/dumbbell-romanian-deadlift/finish.webp',
  () => 1102,
);
jest.mock(
  '../../assets/exercises/dumbbell-romanian-deadlift/female/start.webp',
  () => 1201,
);
jest.mock(
  '../../assets/exercises/dumbbell-romanian-deadlift/female/finish.webp',
  () => 1202,
);
jest.mock(
  '../../assets/exercises/barbell-romanian-deadlift/start.webp',
  () => 1301,
);
jest.mock(
  '../../assets/exercises/barbell-romanian-deadlift/finish.webp',
  () => 1302,
);
jest.mock(
  '../../assets/exercises/barbell-romanian-deadlift/female/start.webp',
  () => 1401,
);
jest.mock(
  '../../assets/exercises/barbell-romanian-deadlift/female/finish.webp',
  () => 1402,
);
jest.mock('../../assets/exercises/barbell-hip-thrust/start.webp', () => 1501);
jest.mock('../../assets/exercises/barbell-hip-thrust/finish.webp', () => 1502);
jest.mock(
  '../../assets/exercises/barbell-hip-thrust/female/start.webp',
  () => 1601,
);
jest.mock(
  '../../assets/exercises/barbell-hip-thrust/female/finish.webp',
  () => 1602,
);
jest.mock('../../assets/exercises/cable-glute-kickback/start.webp', () => 1701);
jest.mock(
  '../../assets/exercises/cable-glute-kickback/finish.webp',
  () => 1702,
);
jest.mock(
  '../../assets/exercises/cable-glute-kickback/female/start.webp',
  () => 1801,
);
jest.mock(
  '../../assets/exercises/cable-glute-kickback/female/finish.webp',
  () => 1802,
);
jest.mock('../../assets/exercises/standing-calf-raise/start.webp', () => 1901);
jest.mock('../../assets/exercises/standing-calf-raise/finish.webp', () => 1902);
jest.mock(
  '../../assets/exercises/standing-calf-raise/female/start.webp',
  () => 2001,
);
jest.mock(
  '../../assets/exercises/standing-calf-raise/female/finish.webp',
  () => 2002,
);
jest.mock('../../assets/exercises/seated-calf-raise/start.webp', () => 2101);
jest.mock('../../assets/exercises/seated-calf-raise/finish.webp', () => 2102);
jest.mock(
  '../../assets/exercises/seated-calf-raise/female/start.webp',
  () => 2201,
);
jest.mock(
  '../../assets/exercises/seated-calf-raise/female/finish.webp',
  () => 2202,
);
jest.mock(
  '../../assets/exercises/machine-hip-adduction/start.webp',
  () => 2301,
);
jest.mock(
  '../../assets/exercises/machine-hip-adduction/finish.webp',
  () => 2302,
);
jest.mock(
  '../../assets/exercises/machine-hip-adduction/female/start.webp',
  () => 2401,
);
jest.mock(
  '../../assets/exercises/machine-hip-adduction/female/finish.webp',
  () => 2402,
);
jest.mock('../../assets/exercises/kettlebell-swing/start.webp', () => 2501);
jest.mock('../../assets/exercises/kettlebell-swing/finish.webp', () => 2502);
jest.mock(
  '../../assets/exercises/kettlebell-swing/female/start.webp',
  () => 2601,
);
jest.mock(
  '../../assets/exercises/kettlebell-swing/female/finish.webp',
  () => 2602,
);
jest.mock('../../assets/exercises/plank/start.webp', () => 2701);
jest.mock('../../assets/exercises/plank/finish.webp', () => 2702);
jest.mock('../../assets/exercises/plank/female/start.webp', () => 2801);
jest.mock('../../assets/exercises/plank/female/finish.webp', () => 2802);
jest.mock(
  '../../assets/exercises/captains-chair-knee-raise/start.webp',
  () => 2901,
);
jest.mock(
  '../../assets/exercises/captains-chair-knee-raise/finish.webp',
  () => 2902,
);
jest.mock(
  '../../assets/exercises/captains-chair-knee-raise/female/start.webp',
  () => 3001,
);
jest.mock(
  '../../assets/exercises/captains-chair-knee-raise/female/finish.webp',
  () => 3002,
);
jest.mock(
  '../../assets/exercises/hanging-straight-leg-raise/start.webp',
  () => 3101,
);
jest.mock(
  '../../assets/exercises/hanging-straight-leg-raise/finish.webp',
  () => 3102,
);
jest.mock(
  '../../assets/exercises/hanging-straight-leg-raise/female/start.webp',
  () => 3201,
);
jest.mock(
  '../../assets/exercises/hanging-straight-leg-raise/female/finish.webp',
  () => 3202,
);
jest.mock('../../assets/exercises/hanging-knee-raise/start.webp', () => 3301);
jest.mock('../../assets/exercises/hanging-knee-raise/finish.webp', () => 3302);
jest.mock(
  '../../assets/exercises/hanging-knee-raise/female/start.webp',
  () => 3401,
);
jest.mock(
  '../../assets/exercises/hanging-knee-raise/female/finish.webp',
  () => 3402,
);
jest.mock('../../assets/exercises/cable-crunch/start.webp', () => 3501);
jest.mock('../../assets/exercises/cable-crunch/finish.webp', () => 3502);
jest.mock('../../assets/exercises/cable-crunch/female/start.webp', () => 3601);
jest.mock('../../assets/exercises/cable-crunch/female/finish.webp', () => 3602);
jest.mock('../../assets/exercises/back-extension/start.webp', () => 3701);
jest.mock('../../assets/exercises/back-extension/finish.webp', () => 3702);
jest.mock(
  '../../assets/exercises/back-extension/female/start.webp',
  () => 3801,
);
jest.mock(
  '../../assets/exercises/back-extension/female/finish.webp',
  () => 3802,
);
jest.mock('../../assets/exercises/dumbbell-shrug/start.webp', () => 3901);
jest.mock('../../assets/exercises/dumbbell-shrug/finish.webp', () => 3902);
jest.mock(
  '../../assets/exercises/dumbbell-shrug/female/start.webp',
  () => 4001,
);
jest.mock(
  '../../assets/exercises/dumbbell-shrug/female/finish.webp',
  () => 4002,
);
jest.mock('../../assets/exercises/farmers-carry/start.webp', () => 4101);
jest.mock('../../assets/exercises/farmers-carry/finish.webp', () => 4102);
jest.mock('../../assets/exercises/farmers-carry/female/start.webp', () => 4201);
jest.mock(
  '../../assets/exercises/farmers-carry/female/finish.webp',
  () => 4202,
);
jest.mock(
  '../../assets/exercises/standing-cable-anti-rotation-press/start.webp',
  () => 4301,
);
jest.mock(
  '../../assets/exercises/standing-cable-anti-rotation-press/finish.webp',
  () => 4302,
);
jest.mock(
  '../../assets/exercises/standing-cable-anti-rotation-press/female/start.webp',
  () => 4401,
);
jest.mock(
  '../../assets/exercises/standing-cable-anti-rotation-press/female/finish.webp',
  () => 4402,
);
jest.mock('../../assets/exercises/bodyweight-step-up/start.webp', () => 4501);
jest.mock('../../assets/exercises/bodyweight-step-up/finish.webp', () => 4502);
jest.mock(
  '../../assets/exercises/bodyweight-step-up/female/start.webp',
  () => 4601,
);
jest.mock(
  '../../assets/exercises/bodyweight-step-up/female/finish.webp',
  () => 4602,
);
jest.mock(
  '../../assets/exercises/dumbbell-floor-glute-bridge/start.webp',
  () => 4701,
);
jest.mock(
  '../../assets/exercises/dumbbell-floor-glute-bridge/finish.webp',
  () => 4702,
);
jest.mock(
  '../../assets/exercises/dumbbell-floor-glute-bridge/female/start.webp',
  () => 4801,
);
jest.mock(
  '../../assets/exercises/dumbbell-floor-glute-bridge/female/finish.webp',
  () => 4802,
);
jest.mock(
  '../../assets/exercises/dumbbell-reverse-lunge/start.webp',
  () => 4901,
);
jest.mock(
  '../../assets/exercises/dumbbell-reverse-lunge/finish.webp',
  () => 4902,
);
jest.mock(
  '../../assets/exercises/dumbbell-reverse-lunge/female/start.webp',
  () => 5001,
);
jest.mock(
  '../../assets/exercises/dumbbell-reverse-lunge/female/finish.webp',
  () => 5002,
);
jest.mock(
  '../../assets/exercises/bulgarian-split-squat/start.webp',
  () => 5101,
);
jest.mock(
  '../../assets/exercises/bulgarian-split-squat/finish.webp',
  () => 5102,
);
jest.mock(
  '../../assets/exercises/bulgarian-split-squat/female/start.webp',
  () => 5201,
);
jest.mock(
  '../../assets/exercises/bulgarian-split-squat/female/finish.webp',
  () => 5202,
);
jest.mock('../../assets/exercises/smith-machine-squat/start.webp', () => 5301);
jest.mock('../../assets/exercises/smith-machine-squat/finish.webp', () => 5302);
jest.mock(
  '../../assets/exercises/smith-machine-squat/female/start.webp',
  () => 5401,
);
jest.mock(
  '../../assets/exercises/smith-machine-squat/female/finish.webp',
  () => 5402,
);
jest.mock('../../assets/exercises/barbell-back-squat/start.webp', () => 5501);
jest.mock('../../assets/exercises/barbell-back-squat/finish.webp', () => 5502);
jest.mock(
  '../../assets/exercises/barbell-back-squat/female/start.webp',
  () => 5601,
);
jest.mock(
  '../../assets/exercises/barbell-back-squat/female/finish.webp',
  () => 5602,
);
jest.mock('../../assets/exercises/barbell-front-squat/start.webp', () => 5701);
jest.mock('../../assets/exercises/barbell-front-squat/finish.webp', () => 5702);
jest.mock(
  '../../assets/exercises/barbell-front-squat/female/start.webp',
  () => 5801,
);
jest.mock(
  '../../assets/exercises/barbell-front-squat/female/finish.webp',
  () => 5802,
);
jest.mock('../../assets/exercises/barbell-deadlift/start.webp', () => 5901);
jest.mock('../../assets/exercises/barbell-deadlift/finish.webp', () => 5902);
jest.mock(
  '../../assets/exercises/barbell-deadlift/female/start.webp',
  () => 6001,
);
jest.mock(
  '../../assets/exercises/barbell-deadlift/female/finish.webp',
  () => 6002,
);
jest.mock(
  '../../assets/exercises/kettlebell-goblet-squat/start.webp',
  () => 6101,
);
jest.mock(
  '../../assets/exercises/kettlebell-goblet-squat/finish.webp',
  () => 6102,
);
jest.mock(
  '../../assets/exercises/kettlebell-goblet-squat/female/start.webp',
  () => 6201,
);
jest.mock(
  '../../assets/exercises/kettlebell-goblet-squat/female/finish.webp',
  () => 6202,
);
jest.mock('../../assets/exercises/dumbbell-biceps-curl/start.webp', () => 6301);
jest.mock(
  '../../assets/exercises/dumbbell-biceps-curl/finish.webp',
  () => 6302,
);
jest.mock(
  '../../assets/exercises/dumbbell-biceps-curl/female/start.webp',
  () => 6401,
);
jest.mock(
  '../../assets/exercises/dumbbell-biceps-curl/female/finish.webp',
  () => 6402,
);
jest.mock(
  '../../assets/exercises/cable-triceps-pushdown/start.webp',
  () => 7301,
);
jest.mock(
  '../../assets/exercises/cable-triceps-pushdown/finish.webp',
  () => 7302,
);
jest.mock(
  '../../assets/exercises/cable-triceps-pushdown/female/start.webp',
  () => 7401,
);
jest.mock(
  '../../assets/exercises/cable-triceps-pushdown/female/finish.webp',
  () => 7402,
);
jest.mock('../../assets/exercises/cable-biceps-curl/start.webp', () => 7101);
jest.mock('../../assets/exercises/cable-biceps-curl/finish.webp', () => 7102);
jest.mock(
  '../../assets/exercises/cable-biceps-curl/female/start.webp',
  () => 7201,
);
jest.mock(
  '../../assets/exercises/cable-biceps-curl/female/finish.webp',
  () => 7202,
);
jest.mock('../../assets/exercises/hammer-curl/start.webp', () => 6901);
jest.mock('../../assets/exercises/hammer-curl/finish.webp', () => 6902);
jest.mock('../../assets/exercises/hammer-curl/female/start.webp', () => 7001);
jest.mock('../../assets/exercises/hammer-curl/female/finish.webp', () => 7002);
jest.mock('../../assets/exercises/ez-bar-curl/start.webp', () => 6701);
jest.mock('../../assets/exercises/ez-bar-curl/finish.webp', () => 6702);
jest.mock('../../assets/exercises/ez-bar-curl/female/start.webp', () => 6801);
jest.mock('../../assets/exercises/ez-bar-curl/female/finish.webp', () => 6802);
jest.mock('../../assets/exercises/barbell-curl/start.webp', () => 6501);
jest.mock('../../assets/exercises/barbell-curl/finish.webp', () => 6502);
jest.mock('../../assets/exercises/barbell-curl/female/start.webp', () => 6601);
jest.mock('../../assets/exercises/barbell-curl/female/finish.webp', () => 6602);
jest.mock(
  '../../assets/exercises/overhead-cable-triceps-extension/start.webp',
  () => 7501,
);
jest.mock(
  '../../assets/exercises/overhead-cable-triceps-extension/finish.webp',
  () => 7502,
);
jest.mock(
  '../../assets/exercises/overhead-cable-triceps-extension/female/start.webp',
  () => 7601,
);
jest.mock(
  '../../assets/exercises/overhead-cable-triceps-extension/female/finish.webp',
  () => 7602,
);
jest.mock(
  '../../assets/exercises/dumbbell-overhead-triceps-extension/start.webp',
  () => 7701,
);
jest.mock(
  '../../assets/exercises/dumbbell-overhead-triceps-extension/finish.webp',
  () => 7702,
);
jest.mock(
  '../../assets/exercises/dumbbell-overhead-triceps-extension/female/start.webp',
  () => 7801,
);
jest.mock(
  '../../assets/exercises/dumbbell-overhead-triceps-extension/female/finish.webp',
  () => 7802,
);
jest.mock(
  '../../assets/exercises/lying-barbell-triceps-extension/start.webp',
  () => 7901,
);
jest.mock(
  '../../assets/exercises/lying-barbell-triceps-extension/finish.webp',
  () => 7902,
);
jest.mock(
  '../../assets/exercises/lying-barbell-triceps-extension/female/start.webp',
  () => 8001,
);
jest.mock(
  '../../assets/exercises/lying-barbell-triceps-extension/female/finish.webp',
  () => 8002,
);
jest.mock(
  '../../assets/exercises/close-grip-bench-press/start.webp',
  () => 8101,
);
jest.mock(
  '../../assets/exercises/close-grip-bench-press/finish.webp',
  () => 8102,
);
jest.mock(
  '../../assets/exercises/close-grip-bench-press/female/start.webp',
  () => 8201,
);
jest.mock(
  '../../assets/exercises/close-grip-bench-press/female/finish.webp',
  () => 8202,
);
jest.mock('../../assets/exercises/assisted-dip-machine/start.webp', () => 8301);
jest.mock(
  '../../assets/exercises/assisted-dip-machine/finish.webp',
  () => 8302,
);
jest.mock(
  '../../assets/exercises/assisted-dip-machine/female/start.webp',
  () => 8401,
);
jest.mock(
  '../../assets/exercises/assisted-dip-machine/female/finish.webp',
  () => 8402,
);
jest.mock('../../assets/exercises/barbell-bench-press/start.webp', () => 8501);
jest.mock('../../assets/exercises/barbell-bench-press/finish.webp', () => 8502);
jest.mock(
  '../../assets/exercises/barbell-bench-press/female/start.webp',
  () => 8601,
);
jest.mock(
  '../../assets/exercises/barbell-bench-press/female/finish.webp',
  () => 8602,
);
jest.mock('../../assets/exercises/dumbbell-bench-press/start.webp', () => 8701);
jest.mock(
  '../../assets/exercises/dumbbell-bench-press/finish.webp',
  () => 8702,
);
jest.mock(
  '../../assets/exercises/dumbbell-bench-press/female/start.webp',
  () => 8801,
);
jest.mock(
  '../../assets/exercises/dumbbell-bench-press/female/finish.webp',
  () => 8802,
);
jest.mock(
  '../../assets/exercises/incline-dumbbell-press/start.webp',
  () => 8901,
);
jest.mock(
  '../../assets/exercises/incline-dumbbell-press/finish.webp',
  () => 8902,
);
jest.mock(
  '../../assets/exercises/incline-dumbbell-press/female/start.webp',
  () => 9001,
);
jest.mock(
  '../../assets/exercises/incline-dumbbell-press/female/finish.webp',
  () => 9002,
);
jest.mock('../../assets/exercises/machine-chest-press/start.webp', () => 9101);
jest.mock('../../assets/exercises/machine-chest-press/finish.webp', () => 9102);
jest.mock(
  '../../assets/exercises/machine-chest-press/female/start.webp',
  () => 9201,
);
jest.mock(
  '../../assets/exercises/machine-chest-press/female/finish.webp',
  () => 9202,
);
jest.mock('../../assets/exercises/pec-deck-fly/start.webp', () => 9301);
jest.mock('../../assets/exercises/pec-deck-fly/finish.webp', () => 9302);
jest.mock('../../assets/exercises/pec-deck-fly/female/start.webp', () => 9401);
jest.mock('../../assets/exercises/pec-deck-fly/female/finish.webp', () => 9402);
jest.mock('../../assets/exercises/cable-chest-fly/start.webp', () => 9501);
jest.mock('../../assets/exercises/cable-chest-fly/finish.webp', () => 9502);
jest.mock(
  '../../assets/exercises/cable-chest-fly/female/start.webp',
  () => 9601,
);
jest.mock(
  '../../assets/exercises/cable-chest-fly/female/finish.webp',
  () => 9602,
);
jest.mock('../../assets/exercises/push-up/start.webp', () => 9701);
jest.mock('../../assets/exercises/push-up/finish.webp', () => 9702);
jest.mock('../../assets/exercises/push-up/female/start.webp', () => 9801);
jest.mock('../../assets/exercises/push-up/female/finish.webp', () => 9802);
jest.mock(
  '../../assets/exercises/dumbbell-shoulder-press/start.webp',
  () => 9901,
);
jest.mock(
  '../../assets/exercises/dumbbell-shoulder-press/finish.webp',
  () => 9902,
);
jest.mock(
  '../../assets/exercises/dumbbell-shoulder-press/female/start.webp',
  () => 10001,
);
jest.mock(
  '../../assets/exercises/dumbbell-shoulder-press/female/finish.webp',
  () => 10002,
);
jest.mock(
  '../../assets/exercises/barbell-overhead-press/start.webp',
  () => 10101,
);
jest.mock(
  '../../assets/exercises/barbell-overhead-press/finish.webp',
  () => 10102,
);
jest.mock(
  '../../assets/exercises/barbell-overhead-press/female/start.webp',
  () => 10201,
);
jest.mock(
  '../../assets/exercises/barbell-overhead-press/female/finish.webp',
  () => 10202,
);
jest.mock(
  '../../assets/exercises/machine-shoulder-press/start.webp',
  () => 10301,
);
jest.mock(
  '../../assets/exercises/machine-shoulder-press/finish.webp',
  () => 10302,
);
jest.mock(
  '../../assets/exercises/machine-shoulder-press/female/start.webp',
  () => 10401,
);
jest.mock(
  '../../assets/exercises/machine-shoulder-press/female/finish.webp',
  () => 10402,
);
jest.mock(
  '../../assets/exercises/dumbbell-lateral-raise/start.webp',
  () => 10501,
);
jest.mock(
  '../../assets/exercises/dumbbell-lateral-raise/finish.webp',
  () => 10502,
);
jest.mock(
  '../../assets/exercises/dumbbell-lateral-raise/female/start.webp',
  () => 10601,
);
jest.mock(
  '../../assets/exercises/dumbbell-lateral-raise/female/finish.webp',
  () => 10602,
);
jest.mock('../../assets/exercises/cable-lateral-raise/start.webp', () => 10701);
jest.mock(
  '../../assets/exercises/cable-lateral-raise/finish.webp',
  () => 10702,
);
jest.mock(
  '../../assets/exercises/cable-lateral-raise/female/start.webp',
  () => 10801,
);
jest.mock(
  '../../assets/exercises/cable-lateral-raise/female/finish.webp',
  () => 10802,
);
jest.mock('../../assets/exercises/reverse-pec-deck/start.webp', () => 10901);
jest.mock('../../assets/exercises/reverse-pec-deck/finish.webp', () => 10902);
jest.mock(
  '../../assets/exercises/reverse-pec-deck/female/start.webp',
  () => 11001,
);
jest.mock(
  '../../assets/exercises/reverse-pec-deck/female/finish.webp',
  () => 11002,
);
jest.mock(
  '../../assets/exercises/barbell-bent-over-row/start.webp',
  () => 11101,
);
jest.mock(
  '../../assets/exercises/barbell-bent-over-row/finish.webp',
  () => 11102,
);
jest.mock(
  '../../assets/exercises/barbell-bent-over-row/female/start.webp',
  () => 11201,
);
jest.mock(
  '../../assets/exercises/barbell-bent-over-row/female/finish.webp',
  () => 11202,
);
jest.mock(
  '../../assets/exercises/one-arm-dumbbell-row/start.webp',
  () => 11301,
);
jest.mock(
  '../../assets/exercises/one-arm-dumbbell-row/finish.webp',
  () => 11302,
);
jest.mock(
  '../../assets/exercises/one-arm-dumbbell-row/female/start.webp',
  () => 11401,
);
jest.mock(
  '../../assets/exercises/one-arm-dumbbell-row/female/finish.webp',
  () => 11402,
);
jest.mock(
  '../../assets/exercises/chest-supported-dumbbell-row/start.webp',
  () => 11501,
);
jest.mock(
  '../../assets/exercises/chest-supported-dumbbell-row/finish.webp',
  () => 11502,
);
jest.mock(
  '../../assets/exercises/chest-supported-dumbbell-row/female/start.webp',
  () => 11601,
);
jest.mock(
  '../../assets/exercises/chest-supported-dumbbell-row/female/finish.webp',
  () => 11602,
);
jest.mock('../../assets/exercises/machine-high-row/start.webp', () => 11701);
jest.mock('../../assets/exercises/machine-high-row/finish.webp', () => 11702);
jest.mock(
  '../../assets/exercises/machine-high-row/female/start.webp',
  () => 11801,
);
jest.mock(
  '../../assets/exercises/machine-high-row/female/finish.webp',
  () => 11802,
);
jest.mock(
  '../../assets/exercises/seated-cable-row-close-neutral-v-handle/start.webp',
  () => 11901,
);
jest.mock(
  '../../assets/exercises/seated-cable-row-close-neutral-v-handle/finish.webp',
  () => 11902,
);
jest.mock(
  '../../assets/exercises/seated-cable-row-close-neutral-v-handle/female/start.webp',
  () => 12001,
);
jest.mock(
  '../../assets/exercises/seated-cable-row-close-neutral-v-handle/female/finish.webp',
  () => 12002,
);
jest.mock(
  '../../assets/exercises/lat-pulldown-wide-pronated-bar/start.webp',
  () => 12101,
);
jest.mock(
  '../../assets/exercises/lat-pulldown-wide-pronated-bar/finish.webp',
  () => 12102,
);
jest.mock(
  '../../assets/exercises/lat-pulldown-wide-pronated-bar/female/start.webp',
  () => 12201,
);
jest.mock(
  '../../assets/exercises/lat-pulldown-wide-pronated-bar/female/finish.webp',
  () => 12202,
);
jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.requireActual('react-native').View,
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual('react-native').View,
}));

it('resolves female phases only for the approved exact variants', () => {
  expect(resolveExerciseArtwork('goblet-squat', 'start', 'female')).toBe(201);
  expect(resolveExerciseArtwork('goblet-squat', 'finish', 'female')).toBe(202);
  expect(resolveExerciseArtwork('leg-press', 'start', 'female')).toBe(401);
  expect(resolveExerciseArtwork('leg-press', 'finish', 'female')).toBe(402);
  expect(resolveExerciseArtwork('leg-press', 'start', 'male')).toBe(301);
  expect(resolveExerciseArtwork('leg-press', 'finish', 'male')).toBe(302);
  expect(resolveExerciseArtwork('leg-extension', 'start', 'female')).toBe(601);
  expect(resolveExerciseArtwork('leg-extension', 'finish', 'female')).toBe(602);
  expect(resolveExerciseArtwork('leg-extension', 'start', 'male')).toBe(501);
  expect(resolveExerciseArtwork('leg-extension', 'finish', 'male')).toBe(502);
  expect(resolveExerciseArtwork('lying-leg-curl', 'start', 'female')).toBe(801);
  expect(resolveExerciseArtwork('lying-leg-curl', 'finish', 'female')).toBe(
    802,
  );
  expect(resolveExerciseArtwork('lying-leg-curl', 'start', 'male')).toBe(701);
  expect(resolveExerciseArtwork('lying-leg-curl', 'finish', 'male')).toBe(702);
  expect(resolveExerciseArtwork('seated-leg-curl', 'start', 'female')).toBe(
    1001,
  );
  expect(resolveExerciseArtwork('seated-leg-curl', 'finish', 'female')).toBe(
    1002,
  );
  expect(resolveExerciseArtwork('seated-leg-curl', 'start', 'male')).toBe(901);
  expect(resolveExerciseArtwork('seated-leg-curl', 'finish', 'male')).toBe(902);
  expect(
    resolveExerciseArtwork('dumbbell-romanian-deadlift', 'start', 'female'),
  ).toBe(1201);
  expect(
    resolveExerciseArtwork('dumbbell-romanian-deadlift', 'finish', 'female'),
  ).toBe(1202);
  expect(
    resolveExerciseArtwork('dumbbell-romanian-deadlift', 'start', 'male'),
  ).toBe(1101);
  expect(
    resolveExerciseArtwork('dumbbell-romanian-deadlift', 'finish', 'male'),
  ).toBe(1102);
  expect(
    resolveExerciseArtwork('barbell-romanian-deadlift', 'start', 'female'),
  ).toBe(1401);
  expect(
    resolveExerciseArtwork('barbell-romanian-deadlift', 'finish', 'female'),
  ).toBe(1402);
  expect(
    resolveExerciseArtwork('barbell-romanian-deadlift', 'start', 'male'),
  ).toBe(1301);
  expect(
    resolveExerciseArtwork('barbell-romanian-deadlift', 'finish', 'male'),
  ).toBe(1302);
  expect(resolveExerciseArtwork('barbell-hip-thrust', 'start', 'female')).toBe(
    1601,
  );
  expect(resolveExerciseArtwork('barbell-hip-thrust', 'finish', 'female')).toBe(
    1602,
  );
  expect(resolveExerciseArtwork('barbell-hip-thrust', 'start', 'male')).toBe(
    1501,
  );
  expect(resolveExerciseArtwork('barbell-hip-thrust', 'finish', 'male')).toBe(
    1502,
  );
  expect(
    resolveExerciseArtwork('cable-glute-kickback', 'start', 'female'),
  ).toBe(1801);
  expect(
    resolveExerciseArtwork('cable-glute-kickback', 'finish', 'female'),
  ).toBe(1802);
  expect(resolveExerciseArtwork('standing-calf-raise', 'start', 'female')).toBe(
    2001,
  );
  expect(
    resolveExerciseArtwork('standing-calf-raise', 'finish', 'female'),
  ).toBe(2002);
  expect(resolveExerciseArtwork('seated-calf-raise', 'start', 'female')).toBe(
    2201,
  );
  expect(resolveExerciseArtwork('seated-calf-raise', 'finish', 'female')).toBe(
    2202,
  );
  expect(
    resolveExerciseArtwork('machine-hip-adduction', 'start', 'female'),
  ).toBe(2401);
  expect(
    resolveExerciseArtwork('machine-hip-adduction', 'finish', 'female'),
  ).toBe(2402);
  expect(resolveExerciseArtwork('kettlebell-swing', 'start', 'female')).toBe(
    2601,
  );
  expect(resolveExerciseArtwork('kettlebell-swing', 'finish', 'female')).toBe(
    2602,
  );
  expect(resolveExerciseArtwork('plank', 'start', 'female')).toBe(2801);
  expect(resolveExerciseArtwork('plank', 'finish', 'female')).toBe(2802);
  expect(
    resolveExerciseArtwork('captains-chair-knee-raise', 'start', 'female'),
  ).toBe(3001);
  expect(
    resolveExerciseArtwork('captains-chair-knee-raise', 'finish', 'female'),
  ).toBe(3002);
  expect(
    resolveExerciseArtwork('hanging-straight-leg-raise', 'start', 'female'),
  ).toBe(3201);
  expect(
    resolveExerciseArtwork('hanging-straight-leg-raise', 'finish', 'female'),
  ).toBe(3202);
  expect(resolveExerciseArtwork('hanging-knee-raise', 'start', 'female')).toBe(
    3401,
  );
  expect(resolveExerciseArtwork('hanging-knee-raise', 'finish', 'female')).toBe(
    3402,
  );
  expect(resolveExerciseArtwork('cable-crunch', 'start', 'female')).toBe(3601);
  expect(resolveExerciseArtwork('cable-crunch', 'finish', 'female')).toBe(3602);
  for (const id of ['preacher-curl', 'unknown'])
    for (const phase of ['start', 'finish'] as const)
      expect(resolveExerciseArtwork(id, phase, 'female')).toBeNull();
  expect(resolveExerciseArtwork('goblet-squat', 'start', 'male')).toBe(101);
});

it.each([
  [
    'lat-pulldown-wide-pronated-bar',
    [12101, 12102, 12101],
    [12201, 12202, 12201],
  ],
  [
    'seated-cable-row-close-neutral-v-handle',
    [11901, 11902, 11901],
    [12001, 12002, 12001],
  ],
  ['machine-high-row', [11701, 11702, 11701], [11801, 11802, 11801]],
  [
    'chest-supported-dumbbell-row',
    [11501, 11502, 11501],
    [11601, 11602, 11601],
  ],
  ['one-arm-dumbbell-row', [11301, 11302, 11301], [11401, 11402, 11401]],
  ['barbell-bent-over-row', [11101, 11102, 11101], [11201, 11202, 11201]],
  ['reverse-pec-deck', [10901, 10902, 10901], [11001, 11002, 11001]],
  ['cable-lateral-raise', [10701, 10702, 10701], [10801, 10802, 10801]],
  ['dumbbell-lateral-raise', [10501, 10502, 10501], [10601, 10602, 10601]],
  ['machine-shoulder-press', [10301, 10302, 10301], [10401, 10402, 10401]],
  ['barbell-overhead-press', [10101, 10102, 10101], [10201, 10202, 10201]],
  ['dumbbell-shoulder-press', [9901, 9902, 9901], [10001, 10002, 10001]],
  ['push-up', [9701, 9702, 9701], [9801, 9802, 9801]],
  ['cable-chest-fly', [9501, 9502, 9501], [9601, 9602, 9601]],
  ['pec-deck-fly', [9301, 9302, 9301], [9401, 9402, 9401]],
  ['machine-chest-press', [9101, 9102, 9101], [9201, 9202, 9201]],
  ['incline-dumbbell-press', [8901, 8902, 8901], [9001, 9002, 9001]],
  ['dumbbell-bench-press', [8701, 8702, 8701], [8801, 8802, 8801]],
  ['barbell-bench-press', [8501, 8502, 8501], [8601, 8602, 8601]],
  ['assisted-dip-machine', [8301, 8302, 8301], [8401, 8402, 8401]],
  ['close-grip-bench-press', [8101, 8102, 8101], [8201, 8202, 8201]],
  ['lying-barbell-triceps-extension', [7901, 7902, 7901], [8001, 8002, 8001]],
  [
    'dumbbell-overhead-triceps-extension',
    [7701, 7702, 7701],
    [7801, 7802, 7801],
  ],
  ['goblet-squat', [101, 102, 101], [201, 202, 201]],
  ['leg-press', [301, 302, 301], [401, 402, 401]],
  ['leg-extension', [501, 502, 501], [601, 602, 601]],
  ['lying-leg-curl', [701, 702, 701], [801, 802, 801]],
  ['seated-leg-curl', [901, 902, 901], [1001, 1002, 1001]],
  ['dumbbell-romanian-deadlift', [1101, 1102, 1101], [1201, 1202, 1201]],
  ['barbell-romanian-deadlift', [1301, 1302, 1301], [1401, 1402, 1401]],
  ['barbell-hip-thrust', [1501, 1502, 1501], [1601, 1602, 1601]],
  ['cable-glute-kickback', [1701, 1702, 1701], [1801, 1802, 1801]],
  ['standing-calf-raise', [1901, 1902, 1901], [2001, 2002, 2001]],
  ['seated-calf-raise', [2101, 2102, 2101], [2201, 2202, 2201]],
  ['machine-hip-adduction', [2301, 2302, 2301], [2401, 2402, 2401]],
  ['kettlebell-swing', [2501, 2502, 2501], [2601, 2602, 2601]],
  ['plank', [2701, 2702, 2701], [2801, 2802, 2801]],
  ['captains-chair-knee-raise', [2901, 2902, 2901], [3001, 3002, 3001]],
  ['hanging-straight-leg-raise', [3101, 3102, 3101], [3201, 3202, 3201]],
  ['hanging-knee-raise', [3301, 3302, 3301], [3401, 3402, 3401]],
  ['cable-crunch', [3501, 3502, 3501], [3601, 3602, 3601]],
  ['back-extension', [3701, 3702, 3701], [3801, 3802, 3801]],
  ['dumbbell-shrug', [3901, 3902, 3901], [4001, 4002, 4001]],
  ['farmers-carry', [4101, 4102, 4101], [4201, 4202, 4201]],
  ['bodyweight-step-up', [4501, 4502, 4501], [4601, 4602, 4601]],
  ['overhead-cable-triceps-extension', [7501, 7502, 7501], [7601, 7602, 7601]],
  ['cable-triceps-pushdown', [7301, 7302, 7301], [7401, 7402, 7401]],
  ['cable-biceps-curl', [7101, 7102, 7101], [7201, 7202, 7201]],
  ['hammer-curl', [6901, 6902, 6901], [7001, 7002, 7001]],
  ['ez-bar-curl', [6701, 6702, 6701], [6801, 6802, 6801]],
  ['barbell-curl', [6501, 6502, 6501], [6601, 6602, 6601]],
  ['dumbbell-biceps-curl', [6301, 6302, 6301], [6401, 6402, 6401]],
  ['kettlebell-goblet-squat', [6101, 6102, 6101], [6201, 6202, 6201]],
  ['barbell-deadlift', [5901, 5902, 5901], [6001, 6002, 6001]],
  ['barbell-front-squat', [5701, 5702, 5701], [5801, 5802, 5801]],
  ['barbell-back-squat', [5501, 5502, 5501], [5601, 5602, 5601]],
  ['smith-machine-squat', [5301, 5302, 5301], [5401, 5402, 5401]],
  ['bulgarian-split-squat', [5101, 5102, 5101], [5201, 5202, 5201]],
  ['dumbbell-reverse-lunge', [4901, 4902, 4901], [5001, 5002, 5001]],
  ['dumbbell-floor-glute-bridge', [4701, 4702, 4701], [4801, 4802, 4801]],
  [
    'standing-cable-anti-rotation-press',
    [4301, 4302, 4301],
    [4401, 4402, 4401],
  ],
] as const)(
  'switches %s thumbnail, inline and fullscreen phases from the shared choice',
  async (imageKey, maleSources, femaleSources) => {
    const render = (model: AssetModel) => (
      <ExerciseCharacterProvider
        value={{ model, saving: false, error: false, disabled: false }}
      >
        <ExerciseArtwork imageKey={imageKey} />
        <TechniqueArtwork imageKey={imageKey} phase="FINISH" />
        <TechniqueViewer
          name={imageKey}
          imageKey={imageKey}
          phase="START"
          onPhase={() => {}}
          onClose={() => {}}
        />
      </ExerciseCharacterProvider>
    );
    let view!: ReturnType<typeof create>;
    await act(async () => {
      view = create(render('male'));
    });
    const sources = () =>
      view.root.findAllByType(Image).map((node: any) => node.props.source);
    expect(sources()).toEqual(maleSources);
    await act(async () => view.update(render('female')));
    expect(sources()).toEqual(femaleSources);
    await act(async () => view.update(render('male')));
    expect(sources()).toEqual(maleSources);
    await act(async () => view.unmount());
  },
);

it('shows a female pending placeholder instead of a male image', async () => {
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(
      <ExerciseCharacterProvider
        value={{
          model: 'female',
          saving: false,
          error: false,
          disabled: false,
        }}
      >
        <ExerciseArtwork imageKey="preacher-curl" />
        <TechniqueArtwork imageKey="preacher-curl" phase="START" />
      </ExerciseCharacterProvider>,
    );
  });
  expect(view.root.findAllByType(Image)).toHaveLength(0);
  expect(
    view.root
      .findAllByType(Text)
      .some((node: any) => node.props.children === 'Preparing'),
  ).toBe(true);
  expect(
    view.root
      .findAllByType(Text)
      .some(
        (node: any) =>
          node.props.children === 'Female illustration is being prepared',
      ),
  ).toBe(true);
  await act(async () => view.unmount());
});
