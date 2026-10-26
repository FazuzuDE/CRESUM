import {
  resolveExerciseArtwork,
  resolveAttachmentArtwork,
} from '../exercise-artwork';
import { findExercise } from '../exercise-library';
import { getCatalogVariant } from '../exercise-catalog-adapter';
import { findTechnique } from '../exercise-technique';

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
  expect(resolveExerciseArtwork(ergonomic, 'start', 'male')).not.toBeNull();
  expect(resolveExerciseArtwork(ergonomic, 'finish', 'male')).not.toBeNull();
  expect(resolveAttachmentArtwork(ergonomic)).not.toBeNull();
  for (const id of [
    'pulldown',
    'lat-pulldown',
    'lat-pulldown-wide-pronated-bar',
    'lat-pulldown-close-neutral-v-handle',
    'unknown',
  ]) {
    expect(resolveExerciseArtwork(id, 'start', 'male')).toBeNull();
    expect(resolveAttachmentArtwork(id)).toBeNull();
  }
  expect(resolveExerciseArtwork(ergonomic, 'start', 'female')).toBeNull();
});
