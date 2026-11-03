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

- [x] Export exact LEFT START / RIGHT FINISH RGB WebP92/method6 crops.
- [x] Update the existing manifest and retain prior metadata as superseded.
- [x] Record exact prompts, input/output hashes, selection and open visual QA.
- [x] Synchronize the approved appearance and remaining visual-block sequence.
- [x] Verify exports, existing resolver/viewer tests, typecheck, lint and formatting.
- [x] Open a draft PR, stamp its actual version with `version:pr`, run CI/export
      checks and mark ready when checks pass. Leave merge to the user.

## Review focus

Check square half-sheet order, full apparatus fit, unchanged attachment bytes and
exact-ID boundaries, truthful source provenance and remaining device/biomechanics
limits. Existing tests cover resolver/fallback behavior; no new application logic
or implementation-mirroring tests are needed for this asset replacement.

## Next preview

Generate the next V-handle pair using its own existing phases, the actual Male
Master and approved silver equipment reference; show without labels for review.

## Validation record

Local full check: 146 suites / 1355 tests passed, typecheck, lint, formatting,
anatomy, localization, configuration and dependency checks passed. Both native
platform exports passed. Exact crop reproduction/hash/byte counts and unchanged
attachment/old manifest verified. Independent asset review found no Critical or
Important issues; inaccurate direct-input wording and a historical input version
pin were corrected. PR #168 version is 0.1.68; GitHub CI tracked separately.
No physical-device acceptance or verified source backup is claimed.
