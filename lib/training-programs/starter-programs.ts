import type { TrainingExperience, TrainingGoal } from '../onboarding';
import type {
  ProgramDefinition,
  ProgramMovement,
  ProgramHold,
  CardioGuidance,
} from './model';

type Work = readonly [
  exerciseId: string,
  sets: number,
  min: number,
  max: number,
  restMin: number,
  restMax: number,
];
type Hold = readonly [
  'plank',
  sets: number,
  minSeconds: number,
  maxSeconds: number,
];
type Cardio = readonly [
  NonNullable<CardioGuidance['activity']>,
  minutes: number,
];
type Entry = Work | Hold | Cardio;
const plans = {
  universal: {
    name: 'Universal',
    days: [
      [
        ['barbell-bench-press', 3, 6, 10, 120, 180],
        ['incline-dumbbell-press', 3, 8, 12, 120, 180],
        ['pec-deck-fly', 2, 10, 15, 90, 120],
        ['seated-cable-row-close-neutral-v-handle', 3, 8, 12, 120, 180],
        ['lat-pulldown-close-neutral-v-handle', 2, 8, 12, 120, 180],
        ['seated-leg-curl', 2, 10, 15, 90, 120],
      ],
      [
        ['barbell-back-squat', 3, 6, 10, 120, 180],
        ['dumbbell-romanian-deadlift', 3, 8, 12, 120, 180],
        ['leg-press', 3, 10, 12, 120, 180],
        ['leg-extension', 2, 10, 15, 90, 120],
        ['seated-calf-raise', 3, 12, 16, 90, 120],
        ['cable-crunch', 3, 10, 15, 90, 120],
      ],
      [
        ['machine-chest-press', 3, 8, 12, 120, 180],
        ['pec-deck-fly', 2, 10, 15, 90, 120],
        ['chest-supported-dumbbell-row', 3, 8, 12, 120, 180],
        ['dumbbell-biceps-curl', 3, 10, 15, 90, 120],
        ['cable-triceps-pushdown', 3, 10, 15, 90, 120],
        ['dumbbell-lateral-raise', 2, 12, 16, 90, 120],
      ],
    ],
  },
  build_muscle: {
    name: 'Build muscle',
    days: [
      [
        ['leg-press', 3, 8, 12, 120, 180],
        ['machine-chest-press', 3, 8, 12, 120, 180],
        ['seated-cable-row-close-neutral-v-handle', 3, 8, 12, 120, 180],
        ['dumbbell-romanian-deadlift', 3, 8, 12, 120, 180],
        ['dumbbell-lateral-raise', 2, 12, 16, 90, 120],
        ['cable-crunch', 2, 10, 15, 90, 120],
      ],
      [
        ['goblet-squat', 3, 8, 12, 120, 180],
        ['incline-dumbbell-press', 3, 8, 12, 120, 180],
        ['lat-pulldown-close-neutral-v-handle', 3, 8, 12, 120, 180],
        ['seated-leg-curl', 3, 10, 15, 90, 120],
        ['seated-calf-raise', 3, 12, 16, 90, 120],
        ['dumbbell-biceps-curl', 2, 10, 15, 90, 120],
      ],
      [
        ['dumbbell-bench-press', 3, 8, 12, 120, 180],
        ['chest-supported-dumbbell-row', 3, 8, 12, 120, 180],
        ['dumbbell-romanian-deadlift', 3, 8, 12, 120, 180],
        ['leg-extension', 3, 10, 15, 90, 120],
        ['dumbbell-lateral-raise', 2, 12, 16, 90, 120],
        ['cable-triceps-pushdown', 2, 10, 15, 90, 120],
      ],
    ],
  },
  get_stronger: {
    name: 'Get stronger',
    days: [
      [
        ['barbell-back-squat', 3, 4, 6, 180, 240],
        ['barbell-bench-press', 3, 4, 6, 180, 240],
        ['seated-cable-row-close-neutral-v-handle', 3, 6, 10, 90, 150],
        ['seated-leg-curl', 3, 8, 12, 90, 150],
        ['seated-calf-raise', 3, 10, 15, 90, 150],
        ['cable-crunch', 2, 10, 15, 90, 150],
      ],
      [
        ['barbell-romanian-deadlift', 3, 5, 8, 180, 240],
        ['barbell-overhead-press', 3, 5, 8, 180, 240],
        ['lat-pulldown-close-neutral-v-handle', 3, 6, 10, 90, 150],
        ['leg-press', 3, 8, 12, 90, 150],
        ['dumbbell-biceps-curl', 2, 8, 12, 90, 150],
        ['plank', 3, 20, 40],
      ],
      [
        ['barbell-bench-press', 3, 6, 8, 90, 150],
        ['barbell-back-squat', 3, 6, 8, 90, 150],
        ['chest-supported-dumbbell-row', 3, 8, 12, 90, 150],
        ['seated-leg-curl', 3, 8, 12, 90, 150],
        ['cable-triceps-pushdown', 3, 10, 15, 90, 150],
        ['cable-crunch', 2, 10, 15, 90, 150],
      ],
    ],
  },
  lose_weight: {
    name: 'Lose weight',
    days: [
      [
        ['leg-press', 3, 10, 12, 90, 150],
        ['machine-chest-press', 3, 8, 12, 90, 150],
        ['seated-cable-row-close-neutral-v-handle', 3, 8, 12, 90, 150],
        ['seated-leg-curl', 3, 10, 15, 90, 150],
        ['cable-crunch', 2, 10, 15, 90, 150],
        ['treadmill_walking', 25],
      ],
      [
        ['goblet-squat', 3, 8, 12, 90, 150],
        ['incline-dumbbell-press', 3, 8, 12, 90, 150],
        ['lat-pulldown-close-neutral-v-handle', 3, 8, 12, 90, 150],
        ['dumbbell-romanian-deadlift', 3, 8, 12, 90, 150],
        ['plank', 2, 20, 40],
        ['stationary_bike', 30],
      ],
      [
        ['leg-press', 3, 10, 12, 90, 150],
        ['machine-shoulder-press', 3, 8, 12, 90, 150],
        ['chest-supported-dumbbell-row', 3, 8, 12, 90, 150],
        ['dumbbell-floor-glute-bridge', 3, 10, 15, 90, 150],
        ['cable-crunch', 2, 10, 15, 90, 150],
        ['treadmill_walking', 30],
      ],
    ],
  },
  general_fitness: {
    name: 'General fitness',
    days: [
      [
        ['leg-press', 3, 10, 12, 90, 150],
        ['machine-chest-press', 3, 8, 12, 90, 150],
        ['seated-cable-row-close-neutral-v-handle', 3, 8, 12, 90, 150],
        ['seated-leg-curl', 2, 10, 15, 90, 150],
        ['plank', 2, 20, 40],
        ['treadmill_walking', 25],
      ],
      [
        ['goblet-squat', 3, 8, 12, 90, 150],
        ['incline-dumbbell-press', 3, 8, 12, 90, 150],
        ['lat-pulldown-close-neutral-v-handle', 3, 8, 12, 90, 150],
        ['dumbbell-romanian-deadlift', 2, 8, 12, 90, 150],
        ['cable-crunch', 2, 10, 15, 90, 150],
        ['stationary_bike', 25],
      ],
      [
        ['leg-press', 3, 10, 12, 90, 150],
        ['machine-shoulder-press', 3, 8, 12, 90, 150],
        ['chest-supported-dumbbell-row', 3, 8, 12, 90, 150],
        ['dumbbell-floor-glute-bridge', 2, 10, 15, 90, 150],
        ['plank', 2, 20, 40],
        ['treadmill_walking', 25],
      ],
    ],
  },
} satisfies Record<
  TrainingGoal,
  { name: string; days: readonly (readonly Entry[])[] }
>;

export const starterProgramGoals = Object.keys(plans) as TrainingGoal[];

export function starterProgram(
  goal: TrainingGoal,
  experience: TrainingExperience,
): ProgramDefinition {
  const plan = plans[goal];
  const schedule = plan.days.map((_, index) => ({
    offset: index * 2,
    dayKey: goal === 'universal' ? `universal-${index + 1}` : String(index + 1),
  }));
  const cardio: CardioGuidance[] = [];
  const days = plan.days.map((entries, index) => {
    const movements: ProgramMovement[] = [];
    let hold: ProgramHold | undefined;
    for (const entry of entries) {
      if (entry.length === 2) {
        cardio.push({
          offset: schedule[index].offset,
          activity: entry[0],
          minutes: entry[1],
          intensity: 'moderate',
        });
      } else if (entry.length === 4) {
        hold = {
          exerciseId: entry[0],
          sets: entry[1],
          minSeconds: entry[2],
          maxSeconds: entry[3],
        };
      } else {
        const [exerciseId, sets, repMin, repMax, restMin, restMax] = entry;
        movements.push({
          exerciseId,
          sets,
          repMin,
          repMax,
          restMin,
          restMax,
          sourceRefs: ['S1'],
        });
      }
    }
    return {
      key: schedule[index].dayKey,
      name:
        goal === 'universal'
          ? ['Chest', 'Legs', 'Chest and arms'][index]
          : `Workout ${index + 1}`,
      movements,
      ...(hold ? { hold } : {}),
    };
  });
  return {
    id: `starter-${goal.replaceAll('_', '-')}`,
    revision: 2,
    goal,
    experience,
    environment: 'gym',
    name: plan.name,
    days,
    schedule: [schedule],
    cardio,
    ...(experience === 'beginner' ? { firstSessionSetCap: 2 } : {}),
  };
}
