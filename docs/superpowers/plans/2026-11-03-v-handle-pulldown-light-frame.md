# V-handle Pulldown Light Frame Implementation Plan

**Goal:** Replace only the approved Male V-handle phase pair with the selected
silver-frame no-label sheet, preserving all existing variant semantics.

**Spec:** User approval on 2026-11-03; EXERCISE_ASSETS and EXERCISE_LIBRARY.
**Architecture:** Existing exact-ID paths/shared viewers; no runtime code changes.

- [x] Export exact 887-square LEFT START / RIGHT FINISH RGB WebP92/method6 halves.
- [x] Retain old manifest, actual inputs, original, exact prompt and hashes.
- [x] Synchronize approved appearance and pin dependent historical input identity.
- [x] Verify image integrity, attachment bytes, resolver/viewer tests and quality.
- [x] Open PR, stamp actual version, validate native exports and report CI status.
- [x] Show next wide-pronated pulldown preview without integrating it prematurely.

Review focus: phase order, full apparatus fit, exact attachment distinction,
Master/material continuity, reference provenance and device/biomechanics limits.
No new behavior or tests that mirror implementation are needed for this asset swap.

## Validation record

181 resolver/viewer tests passed in two suites. Typecheck, lint and formatting
passed; image exports reproduce exactly and attachment bytes remain unchanged.
iOS/Android exports passed. Full local check ended without a final suite summary,
so no complete-suite pass is claimed. Final GitHub CI is tracked separately.
PR #169 uses generated version 0.1.69. Independent asset review confirmed
provenance and exports, and identified the stack-hole discrepancy now recorded
in the manifest/docs. Exact selected bytes remain user-selected-provisional.
The wide-grip preview is shown separately and is not integrated in this PR.
