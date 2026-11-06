# Female Barbell Deadlift Implementation Plan

**Goal:** Integrate approved Female pair for `barbell-deadlift`.
**Spec:** User approved after merge #204; LEFT floor setup / RIGHT upright.
**Architecture:** Exact local femalePairs binding; existing shared viewers.
**Constraints:** Preserve Male, generic guide, glutes/hamstrings/lower-back Primary,
traps/forearms/quadriceps Secondary and History. Exact 887-square RGB WebP92/method6
crops; no resizing or independent transforms. Male-only offset stays Male-only.
**Base:** canonical develop cd85c0a5cfefd0dbf78a95024a2e7c78e5df1cac tree
f6205ab555454f753b419a86aa5bb5cc4ba55713 equals local 2b27a55 tree. Direct Git
fetch is unavailable; publish with canonical remote parent and matching local tree.

- [x] Extend switch/fallback cases and observe missing binding fail.
- [x] Add exact assets, binding, original prompt and actual input provenance.
- [x] Run tests/typecheck/lint/format/native exports; independent review.
- [x] Publish draft PR; stamp actual PR version, verify metadata, mark ready.

Review focus: phase order, exact-variant scope, shared character switching,
unavailable Female placeholders, crop/provenance reproduction, Male-only offset.

PR #205, display 0.2.05/package 0.2.5. Full 148 suites / 1395 tests passed.
Checks, native exports and independent review passed; CI/device QA pending.
