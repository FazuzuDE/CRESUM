import {
  resolveExerciseArtwork,
  resolveAttachmentArtwork,
} from '../exercise-artwork';
import { findExercise } from '../exercise-library';
import { getCatalogVariant } from '../exercise-catalog-adapter';
import { findTechnique } from '../exercise-technique';
jest.mock(
  '../../assets/exercises/dumbbell-reverse-lunge/start.webp',
  () => 4501,
);
jest.mock(
  '../../assets/exercises/dumbbell-reverse-lunge/finish.webp',
  () => 4502,
);
jest.mock('../../assets/exercises/goblet-squat/start.webp', () => 4401);
jest.mock('../../assets/exercises/goblet-squat/finish.webp', () => 4402);
jest.mock(
  '../../assets/exercises/kettlebell-goblet-squat/start.webp',
  () => 4301,
);
jest.mock(
  '../../assets/exercises/kettlebell-goblet-squat/finish.webp',
  () => 4302,
);
jest.mock('../../assets/exercises/smith-machine-squat/start.webp', () => 4201);
jest.mock('../../assets/exercises/smith-machine-squat/finish.webp', () => 4202);
jest.mock('../../assets/exercises/leg-press/start.webp', () => 4101);
jest.mock('../../assets/exercises/leg-press/finish.webp', () => 4102);
jest.mock('../../assets/exercises/barbell-front-squat/start.webp', () => 4001);
jest.mock('../../assets/exercises/barbell-front-squat/finish.webp', () => 4002);
jest.mock('../../assets/exercises/barbell-back-squat/start.webp', () => 3901);
jest.mock('../../assets/exercises/barbell-back-squat/finish.webp', () => 3902);
jest.mock('../../assets/exercises/push-up/start.webp', () => 3801);
jest.mock('../../assets/exercises/push-up/finish.webp', () => 3802);
jest.mock('../../assets/exercises/assisted-dip-machine/start.webp', () => 3101);
jest.mock(
  '../../assets/exercises/assisted-dip-machine/finish.webp',
  () => 3102,
);
jest.mock(
  '../../assets/exercises/lying-barbell-triceps-extension/start.webp',
  () => 3001,
);
jest.mock(
  '../../assets/exercises/lying-barbell-triceps-extension/finish.webp',
  () => 3002,
);
jest.mock(
  '../../assets/exercises/close-grip-bench-press/start.webp',
  () => 2901,
);
jest.mock(
  '../../assets/exercises/close-grip-bench-press/finish.webp',
  () => 2902,
);
jest.mock(
  '../../assets/exercises/dumbbell-overhead-triceps-extension/start.webp',
  () => 2801,
);
jest.mock(
  '../../assets/exercises/dumbbell-overhead-triceps-extension/finish.webp',
  () => 2802,
);
jest.mock(
  '../../assets/exercises/overhead-cable-triceps-extension/start.webp',
  () => 2701,
);
jest.mock(
  '../../assets/exercises/overhead-cable-triceps-extension/finish.webp',
  () => 2702,
);
jest.mock(
  '../../assets/exercises/cable-triceps-pushdown/start.webp',
  () => 2601,
);
jest.mock(
  '../../assets/exercises/cable-triceps-pushdown/finish.webp',
  () => 2602,
);
jest.mock('../../assets/exercises/cable-biceps-curl/start.webp', () => 2501);
jest.mock('../../assets/exercises/cable-biceps-curl/finish.webp', () => 2502);
jest.mock('../../assets/exercises/hammer-curl/start.webp', () => 2401);
jest.mock('../../assets/exercises/hammer-curl/finish.webp', () => 2402);
jest.mock('../../assets/exercises/ez-bar-curl/start.webp', () => 2301);
jest.mock('../../assets/exercises/ez-bar-curl/finish.webp', () => 2302);
jest.mock('../../assets/exercises/barbell-curl/start.webp', () => 2201);
jest.mock('../../assets/exercises/barbell-curl/finish.webp', () => 2202);
jest.mock('../../assets/exercises/dumbbell-biceps-curl/start.webp', () => 2101);
jest.mock(
  '../../assets/exercises/dumbbell-biceps-curl/finish.webp',
  () => 2102,
);
jest.mock(
  '../../assets/exercises/resistance-band-pull-apart/start.webp',
  () => 2001,
);
jest.mock(
  '../../assets/exercises/resistance-band-pull-apart/finish.webp',
  () => 2002,
);
jest.mock('../../assets/exercises/reverse-pec-deck/start.webp', () => 1901);
jest.mock('../../assets/exercises/reverse-pec-deck/finish.webp', () => 1902);
jest.mock('../../assets/exercises/cable-lateral-raise/start.webp', () => 1801);
jest.mock('../../assets/exercises/cable-lateral-raise/finish.webp', () => 1802);
jest.mock(
  '../../assets/exercises/dumbbell-lateral-raise/start.webp',
  () => 1701,
);
jest.mock(
  '../../assets/exercises/dumbbell-lateral-raise/finish.webp',
  () => 1702,
);
jest.mock(
  '../../assets/exercises/machine-shoulder-press/start.webp',
  () => 1601,
);
jest.mock(
  '../../assets/exercises/machine-shoulder-press/finish.webp',
  () => 1602,
);
jest.mock(
  '../../assets/exercises/barbell-overhead-press/start.webp',
  () => 1501,
);
jest.mock(
  '../../assets/exercises/barbell-overhead-press/finish.webp',
  () => 1502,
);
jest.mock(
  '../../assets/exercises/dumbbell-shoulder-press/start.webp',
  () => 1401,
);
jest.mock(
  '../../assets/exercises/dumbbell-shoulder-press/finish.webp',
  () => 1402,
);
jest.mock('../../assets/exercises/barbell-deadlift/start.webp', () => 1301);
jest.mock('../../assets/exercises/barbell-deadlift/finish.webp', () => 1302);
jest.mock(
  '../../assets/exercises/cable-straight-arm-pulldown/start.webp',
  () => 1201,
);
jest.mock(
  '../../assets/exercises/cable-straight-arm-pulldown/finish.webp',
  () => 1202,
);
jest.mock('../../assets/exercises/machine-high-row/start.webp', () => 1101);
jest.mock('../../assets/exercises/machine-high-row/finish.webp', () => 1102);
jest.mock('../../assets/exercises/assisted-pull-up/start.webp', () => 1001);
jest.mock('../../assets/exercises/assisted-pull-up/finish.webp', () => 1002);
jest.mock('../../assets/exercises/pull-up/start.webp', () => 901);
jest.mock('../../assets/exercises/pull-up/finish.webp', () => 902);
jest.mock('../../assets/exercises/barbell-bent-over-row/start.webp', () => 801);
jest.mock(
  '../../assets/exercises/barbell-bent-over-row/finish.webp',
  () => 802,
);

// Distinct native asset IDs make wrong-phase and wrong-attachment bindings observable.
jest.mock(
  '../../assets/exercises/lat-pulldown-close-neutral-ergonomic-handle/start.webp',
  () => 101,
);
jest.mock(
  '../../assets/exercises/lat-pulldown-close-neutral-ergonomic-handle/finish.webp',
  () => 102,
);
jest.mock(
  '../../assets/exercises/lat-pulldown-close-neutral-ergonomic-handle/attachment.webp',
  () => 103,
);
jest.mock(
  '../../assets/exercises/lat-pulldown-close-neutral-v-handle/start.webp',
  () => 201,
);
jest.mock(
  '../../assets/exercises/lat-pulldown-close-neutral-v-handle/finish.webp',
  () => 202,
);
jest.mock(
  '../../assets/exercises/lat-pulldown-close-neutral-v-handle/attachment.webp',
  () => 203,
);
jest.mock(
  '../../assets/exercises/lat-pulldown-wide-pronated-bar/start.webp',
  () => 301,
);
jest.mock(
  '../../assets/exercises/lat-pulldown-wide-pronated-bar/finish.webp',
  () => 302,
);
jest.mock(
  '../../assets/exercises/lat-pulldown-wide-pronated-bar/attachment.webp',
  () => 303,
);

jest.mock(
  '../../assets/exercises/lat-pulldown-reverse-grip/start.webp',
  () => 401,
);
jest.mock(
  '../../assets/exercises/lat-pulldown-reverse-grip/finish.webp',
  () => 402,
);
jest.mock(
  '../../assets/exercises/seated-cable-row-close-neutral-v-handle/start.webp',
  () => 501,
);
jest.mock(
  '../../assets/exercises/seated-cable-row-close-neutral-v-handle/finish.webp',
  () => 502,
);

jest.mock('../../assets/exercises/one-arm-dumbbell-row/start.webp', () => 601);
jest.mock('../../assets/exercises/one-arm-dumbbell-row/finish.webp', () => 602);
jest.mock(
  '../../assets/exercises/chest-supported-dumbbell-row/start.webp',
  () => 701,
);
jest.mock(
  '../../assets/exercises/chest-supported-dumbbell-row/finish.webp',
  () => 702,
);

const ergonomic = 'lat-pulldown-close-neutral-ergonomic-handle';

it('binds the selected row pair only to its exact close neutral configuration', () => {
  const id = 'seated-cable-row-close-neutral-v-handle';
  expect(findExercise(id)).toMatchObject({
    id,
    primaryMuscles: ['upper-back', 'lats'],
    secondaryMuscles: ['biceps', 'rear-delts'],
    movementPattern: 'horizontal-pull',
  });
  expect(getCatalogVariant(id)).toMatchObject({
    familyId: 'seated-cable-row',
    configuration: 'specific',
    attachmentType: { kind: 'attachment', id: 'v-handle' },
    grip: { kind: 'grip', id: 'neutral' },
    gripWidth: 'close',
  });
  expect(findTechnique(id)?.scope).toMatch(/neutral/i);
  expect(resolveExerciseArtwork(id, 'start', 'male')).toBe(501);
  expect(resolveExerciseArtwork(id, 'finish', 'male')).toBe(502);
  expect(resolveAttachmentArtwork(id)).toBe(203);
  for (const phase of ['start', 'finish'] as const) {
    expect(resolveExerciseArtwork(id, phase, 'female')).toBeNull();
    for (const generic of ['row', 'seated-cable-row']) {
      expect(resolveExerciseArtwork(generic, phase, 'male')).toBeNull();
      expect(resolveAttachmentArtwork(generic)).toBeNull();
    }
  }
});

it('keeps the ergonomic setup distinct from V-handle and unspecified history', () => {
  expect(findExercise(ergonomic)?.id).toBe(ergonomic);
  expect(getCatalogVariant(ergonomic)).toMatchObject({
    familyId: 'lat-pulldown',
    attachmentType: { kind: 'attachment', id: 'ergonomic-handle' },
    grip: { kind: 'grip', id: 'neutral' },
    gripWidth: 'close',
  });
  expect(getCatalogVariant('pulldown')?.configuration).toBe('unspecified');
  expect(
    getCatalogVariant('lat-pulldown-close-neutral-v-handle')?.attachmentType
      ?.id,
  ).toBe('v-handle');
  expect(findTechnique(ergonomic)?.setup.join(' ')).toMatch(/rounded|palm/i);
});

it('resolves each exact phase without borrowing another setup or model', () => {
  // Removing the exact-ID boundary would incorrectly give other grips this pair.
  expect(resolveExerciseArtwork(ergonomic, 'start', 'male')).toBe(101);
  expect(resolveExerciseArtwork(ergonomic, 'finish', 'male')).toBe(102);
  expect(resolveAttachmentArtwork(ergonomic)).toBe(103);
  expect(resolveAttachmentArtwork('lat-pulldown-wide-pronated-bar')).toBe(303);
  expect(
    resolveExerciseArtwork('lat-pulldown-wide-pronated-bar', 'start', 'male'),
  ).toBe(301);
  expect(
    resolveExerciseArtwork('lat-pulldown-wide-pronated-bar', 'finish', 'male'),
  ).toBe(302);
  expect(resolveAttachmentArtwork('lat-pulldown-close-neutral-v-handle')).toBe(
    203,
  );
  expect(
    resolveExerciseArtwork(
      'lat-pulldown-close-neutral-v-handle',
      'start',
      'male',
    ),
  ).toBe(201);
  expect(
    resolveExerciseArtwork(
      'lat-pulldown-close-neutral-v-handle',
      'finish',
      'male',
    ),
  ).toBe(202);
  for (const id of ['pulldown', 'lat-pulldown', 'unknown']) {
    expect(resolveExerciseArtwork(id, 'start', 'male')).toBeNull();
    expect(resolveAttachmentArtwork(id)).toBeNull();
  }
  expect(resolveExerciseArtwork(ergonomic, 'start', 'female')).toBeNull();
  for (const phase of ['start', 'finish'] as const) {
    expect(
      resolveExerciseArtwork('lat-pulldown-wide-pronated-bar', phase, 'female'),
    ).toBeNull();
    expect(
      resolveExerciseArtwork(
        'lat-pulldown-close-neutral-v-handle',
        phase,
        'female',
      ),
    ).toBeNull();
    expect(
      resolveExerciseArtwork('lat-pulldown-reverse-grip', phase, 'male'),
    ).toBe(phase === 'start' ? 401 : 402);
    expect(
      resolveExerciseArtwork('lat-pulldown-reverse-grip', phase, 'female'),
    ).toBeNull();
  }
});

it('binds the bench-supported one-arm pair without changing identity or borrowing other rows', () => {
  const id = 'one-arm-dumbbell-row';
  expect(findExercise(id)).toMatchObject({
    id,
    primaryMuscles: ['lats', 'upper-back'],
    secondaryMuscles: ['biceps', 'rear-delts'],
    equipment: ['dumbbell', 'bench'],
    movementPattern: 'horizontal-pull',
  });
  expect(findTechnique(id)?.scope).toBe('Bench-supported single-arm row.');
  expect(resolveExerciseArtwork(id, 'start', 'male')).toBe(601);
  expect(resolveExerciseArtwork(id, 'finish', 'male')).toBe(602);
  expect(resolveAttachmentArtwork(id)).toBeNull();
  for (const phase of ['start', 'finish'] as const) {
    expect(resolveExerciseArtwork(id, phase, 'female')).toBeNull();
    for (const other of ['row', 'seated-cable-row', 'unknown']) {
      expect(resolveExerciseArtwork(other, phase, 'male')).toBeNull();
    }
  }
});

it('binds both chest-supported phases only to the existing two-arm incline-bench row', () => {
  const id = 'chest-supported-dumbbell-row';
  expect(findExercise(id)).toMatchObject({
    id,
    primaryMuscles: ['upper-back', 'lats'],
    secondaryMuscles: ['biceps', 'rear-delts'],
    equipment: ['dumbbell', 'bench'],
    movementPattern: 'horizontal-pull',
  });
  expect(findTechnique(id)?.scope).toBe('Two-arm incline-bench row.');
  expect(resolveExerciseArtwork(id, 'start', 'male')).toBe(701);
  expect(resolveExerciseArtwork(id, 'finish', 'male')).toBe(702);
  expect(resolveAttachmentArtwork(id)).toBeNull();
  for (const phase of ['start', 'finish'] as const) {
    expect(resolveExerciseArtwork(id, phase, 'female')).toBeNull();
    for (const other of ['row', 'seated-cable-row', 'unknown']) {
      expect(resolveExerciseArtwork(other, phase, 'male')).toBeNull();
    }
  }
});

it('shows selected barbell row phases without redefining its unspecified grip or other rows', () => {
  const id = 'barbell-bent-over-row';
  expect(findTechnique(id)?.scope).toBe(
    'Two-arm barbell row; grip remains unspecified.',
  );
  expect(findExercise(id)?.equipment).toEqual(['barbell']);
  expect(resolveExerciseArtwork(id, 'start', 'male')).toBe(801);
  expect(resolveExerciseArtwork(id, 'finish', 'male')).toBe(802);
  expect(resolveAttachmentArtwork(id)).toBeNull();
  for (const phase of ['start', 'finish'] as const) {
    expect(resolveExerciseArtwork(id, phase, 'female')).toBeNull();
    for (const other of ['row', 'seated-cable-row', 'unknown']) {
      expect(resolveExerciseArtwork(other, phase, 'male')).toBeNull();
    }
  }
});

it('binds the selected overhand bodyweight pull-up without borrowing its pair for assisted pull-ups', () => {
  expect(findTechnique('pull-up')?.scope).toBe(
    'Bodyweight pull-up; overhand grip.',
  );
  expect(findExercise('pull-up')).toMatchObject({
    equipment: ['bodyweight'],
    primaryMuscles: ['lats'],
    secondaryMuscles: ['biceps', 'upper-back', 'forearms'],
  });
  expect(resolveExerciseArtwork('pull-up', 'start', 'male')).toBe(901);
  expect(resolveExerciseArtwork('pull-up', 'finish', 'male')).toBe(902);
  expect(resolveAttachmentArtwork('pull-up')).toBeNull();
  for (const phase of ['start', 'finish'] as const) {
    expect(resolveExerciseArtwork('pull-up', phase, 'female')).toBeNull();
    for (const id of ['lat-pulldown', 'pulldown', 'unknown']) {
      expect(resolveExerciseArtwork(id, phase, 'male')).toBeNull();
    }
  }
});

it('keeps selected assisted pull-up phases distinct from the free bodyweight pair', () => {
  const id = 'assisted-pull-up';
  expect(findTechnique(id)?.scope).toBe(
    'Counterweighted pull-up; machine support differs.',
  );
  expect(findExercise(id)).toMatchObject({
    equipment: ['machine'],
    primaryMuscles: ['lats'],
    secondaryMuscles: ['biceps', 'upper-back'],
  });
  expect(resolveExerciseArtwork(id, 'start', 'male')).toBe(1001);
  expect(resolveExerciseArtwork(id, 'finish', 'male')).toBe(1002);
  expect(resolveAttachmentArtwork(id)).toBeNull();
  for (const phase of ['start', 'finish'] as const) {
    expect(resolveExerciseArtwork(id, phase, 'female')).toBeNull();
    expect(resolveExerciseArtwork('pull-up', phase, 'male')).not.toBe(
      resolveExerciseArtwork(id, phase, 'male'),
    );
    for (const other of ['lat-pulldown', 'pulldown', 'unknown'])
      expect(resolveExerciseArtwork(other, phase, 'male')).toBeNull();
  }
});

it('binds the selected high-row pair without narrowing the generic exercise scope', () => {
  const id = 'machine-high-row';
  expect(findTechnique(id)?.scope).toBe(
    'Seated high-row machine; handle path varies.',
  );
  expect(findExercise(id)).toMatchObject({
    equipment: ['machine'],
    movementPattern: 'horizontal-pull',
    primaryMuscles: ['upper-back', 'lats'],
    secondaryMuscles: ['rear-delts', 'biceps'],
  });
  expect(resolveExerciseArtwork(id, 'start', 'male')).toBe(1101);
  expect(resolveExerciseArtwork(id, 'finish', 'male')).toBe(1102);
  expect(resolveAttachmentArtwork(id)).toBeNull();
  for (const phase of ['start', 'finish'] as const) {
    expect(resolveExerciseArtwork(id, phase, 'female')).toBeNull();
    for (const other of [
      'lat-pulldown',
      'seated-cable-row',
      'bulgarian-split-squat',
      'unknown',
    ])
      expect(resolveExerciseArtwork(other, phase, 'male')).toBeNull();
    expect(resolveExerciseArtwork('assisted-pull-up', phase, 'male')).not.toBe(
      resolveExerciseArtwork(id, phase, 'male'),
    );
  }
});

it('binds selected straight-arm phases only to the existing Male exercise', () => {
  const id = 'cable-straight-arm-pulldown';
  expect(findTechnique(id)?.scope).toBe(
    'Standing shoulder-extension pulldown.',
  );
  expect(findExercise(id)).toMatchObject({
    equipment: ['cable'],
    movementPattern: 'isolation',
    primaryMuscles: ['lats'],
    secondaryMuscles: ['triceps'],
  });
  expect(resolveExerciseArtwork(id, 'start', 'male')).toBe(1201);
  expect(resolveExerciseArtwork(id, 'finish', 'male')).toBe(1202);
  expect(resolveAttachmentArtwork(id)).toBeNull();
  for (const phase of ['start', 'finish'] as const) {
    expect(resolveExerciseArtwork(id, phase, 'female')).toBeNull();
    for (const other of [
      'lat-pulldown',
      'seated-cable-row',
      'triceps-pushdown',
      'unknown',
    ])
      expect(resolveExerciseArtwork(other, phase, 'male')).toBeNull();
    expect(resolveExerciseArtwork('machine-high-row', phase, 'male')).not.toBe(
      resolveExerciseArtwork(id, phase, 'male'),
    );
  }
});

it('binds selected deadlift phases without narrowing conventional identity or borrowing other hinges', () => {
  const id = 'barbell-deadlift';
  expect(findExercise(id)).toMatchObject({
    id,
    equipment: ['barbell'],
    movementPattern: 'hinge',
    primaryMuscles: ['glutes', 'hamstrings', 'lower-back'],
    secondaryMuscles: ['traps', 'forearms', 'quadriceps'],
  });
  expect(findExercise('deadlift')?.id).toBe(id);
  expect(findTechnique(id)?.scope).toBe('Conventional barbell deadlift.');
  expect(resolveExerciseArtwork(id, 'start', 'male')).toBe(1301);
  expect(resolveExerciseArtwork(id, 'finish', 'male')).toBe(1302);
  expect(resolveAttachmentArtwork(id)).toBeNull();
  for (const phase of ['start', 'finish'] as const) {
    expect(resolveExerciseArtwork(id, phase, 'female')).toBeNull();
    for (const other of [
      'deadlift',
      'romanian-deadlift',
      'barbell-romanian-deadlift',
      'unknown',
    ])
      expect(resolveExerciseArtwork(other, phase, 'male')).toBeNull();
    expect(
      resolveExerciseArtwork('barbell-bent-over-row', phase, 'male'),
    ).not.toBe(resolveExerciseArtwork(id, phase, 'male'));
  }
});

it('binds selected shoulder press phases without narrowing standing or seated scope', () => {
  const id = 'dumbbell-shoulder-press';
  expect(findExercise(id)).toMatchObject({
    id,
    equipment: ['dumbbell'],
    movementPattern: 'vertical-push',
    primaryMuscles: ['front-delts', 'side-delts'],
    secondaryMuscles: ['triceps'],
  });
  expect(findExercise('press')?.id).toBe(id);
  expect(findTechnique(id)?.scope).toBe('Dumbbell overhead press.');
  expect(findTechnique(id)?.setup.join(' ')).toMatch(/Stand.*sit/);
  expect(resolveExerciseArtwork(id, 'start', 'male')).toBe(1401);
  expect(resolveExerciseArtwork(id, 'finish', 'male')).toBe(1402);
  expect(resolveAttachmentArtwork(id)).toBeNull();
  for (const phase of ['start', 'finish'] as const) {
    expect(resolveExerciseArtwork(id, phase, 'female')).toBeNull();
    for (const other of ['press', 'unknown'])
      expect(resolveExerciseArtwork(other, phase, 'male')).toBeNull();
  }
});

it('binds selected strict barbell press without borrowing other presses', () => {
  const id = 'barbell-overhead-press';
  expect(findExercise(id)).toMatchObject({
    id,
    equipment: ['barbell'],
    movementPattern: 'vertical-push',
    primaryMuscles: ['front-delts', 'side-delts'],
    secondaryMuscles: ['triceps', 'abs'],
  });
  expect(findTechnique(id)?.scope).toBe(
    'Standing strict barbell overhead press.',
  );
  expect(resolveExerciseArtwork(id, 'start', 'male')).toBe(1501);
  expect(resolveExerciseArtwork(id, 'finish', 'male')).toBe(1502);
  expect(resolveAttachmentArtwork(id)).toBeNull();
  for (const phase of ['start', 'finish'] as const) {
    expect(resolveExerciseArtwork(id, phase, 'female')).toBeNull();
    for (const other of ['press', 'unknown'])
      expect(resolveExerciseArtwork(other, phase, 'male')).toBeNull();
    expect(
      resolveExerciseArtwork('dumbbell-shoulder-press', phase, 'male'),
    ).not.toBe(resolveExerciseArtwork(id, phase, 'male'));
  }
});

it('binds selected machine press without narrowing generic grip or borrowing free-weight presses', () => {
  const id = 'machine-shoulder-press';
  expect(findExercise(id)).toMatchObject({
    id,
    equipment: ['machine'],
    movementPattern: 'vertical-push',
    primaryMuscles: ['front-delts', 'side-delts'],
    secondaryMuscles: ['triceps'],
  });
  expect(findTechnique(id)?.scope).toBe(
    'Supported overhead machine press; grip unspecified.',
  );
  expect(resolveExerciseArtwork(id, 'start', 'male')).toBe(1601);
  expect(resolveExerciseArtwork(id, 'finish', 'male')).toBe(1602);
  expect(resolveAttachmentArtwork(id)).toBeNull();
  for (const phase of ['start', 'finish'] as const) {
    expect(resolveExerciseArtwork(id, phase, 'female')).toBeNull();
    for (const other of ['press', 'bulgarian-split-squat', 'unknown'])
      expect(resolveExerciseArtwork(other, phase, 'male')).toBeNull();
    for (const other of ['dumbbell-shoulder-press', 'barbell-overhead-press'])
      expect(resolveExerciseArtwork(other, phase, 'male')).not.toBe(
        resolveExerciseArtwork(id, phase, 'male'),
      );
  }
});

it('binds only the selected straight-bar Male curl and preserves its roles', () => {
  expect(resolveExerciseArtwork('barbell-curl', 'start', 'male')).toBe(2201);
  expect(resolveExerciseArtwork('barbell-curl', 'finish', 'male')).toBe(2202);
  expect(findExercise('barbell-curl')).toMatchObject({
    primaryMuscles: ['biceps'],
    secondaryMuscles: ['forearms'],
    equipment: ['barbell'],
  });
  expect(findTechnique('barbell-curl')?.scope).toBe(
    'Straight-bar standing curl.',
  );
  for (const phase of ['start', 'finish'] as const) {
    expect(resolveExerciseArtwork('barbell-curl', phase, 'female')).toBeNull();
    for (const id of ['preacher-curl', 'bodyweight-dip', 'unknown'])
      expect(resolveExerciseArtwork(id, phase, 'male')).toBeNull();
  }
  expect(resolveAttachmentArtwork('barbell-curl')).toBeNull();
});

it('binds selected Male EZ curl only and preserves angled grip guide and roles', () => {
  expect(resolveExerciseArtwork('ez-bar-curl', 'start', 'male')).toBe(2301);
  expect(resolveExerciseArtwork('ez-bar-curl', 'finish', 'male')).toBe(2302);
  expect(findExercise('ez-bar-curl')).toMatchObject({
    primaryMuscles: ['biceps'],
    secondaryMuscles: ['forearms'],
    equipment: ['ez-bar'],
  });
  expect(findTechnique('ez-bar-curl')?.scope).toBe(
    'Standing angled EZ-bar curl.',
  );
  for (const phase of ['start', 'finish'] as const) {
    expect(resolveExerciseArtwork('ez-bar-curl', phase, 'female')).toBeNull();
    expect(resolveExerciseArtwork('barbell-curl', phase, 'male')).toBe(
      phase === 'start' ? 2201 : 2202,
    );
    for (const id of ['preacher-curl', 'bodyweight-dip', 'unknown'])
      expect(resolveExerciseArtwork(id, phase, 'male')).toBeNull();
  }
  expect(resolveAttachmentArtwork('ez-bar-curl')).toBeNull();
});

it('keeps selected Male hammer curl separate from supinated and EZ curls', () => {
  expect(resolveExerciseArtwork('hammer-curl', 'start', 'male')).toBe(2401);
  expect(resolveExerciseArtwork('hammer-curl', 'finish', 'male')).toBe(2402);
  expect(findExercise('hammer-curl')).toMatchObject({
    primaryMuscles: ['biceps', 'forearms'],
    secondaryMuscles: [],
    equipment: ['dumbbell'],
  });
  expect(findTechnique('hammer-curl')?.scope).toBe(
    'Neutral-grip dumbbell curl.',
  );
  for (const phase of ['start', 'finish'] as const) {
    expect(resolveExerciseArtwork('hammer-curl', phase, 'female')).toBeNull();
    expect(resolveExerciseArtwork('barbell-curl', phase, 'male')).toBe(
      phase === 'start' ? 2201 : 2202,
    );
    expect(resolveExerciseArtwork('ez-bar-curl', phase, 'male')).toBe(
      phase === 'start' ? 2301 : 2302,
    );
    expect(resolveExerciseArtwork('dumbbell-biceps-curl', phase, 'male')).toBe(
      phase === 'start' ? 2101 : 2102,
    );
    for (const id of ['preacher-curl', 'bodyweight-dip', 'unknown'])
      expect(resolveExerciseArtwork(id, phase, 'male')).toBeNull();
  }
  expect(resolveAttachmentArtwork('hammer-curl')).toBeNull();
});

it('binds selected Male low cable curl without narrowing guide or borrowing other curls', () => {
  expect(resolveExerciseArtwork('cable-biceps-curl', 'start', 'male')).toBe(
    2501,
  );
  expect(resolveExerciseArtwork('cable-biceps-curl', 'finish', 'male')).toBe(
    2502,
  );
  expect(findExercise('cable-biceps-curl')).toMatchObject({
    primaryMuscles: ['biceps'],
    secondaryMuscles: ['forearms'],
    equipment: ['cable'],
  });
  expect(findTechnique('cable-biceps-curl')?.scope).toBe(
    'Standing low-cable curl; attachment unspecified.',
  );
  for (const phase of ['start', 'finish'] as const) {
    expect(
      resolveExerciseArtwork('cable-biceps-curl', phase, 'female'),
    ).toBeNull();
    for (const [id, start, finish] of [
      ['barbell-curl', 2201, 2202],
      ['ez-bar-curl', 2301, 2302],
      ['hammer-curl', 2401, 2402],
      ['dumbbell-biceps-curl', 2101, 2102],
    ] as const)
      expect(resolveExerciseArtwork(id, phase, 'male')).toBe(
        phase === 'start' ? start : finish,
      );
    for (const id of ['bodyweight-dip', 'preacher-curl', 'unknown'])
      expect(resolveExerciseArtwork(id, phase, 'male')).toBeNull();
  }
  expect(resolveAttachmentArtwork('cable-biceps-curl')).toBeNull();
});

it('binds Male high cable pushdown without narrowing generic attachment or borrowing curls', () => {
  expect(
    resolveExerciseArtwork('cable-triceps-pushdown', 'start', 'male'),
  ).toBe(2601);
  expect(
    resolveExerciseArtwork('cable-triceps-pushdown', 'finish', 'male'),
  ).toBe(2602);
  expect(findExercise('cable-triceps-pushdown')).toMatchObject({
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    equipment: ['cable'],
  });
  expect(findTechnique('cable-triceps-pushdown')?.scope).toBe(
    'High-cable elbow extension; attachment unspecified.',
  );
  for (const phase of ['start', 'finish'] as const) {
    expect(
      resolveExerciseArtwork('cable-triceps-pushdown', phase, 'female'),
    ).toBeNull();
    expect(resolveExerciseArtwork('cable-biceps-curl', phase, 'male')).toBe(
      phase === 'start' ? 2501 : 2502,
    );
    for (const id of ['bodyweight-dip', 'bulgarian-split-squat', 'unknown'])
      expect(resolveExerciseArtwork(id, phase, 'male')).toBeNull();
  }
  expect(resolveAttachmentArtwork('cable-triceps-pushdown')).toBeNull();
});

it('binds only Male overhead cable extension while retaining generic guide and triceps roles', () => {
  expect(
    resolveExerciseArtwork('overhead-cable-triceps-extension', 'start', 'male'),
  ).toBe(2701);
  expect(
    resolveExerciseArtwork(
      'overhead-cable-triceps-extension',
      'finish',
      'male',
    ),
  ).toBe(2702);
  expect(findExercise('overhead-cable-triceps-extension')).toMatchObject({
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    equipment: ['cable'],
  });
  expect(findTechnique('overhead-cable-triceps-extension')?.scope).toBe(
    'Overhead cable elbow extension; pulley setup varies.',
  );
  for (const phase of ['start', 'finish'] as const) {
    expect(
      resolveExerciseArtwork(
        'overhead-cable-triceps-extension',
        phase,
        'female',
      ),
    ).toBeNull();
    expect(
      resolveExerciseArtwork('cable-triceps-pushdown', phase, 'male'),
    ).toBe(phase === 'start' ? 2601 : 2602);
    expect(resolveExerciseArtwork('cable-biceps-curl', phase, 'male')).toBe(
      phase === 'start' ? 2501 : 2502,
    );
    for (const id of ['bodyweight-dip', 'bulgarian-split-squat', 'unknown'])
      expect(resolveExerciseArtwork(id, phase, 'male')).toBeNull();
  }
  expect(
    resolveAttachmentArtwork('overhead-cable-triceps-extension'),
  ).toBeNull();
});

it('binds only Male two-hand overhead dumbbell extension and preserves guide and triceps roles', () => {
  expect(
    resolveExerciseArtwork(
      'dumbbell-overhead-triceps-extension',
      'start',
      'male',
    ),
  ).toBe(2801);
  expect(
    resolveExerciseArtwork(
      'dumbbell-overhead-triceps-extension',
      'finish',
      'male',
    ),
  ).toBe(2802);
  expect(findExercise('dumbbell-overhead-triceps-extension')).toMatchObject({
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    equipment: ['dumbbell'],
  });
  expect(findTechnique('dumbbell-overhead-triceps-extension')?.scope).toBe(
    'Two-hand overhead dumbbell extension.',
  );
  for (const phase of ['start', 'finish'] as const) {
    expect(
      resolveExerciseArtwork(
        'dumbbell-overhead-triceps-extension',
        phase,
        'female',
      ),
    ).toBeNull();
    expect(
      resolveExerciseArtwork('overhead-cable-triceps-extension', phase, 'male'),
    ).toBe(phase === 'start' ? 2701 : 2702);
    expect(
      resolveExerciseArtwork('cable-triceps-pushdown', phase, 'male'),
    ).toBe(phase === 'start' ? 2601 : 2602);
    for (const id of ['bulgarian-split-squat', 'bodyweight-dip', 'unknown'])
      expect(resolveExerciseArtwork(id, phase, 'male')).toBeNull();
  }
  expect(
    resolveAttachmentArtwork('dumbbell-overhead-triceps-extension'),
  ).toBeNull();
});

it('binds only Male close grip bench press and preserves shoulder-width guide and mixed muscle roles', () => {
  expect(
    resolveExerciseArtwork('close-grip-bench-press', 'start', 'male'),
  ).toBe(2901);
  expect(
    resolveExerciseArtwork('close-grip-bench-press', 'finish', 'male'),
  ).toBe(2902);
  expect(findExercise('close-grip-bench-press')).toMatchObject({
    primaryMuscles: ['triceps'],
    secondaryMuscles: ['chest', 'front-delts'],
    equipment: ['barbell', 'bench'],
  });
  expect(findTechnique('close-grip-bench-press')?.scope).toBe(
    'Shoulder-width barbell bench press.',
  );
  for (const phase of ['start', 'finish'] as const) {
    expect(
      resolveExerciseArtwork('close-grip-bench-press', phase, 'female'),
    ).toBeNull();
    expect(
      resolveExerciseArtwork(
        'dumbbell-overhead-triceps-extension',
        phase,
        'male',
      ),
    ).toBe(phase === 'start' ? 2801 : 2802);
    expect(
      resolveExerciseArtwork('overhead-cable-triceps-extension', phase, 'male'),
    ).toBe(phase === 'start' ? 2701 : 2702);
    for (const id of ['bulgarian-split-squat', 'bodyweight-dip', 'unknown'])
      expect(resolveExerciseArtwork(id, phase, 'male')).toBeNull();
  }
  expect(resolveAttachmentArtwork('close-grip-bench-press')).toBeNull();
});

it('resolves only exact Male lying triceps phases without borrowing bench or extension artwork', () => {
  expect(
    resolveExerciseArtwork('lying-barbell-triceps-extension', 'start', 'male'),
  ).toBe(3001);
  expect(
    resolveExerciseArtwork('lying-barbell-triceps-extension', 'finish', 'male'),
  ).toBe(3002);
  expect(findExercise('lying-barbell-triceps-extension')).toMatchObject({
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    equipment: ['barbell', 'bench'],
  });
  expect(findTechnique('lying-barbell-triceps-extension')?.scope).toBe(
    'Supine barbell elbow extension.',
  );
  for (const phase of ['start', 'finish'] as const) {
    expect(
      resolveExerciseArtwork(
        'lying-barbell-triceps-extension',
        phase,
        'female',
      ),
    ).toBeNull();
    expect(
      resolveExerciseArtwork('close-grip-bench-press', phase, 'male'),
    ).toBe(phase === 'start' ? 2901 : 2902);
    expect(
      resolveExerciseArtwork(
        'dumbbell-overhead-triceps-extension',
        phase,
        'male',
      ),
    ).toBe(phase === 'start' ? 2801 : 2802);
    expect(
      resolveExerciseArtwork('bulgarian-split-squat', phase, 'male'),
    ).toBeNull();
    expect(resolveExerciseArtwork('bodyweight-dip', phase, 'male')).toBeNull();
  }
  expect(
    resolveAttachmentArtwork('lying-barbell-triceps-extension'),
  ).toBeNull();
});

it('binds only Male assisted dip machine and preserves shoulder-width guide and mixed muscle roles', () => {
  expect(resolveExerciseArtwork('assisted-dip-machine', 'start', 'male')).toBe(
    3101,
  );
  expect(resolveExerciseArtwork('assisted-dip-machine', 'finish', 'male')).toBe(
    3102,
  );
  expect(findExercise('assisted-dip-machine')).toMatchObject({
    primaryMuscles: ['triceps'],
    secondaryMuscles: ['chest', 'front-delts'],
    equipment: ['machine'],
  });
  expect(findTechnique('assisted-dip-machine')?.scope).toBe(
    'Counterweighted dip machine.',
  );
  for (const phase of ['start', 'finish'] as const) {
    expect(
      resolveExerciseArtwork('assisted-dip-machine', phase, 'female'),
    ).toBeNull();
    expect(
      resolveExerciseArtwork(
        'dumbbell-overhead-triceps-extension',
        phase,
        'male',
      ),
    ).toBe(phase === 'start' ? 2801 : 2802);
    expect(
      resolveExerciseArtwork('overhead-cable-triceps-extension', phase, 'male'),
    ).toBe(phase === 'start' ? 2701 : 2702);
    for (const id of ['bulgarian-split-squat', 'bodyweight-dip', 'unknown'])
      expect(resolveExerciseArtwork(id, phase, 'male')).toBeNull();
  }
  expect(resolveAttachmentArtwork('assisted-dip-machine')).toBeNull();
});

it('keeps Back Squat Female, attachment and unsupported variant fallbacks', () => {
  for (const phase of ['start', 'finish'] as const) {
    expect(
      resolveExerciseArtwork('barbell-back-squat', phase, 'female'),
    ).toBeNull();
    expect(
      resolveExerciseArtwork('bulgarian-split-squat', phase, 'male'),
    ).toBeNull();
  }
  expect(resolveAttachmentArtwork('barbell-back-squat')).toBeNull();
});

it('keeps Front Squat Female and attachment fallbacks', () => {
  for (const phase of ['start', 'finish'] as const)
    expect(
      resolveExerciseArtwork('barbell-front-squat', phase, 'female'),
    ).toBeNull();
  expect(resolveAttachmentArtwork('barbell-front-squat')).toBeNull();
});

it('keeps Leg Press Female and attachment fallbacks', () => {
  for (const phase of ['start', 'finish'] as const)
    expect(resolveExerciseArtwork('leg-press', phase, 'female')).toBeNull();
  expect(resolveAttachmentArtwork('leg-press')).toBeNull();
});

it('keeps Smith Squat Female and attachment fallbacks', () => {
  for (const phase of ['start', 'finish'] as const)
    expect(
      resolveExerciseArtwork('smith-machine-squat', phase, 'female'),
    ).toBeNull();
  expect(resolveAttachmentArtwork('smith-machine-squat')).toBeNull();
});

it('keeps Reverse Lunge Female and attachment fallbacks', () => {
  for (const phase of ['start', 'finish'] as const)
    expect(
      resolveExerciseArtwork('dumbbell-reverse-lunge', phase, 'female'),
    ).toBeNull();
  expect(resolveAttachmentArtwork('dumbbell-reverse-lunge')).toBeNull();
});
