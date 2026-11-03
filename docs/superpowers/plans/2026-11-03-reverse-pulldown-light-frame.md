# Reverse Pulldown Light Frame Implementation Plan

**Goal:** Replace the selected Male reverse-grip pair with its approved front-camera
silver-frame sheet, preserving exercise identity and historical meaning.
**Spec:** User approval 2026-11-03; EXERCISE_ASSETS / EXERCISE_LIBRARY contracts.
**Architecture:** Existing exact paths/shared viewers; no application logic changes.

- [x] Export exact LEFT START / RIGHT FINISH 887-square RGB WebP92/method6 halves.
- [x] Retain old revision2 manifest, historical exports, exact prompt/actual hashes.
- [x] Synchronize approval and keep detailed biomechanics/device limits provisional.
- [x] Verify image integrity, preserved assets, relevant tests and quality checks.
- [x] Create PR, stamp actual version, validate native exports and report CI status.
- [x] Show next close-neutral seated-row preview separately for review.

Review focus: correct phase order, supinated inner grip/front bar, full-frame fit,
unchanged identity/attachment behavior, actual provenance and mechanical limitations.

## Validation record

181 resolver/viewer tests passed in two suites; typecheck, lint, formatting and
iOS/Android exports passed. Exact crops/hash/dimensions, all attachment bytes and
historical pre-occlusion FINISH verified. Independent review confirmed provenance
and front-of-chest/underhand appearance; observed plate/selector inconsistencies
are recorded as known limitations without changing approved bytes. PR #171 uses
generated version 0.1.71. Final GitHub CI tracked separately. No new full local
suite, physical-device acceptance or verified backup claim. The seated-row preview
is separate and remains unintegrated pending user review.
