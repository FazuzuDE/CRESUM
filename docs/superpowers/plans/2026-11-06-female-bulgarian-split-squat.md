# Female Bulgarian Split Squat Implementation Plan

**Goal:** Integrate approved Female pair for `bulgarian-split-squat`.
**Spec:** User approved after merge #200; LEFT upper stance / RIGHT lowered.
**Architecture:** Exact local femalePairs binding; existing shared viewers.
**Constraints:** Preserve Male, guide, quadriceps/glutes Primary,
hamstrings/adductors Secondary and History. Exact 887-square RGB WebP92/method6
crops; no resizing or independent transforms.

- [x] Extend switch/fallback cases and observe missing binding fail.
- [x] Add exact assets, binding, original prompt and actual input provenance.
- [x] Run tests/typecheck/lint/format/native exports; independent review.
- [x] Publish draft PR; stamp actual PR version, verify metadata, mark ready.

Review focus: phase order, exact-variant scope, shared character switching,
unavailable Female placeholders, crop/provenance reproduction.

PR #201, display 0.2.01/package 0.2.1. Full148 suites / 1391 tests passed.
Checks, native exports and independent review passed; CI/device QA pending.
