# Female Barbell Front Squat Implementation Plan

**Goal:** Integrate approved Female pair for `barbell-front-squat`.
**Spec:** User approved after merge #203; LEFT upright / RIGHT lowered, cross arms.
**Architecture:** Exact local femalePairs binding; existing shared viewers.
**Constraints:** Preserve Male, generic guide, quadriceps/glutes Primary,
abs/upper-back Secondary and History. Exact 887-square RGB WebP92/method6 crops;
no resizing or independent transforms. Do not redefine catalog grip.

- [x] Extend switch/fallback cases and observe missing binding fail.
- [x] Add exact assets, binding, original prompt and actual input provenance.
- [x] Run tests/typecheck/lint/format/native exports; independent review.
- [x] Publish draft PR; stamp actual PR version, verify metadata, mark ready.

Review focus: phase order, exact-variant scope, shared character switching,
unavailable Female placeholders, crop/provenance reproduction.

PR #204, display 0.2.04/package 0.2.4. Full 148 suites / 1394 tests passed.
Checks, native exports and independent review passed; CI/device QA pending.
