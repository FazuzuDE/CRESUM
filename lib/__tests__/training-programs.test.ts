import { trainingPrograms } from '../training-programs/catalog';
import { selectProgram } from '../training-programs/selectors';
import { projectProgramReadiness } from '../training-programs/readiness';
import { exerciseLibrary } from '../exercise-library';

const rows = [
  ['build_muscle', 'beginner', 48, 3],
  ['build_muscle', 'some', 63, 3],
  ['build_muscle', 'experienced', 68, 4],
  ['get_stronger', 'beginner', 30, 3],
  ['get_stronger', 'some', 29, 3],
  ['get_stronger', 'experienced', 31, 3],
  ['general_fitness', 'beginner', 28, 2],
  ['general_fitness', 'some', 28, 2],
  ['general_fitness', 'experienced', 42, 2],
] as const;
it('has exactly the nine authored variants', () =>
  expect(trainingPrograms).toHaveLength(9));
it.each(rows)(
  'preserves %s/%s weekly prescriptions',
  (goal, experience, sets, days) => {
    const p = selectProgram(goal, experience);
    expect(p).toBeDefined();
    expect(p!.schedule[0]).toHaveLength(days);
    expect(
      p!.schedule[0].reduce(
        (n, slot) =>
          n +
          p!.days
            .find((d) => d.key === slot.dayKey)!
            .movements.reduce((a, m) => a + m.sets, 0),
        0,
      ),
    ).toBe(sets);
    expect(p!.environment).toBe('gym');
    expect(
      p!.days.flatMap((d) => d.movements).every((m) => m.sourceRefs.length > 0),
    ).toBe(true);
    expect(projectProgramReadiness(p!, exerciseLibrary).ready).toBe(true);
  },
);
it('alternates beginner strength for the second week', () => {
  const p = selectProgram('get_stronger', 'beginner')!;
  expect(p.schedule.map((w) => w.map((s) => s.dayKey))).toEqual([
    ['A', 'B', 'A'],
    ['B', 'A', 'B'],
  ]);
});
it('retains all prescriptions when any mapping is unavailable', () => {
  const p = selectProgram('build_muscle', 'some')!;
  const before = JSON.stringify(p);
  const status = projectProgramReadiness(
    p,
    exerciseLibrary.filter(
      (e) => e.id !== 'standing-cable-anti-rotation-press',
    ),
  );
  expect(status.ready).toBe(false);
  expect(status.blockers).toContain('standing-cable-anti-rotation-press');
  expect(JSON.stringify(p)).toBe(before);
});
it('keeps strength targets and cardio guidance separate from inferred weight', () => {
  const strength = selectProgram('get_stronger', 'experienced')!;
  expect(strength.days[0].movements[0]).toMatchObject({
    sets: 3,
    repMin: 3,
    repMax: 5,
  });
  const fitness = selectProgram('general_fitness', 'beginner')!;
  expect(fitness.cardio.map((g) => g.minutes).reduce((a, b) => a + b, 0)).toBe(
    150,
  );
  expect(
    fitness.days.flatMap((d) => d.movements).some((m) => 'weight' in m),
  ).toBe(false);
});

const prescription = (program: NonNullable<ReturnType<typeof selectProgram>>) =>
  program.days.map((day) => [
    day.key,
    day.movements.map(
      (m) =>
        `${m.exerciseId}:${m.sets}x${m.repMin}-${m.repMax}${m.perSide ? '/side' : ''}`,
    ),
  ]);
const fitnessFixtures = [
  ['beginner', 2, 12],
  ['some', 2, 15],
  ['experienced', 3, 15],
] as const;
it.each(fitnessFixtures)(
  'retains the full General fitness %s prescription including step-up ranges',
  (experience, sets, max) => {
    const expected = (id: string, core = false, side = false) =>
      `${id}:${sets}x${core ? 10 : 8}-${core ? 10 : max}${side ? '/side' : ''}`;
    expect(prescription(selectProgram('general_fitness', experience)!)).toEqual(
      [
        [
          'G',
          [
            'goblet-squat',
            'dumbbell-bench-press',
            'seated-cable-row',
            'dumbbell-romanian-deadlift',
            'dumbbell-shoulder-press',
            'standing-calf-raise',
          ]
            .map((id) => expected(id))
            .concat(expected('standing-cable-anti-rotation-press', true, true)),
        ],
        [
          'H',
          [
            expected('bodyweight-step-up', false, true),
            ...[
              'dumbbell-bench-press',
              'lat-pulldown',
              'dumbbell-floor-glute-bridge',
              'hammer-curl',
              'standing-calf-raise',
            ].map((id) => expected(id)),
            expected('standing-cable-anti-rotation-press', true, true),
          ],
        ],
      ],
    );
  },
);
it.each(['plank', 'farmers-carry'])(
  'blocks existing %s with incompatible measurement instead of inventing reps',
  (id) => {
    const program = JSON.parse(
      JSON.stringify(selectProgram('build_muscle', 'beginner')!),
    );
    program.days[0].movements[0].exerciseId = id;
    expect(projectProgramReadiness(program, exerciseLibrary)).toEqual({
      ready: false,
      blockers: [id],
    });
  },
);
it('blocks a movement whose catalog has no declared measurement contract', () => {
  const program = selectProgram('build_muscle', 'beginner')!;
  const library = exerciseLibrary.map((e) =>
    e.id === 'goblet-squat' ? { ...e, measurement: undefined } : e,
  );
  expect(projectProgramReadiness(program, library).ready).toBe(false);
});

const fixedPrescriptions = [
  [
    'build_muscle',
    'beginner',
    [
      [
        'F',
        [
          'goblet-squat:2x8-12',
          'dumbbell-bench-press:2x8-12',
          'dumbbell-romanian-deadlift:2x8-12',
          'seated-cable-row:2x8-12',
          'dumbbell-shoulder-press:2x8-12',
          'lat-pulldown:2x8-12',
          'standing-calf-raise:2x10-15',
          'standing-cable-anti-rotation-press:2x10-10/side',
        ],
      ],
    ],
  ],
  [
    'build_muscle',
    'some',
    [
      [
        'F',
        [
          'goblet-squat:3x8-12',
          'dumbbell-bench-press:3x8-12',
          'dumbbell-romanian-deadlift:3x8-12',
          'seated-cable-row:3x8-12',
          'dumbbell-shoulder-press:2x8-12',
          'lat-pulldown:3x8-12',
          'standing-calf-raise:2x10-15',
          'standing-cable-anti-rotation-press:2x10-10/side',
        ],
      ],
    ],
  ],
  [
    'build_muscle',
    'experienced',
    [
      [
        'U',
        [
          'dumbbell-bench-press:5x6-12',
          'seated-cable-row:3x8-12',
          'lat-pulldown:3x8-12',
          'dumbbell-shoulder-press:2x8-12',
          'dumbbell-lateral-raise:2x10-15',
          'hammer-curl:2x10-15',
          'lying-barbell-triceps-extension:2x10-15',
        ],
      ],
      [
        'L',
        [
          'barbell-back-squat:3x6-10',
          'goblet-squat:2x10-12',
          'dumbbell-romanian-deadlift:3x8-12',
          'seated-leg-curl:2x10-15',
          'standing-calf-raise:3x10-15',
          'standing-cable-anti-rotation-press:2x10-10/side',
        ],
      ],
    ],
  ],
  [
    'get_stronger',
    'beginner',
    [
      [
        'A',
        [
          'goblet-squat:2x8-10',
          'dumbbell-bench-press:2x8-10',
          'seated-cable-row:2x8-10',
          'dumbbell-romanian-deadlift:2x8-10',
          'standing-cable-anti-rotation-press:2x10-10/side',
        ],
      ],
      [
        'B',
        [
          'bodyweight-step-up:2x8-8/side',
          'dumbbell-shoulder-press:2x8-10',
          'lat-pulldown:2x8-10',
          'dumbbell-floor-glute-bridge:2x10-12',
          'standing-cable-anti-rotation-press:2x10-10/side',
        ],
      ],
    ],
  ],
  [
    'get_stronger',
    'some',
    [
      [
        'C',
        [
          'barbell-back-squat:3x5-6',
          'dumbbell-bench-press:3x5-6',
          'seated-cable-row:2x8-12',
          'standing-cable-anti-rotation-press:2x10-10/side',
        ],
      ],
      [
        'D',
        [
          'barbell-deadlift:2x4-6',
          'barbell-overhead-press:3x5-6',
          'lat-pulldown:3x6-8',
          'bodyweight-step-up:2x8-8/side',
        ],
      ],
      [
        'E',
        [
          'barbell-back-squat:2x6-8',
          'dumbbell-bench-press:3x6-8',
          'dumbbell-romanian-deadlift:2x8-10',
          'seated-cable-row:2x8-12',
        ],
      ],
    ],
  ],
  [
    'get_stronger',
    'experienced',
    [
      [
        'C',
        [
          'barbell-back-squat:3x3-5',
          'dumbbell-bench-press:3x4-6',
          'seated-cable-row:3x6-10',
          'standing-cable-anti-rotation-press:2x10-10/side',
        ],
      ],
      [
        'D',
        [
          'barbell-deadlift:2x3-5',
          'barbell-overhead-press:3x4-6',
          'lat-pulldown:3x6-8',
          'bodyweight-step-up:2x8-8/side',
        ],
      ],
      [
        'E',
        [
          'barbell-back-squat:3x5-6',
          'dumbbell-bench-press:3x6-8',
          'dumbbell-romanian-deadlift:2x6-8',
          'seated-cable-row:2x8-10',
        ],
      ],
    ],
  ],
] as const;
it.each(fixedPrescriptions)(
  'freezes complete %s / %s movement and repetition prescriptions',
  (goal, experience, expected) => {
    expect(prescription(selectProgram(goal, experience)!)).toEqual(expected);
  },
);
it.each([
  null,
  { offset: 7, minutes: 20, intensity: 'moderate' },
  { offset: 0, minutes: -1, intensity: 'moderate' },
  { offset: 0, minutes: 20, intensity: 'vigorous' },
])(
  'blocks malformed cardio before any assignment can become executable: %p',
  (entry) => {
    const program = JSON.parse(
      JSON.stringify(selectProgram('general_fitness', 'beginner')!),
    );
    program.cardio = [entry];
    expect(projectProgramReadiness(program, exerciseLibrary).ready).toBe(false);
  },
);
