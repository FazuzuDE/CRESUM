import {
  resolveExerciseArtwork,
  resolveAttachmentArtwork,
} from '../exercise-artwork';
import { findExercise } from '../exercise-library';
import { getCatalogVariant } from '../exercise-catalog-adapter';
import { findTechnique } from '../exercise-technique';

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

const ergonomic = 'lat-pulldown-close-neutral-ergonomic-handle';

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
