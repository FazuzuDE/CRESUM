# Wide Pulldown Light Frame Implementation Plan

**Goal:** Replace the Male wide-pronated pair with the user-approved front-camera
silver-frame sheet while preserving the existing exact variant and saved data.
**Spec:** Explicit 2026-11-03 approval; EXERCISE_ASSETS / EXERCISE_LIBRARY contracts.
**Architecture:** Same exact asset paths and shared viewers; no runtime code changes.

- [x] Export exact LEFT START / RIGHT FINISH 887-square RGB WebP92/method6 crops.
- [x] Retain previous manifest, two exact generation prompts and actual hashes.
- [x] Record front-camera approval and remaining visual/biomechanics limits.
- [x] Verify image integrity, attachment, relevant tests, typecheck/lint/format.
- [x] Create PR, stamp actual version and validate native exports/CI status.
- [x] Show next reverse-grip preview separately from production integration.

Review focus: front-of-chest bar, phase order, full frame fit, unchanged attachment
and identity, actual input provenance, count/registration and device limitations.

## Validation record

181 resolver/viewer tests passed in two suites; typecheck, lint, formatting and
iOS/Android exports passed. Exact crop reproduction, hashes, dimensions and
unchanged attachment verified. Independent review confirmed front-of-chest bar
appearance and actual provenance; observed stack-count/selector-row differences
are recorded as known limitations without changing user-selected bytes.
PR #170 uses generated version 0.1.70. Final GitHub CI is tracked separately;
no physical-device acceptance or verified source backup is claimed. The next
reverse-grip image is a separate unintegrated preview.
