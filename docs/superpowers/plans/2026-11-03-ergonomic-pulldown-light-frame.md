# Ergonomic Pulldown Light Frame Implementation Plan

**Goal:** Replace the existing Male ergonomic-handle pair with the user-approved
silver-frame sheet after removal of its START/FINISH labels.

**Architecture:** Keep existing exact-ID asset paths and shared viewers. Export
the two square halves of the selected sheet; retain attachment and catalog data.

**Spec:** User approvals in this thread, 2026-11-03; existing
`docs/EXERCISE_ASSETS.md` and `docs/EXERCISE_LIBRARY.md` contracts.

**Constraints:** No new identity, guide, muscle mapping, runtime logic or data
migration. No labels, resampling, padding or independent placement. Archive status
remains pending; actual generation inputs must not be embellished.

## Task 1: Replace and verify the selected pair

- [ ] Export exact LEFT START / RIGHT FINISH RGB WebP92/method6 crops.
- [ ] Update the existing manifest and retain prior metadata as superseded.
- [ ] Record exact prompts, input/output hashes, selection and open visual QA.
- [ ] Synchronize the approved appearance and remaining visual-block sequence.
- [ ] Verify exports, existing resolver/viewer tests, typecheck, lint and formatting.
- [ ] Open a draft PR, stamp its actual version with `version:pr`, run CI/export
      checks and mark ready when checks pass. Leave merge to the user.

## Review focus

Check square half-sheet order, full apparatus fit, unchanged attachment bytes and
exact-ID boundaries, truthful source provenance and remaining device/biomechanics
limits. Existing tests cover resolver/fallback behavior; no new application logic
or implementation-mirroring tests are needed for this asset replacement.

## Next preview

Generate the next V-handle pair using its own existing phases, the actual Male
Master and approved silver equipment reference; show without labels for review.
