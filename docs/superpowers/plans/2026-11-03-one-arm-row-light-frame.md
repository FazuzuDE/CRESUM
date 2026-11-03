# One-arm Row Light Frame Implementation Plan

**Goal:** Replace the selected Male one-arm row pair with the approved silver-bench
sheet, preserving the exact exercise and historical meaning.
**Spec:** User approval 2026-11-03; existing exercise asset/library contracts.
**Architecture:** Same exact phase paths/shared viewers; no application logic change.

- [x] Export exact 887-square LEFT START / RIGHT FINISH RGB WebP92/method6 halves.
- [x] Retain old manifest, exact prompt and actual four-input/output hashes.
- [x] Sync approval/audit progress and pin dependent historical reference.
- [x] Verify image integrity, attachments, relevant tests and quality/native export.
- [x] Open PR, stamp actual version and report final GitHub CI status.
- [x] Show chest-supported row silver preview separately for user review.

Review focus: near working arm/far supports and unresolved anatomical laterality,
body/bench continuity, full-frame
fit, truthful provenance, unchanged attachment/identity and detailed QA limits.

Verification: PR #173, version 0.1.73. Exact crops, hashes, attachment and runtime
integrity passed; 181 focused tests passed; typecheck, lint and changed-file
Prettier passed; iOS/Android export passed. Anatomical laterality remains
unresolved and is recorded explicitly. Source hashes remain unchanged.
Chest-supported row preview was generated and displayed separately.
GitHub CI is reported separately after the final version commit; no full-suite
or physical-device validation is claimed.
