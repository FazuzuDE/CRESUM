import {
  resolveExerciseArtwork,
  resolveAttachmentArtwork,
} from '../exercise-artwork';
import { findExercise } from '../exercise-library';
import { getCatalogVariant } from '../exercise-catalog-adapter';
import { findTechnique } from '../exercise-technique';
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
      'machine-chest-press',
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
    for (const other of ['press', 'machine-chest-press', 'unknown'])
      expect(resolveExerciseArtwork(other, phase, 'male')).toBeNull();
    for (const other of ['dumbbell-shoulder-press', 'barbell-overhead-press'])
      expect(resolveExerciseArtwork(other, phase, 'male')).not.toBe(
        resolveExerciseArtwork(id, phase, 'male'),
      );
  }
});
