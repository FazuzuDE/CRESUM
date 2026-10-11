import type { ProgramDay, ProgramDefinition, ProgramMovement } from './model';
import type { TrainingExperience, TrainingGoal } from '../onboarding';

const ids = {
  squat: 'goblet-squat',
  bench: 'dumbbell-bench-press',
  hinge: 'dumbbell-romanian-deadlift',
  row: 'seated-cable-row',
  shoulder: 'dumbbell-shoulder-press',
  lat: 'lat-pulldown',
  calf: 'standing-calf-raise',
  core: 'standing-cable-anti-rotation-press',
  backSquat: 'barbell-back-squat',
  lateral: 'dumbbell-lateral-raise',
  curl: 'hammer-curl',
  triceps: 'lying-barbell-triceps-extension',
  legCurl: 'seated-leg-curl',
  step: 'bodyweight-step-up',
  bridge: 'dumbbell-floor-glute-bridge',
  deadlift: 'barbell-deadlift',
  overhead: 'barbell-overhead-press',
};
const movement = (
  key: keyof typeof ids,
  sets: number,
  min: number,
  max: number,
  heavy = false,
): ProgramMovement => ({
  exerciseId: ids[key],
  sets,
  repMin: min,
  repMax: max,
  restMin: heavy
    ? 180
    : ['calf', 'lateral', 'curl', 'triceps', 'legCurl', 'core'].includes(key)
      ? 60
      : 120,
  restMax: heavy
    ? 240
    : ['calf', 'lateral', 'curl', 'triceps', 'legCurl', 'core'].includes(key)
      ? 120
      : 180,
  ...(['core', 'step'].includes(key) ? { perSide: true } : {}),
  sourceRefs: ['core', 'step', 'triceps', 'lateral', 'backSquat'].includes(key)
    ? ['S5']
    : ['bridge', 'deadlift', 'calf', 'legCurl'].includes(key)
      ? ['S7']
      : ['curl'].includes(key)
        ? ['S4', 'S5']
        : ['S2'],
  adaptation:
    key === 'step'
      ? 'Unloaded beginner variant of the published dumbbell Step-up.'
      : key === 'overhead'
        ? 'Warm-up movement adapted as a main strength exercise.'
        : 'CRESUM sets, repetition range and rest adaptation.',
});
const day = (
  key: string,
  name: string,
  movements: ProgramMovement[],
): ProgramDay => ({ key, name, movements });
const core = (sets = 2) => movement('core', sets, 10, 10);
const full = (experience: TrainingExperience) => {
  const n = experience === 'beginner' ? 2 : 3;
  return day('F', 'Full Body', [
    movement('squat', n, 8, 12),
    movement('bench', n, 8, 12),
    movement('hinge', n, 8, 12),
    movement('row', n, 8, 12),
    movement('shoulder', 2, 8, 12),
    movement('lat', n, 8, 12),
    movement('calf', 2, 10, 15),
    core(),
  ]);
};
const muscleDays = (experience: TrainingExperience): ProgramDay[] =>
  experience !== 'experienced'
    ? [full(experience)]
    : [
        day('U', 'Upper Body', [
          movement('bench', 5, 6, 12),
          movement('row', 3, 8, 12),
          movement('lat', 3, 8, 12),
          movement('shoulder', 2, 8, 12),
          movement('lateral', 2, 10, 15),
          movement('curl', 2, 10, 15),
          movement('triceps', 2, 10, 15),
        ]),
        day('L', 'Lower Body', [
          movement('backSquat', 3, 6, 10),
          movement('squat', 2, 10, 12),
          movement('hinge', 3, 8, 12),
          movement('legCurl', 2, 10, 15),
          movement('calf', 3, 10, 15),
          core(),
        ]),
      ];
const strengthDays = (experience: TrainingExperience): ProgramDay[] => {
  if (experience === 'beginner')
    return [
      day('A', 'Strength A', [
        movement('squat', 2, 8, 10),
        movement('bench', 2, 8, 10),
        movement('row', 2, 8, 10),
        movement('hinge', 2, 8, 10),
        core(),
      ]),
      day('B', 'Strength B', [
        movement('step', 2, 8, 8),
        movement('shoulder', 2, 8, 10),
        movement('lat', 2, 8, 10),
        movement('bridge', 2, 10, 12),
        core(),
      ]),
    ];
  const exp = experience === 'experienced';
  return [
    day('C', 'Strength C', [
      movement('backSquat', 3, exp ? 3 : 5, exp ? 5 : 6, true),
      movement('bench', 3, exp ? 4 : 5, 6, true),
      movement('row', exp ? 3 : 2, exp ? 6 : 8, exp ? 10 : 12),
      core(),
    ]),
    day('D', 'Strength D', [
      movement('deadlift', 2, exp ? 3 : 4, exp ? 5 : 6, true),
      movement('overhead', 3, exp ? 4 : 5, 6, true),
      movement('lat', 3, 6, 8),
      movement('step', 2, 8, 8),
    ]),
    day('E', 'Strength E', [
      movement('backSquat', exp ? 3 : 2, exp ? 5 : 6, exp ? 6 : 8, true),
      movement('bench', 3, 6, 8, true),
      movement('hinge', 2, exp ? 6 : 8, exp ? 8 : 10),
      movement('row', 2, 8, exp ? 10 : 12),
    ]),
  ];
};
const fitnessDays = (experience: TrainingExperience): ProgramDay[] => {
  const n = experience === 'experienced' ? 3 : 2,
    max = experience === 'beginner' ? 12 : 15;
  return [
    day('G', 'Fitness G', [
      movement('squat', n, 8, max),
      movement('bench', n, 8, max),
      movement('row', n, 8, max),
      movement('hinge', n, 8, max),
      movement('shoulder', n, 8, max),
      movement('calf', n, 8, max),
      core(n),
    ]),
    day('H', 'Fitness H', [
      movement('step', n, 8, max),
      movement('bench', n, 8, max),
      movement('lat', n, 8, max),
      movement('bridge', n, 8, max),
      movement('curl', n, 8, max),
      movement('calf', n, 8, max),
      core(n),
    ]),
  ];
};
const make = (
  goal: TrainingGoal,
  experience: TrainingExperience,
): ProgramDefinition => {
  const days =
    goal === 'build_muscle'
      ? muscleDays(experience)
      : goal === 'get_stronger'
        ? strengthDays(experience)
        : fitnessDays(experience);
  const sequences =
    goal === 'build_muscle'
      ? [experience === 'experienced' ? ['U', 'L', 'U', 'L'] : ['F', 'F', 'F']]
      : goal === 'get_stronger'
        ? experience === 'beginner'
          ? [
              ['A', 'B', 'A'],
              ['B', 'A', 'B'],
            ]
          : [['C', 'D', 'E']]
        : [['G', 'H']];
  const offsets =
    goal === 'general_fitness'
      ? [0, 3]
      : goal === 'build_muscle' && experience === 'experienced'
        ? [0, 1, 3, 4]
        : [0, 2, 4];
  return {
    id: `gym-${goal}-${experience}`,
    revision: 1,
    goal,
    experience,
    environment: 'gym',
    name:
      goal === 'build_muscle'
        ? 'Build muscle'
        : goal === 'get_stronger'
          ? 'Get stronger'
          : 'General fitness',
    days,
    schedule: sequences.map((seq) =>
      seq.map((dayKey, i) => ({ dayKey, offset: offsets[i] })),
    ),
    cardio:
      goal === 'general_fitness'
        ? [20, 30, 30, 20, 0, 50].flatMap((minutes, offset) =>
            minutes
              ? [{ offset, minutes, intensity: 'moderate' as const }]
              : [],
          )
        : [],
    ...(experience === 'beginner' && goal !== 'get_stronger'
      ? { firstSessionSetCap: 1 }
      : {}),
  };
};
export const trainingPrograms: readonly ProgramDefinition[] = (
  ['build_muscle', 'get_stronger', 'general_fitness'] as const
).flatMap((goal) =>
  (['beginner', 'some', 'experienced'] as const).map((experience) =>
    make(goal, experience),
  ),
);
