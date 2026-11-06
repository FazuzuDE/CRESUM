# Female Dumbbell Biceps Curl Implementation Plan

**Goal:** Integrate approved Female pair for `dumbbell-biceps-curl`.
**Spec:** User approved after merge #206; LEFT lowered / RIGHT both elbows flexed.
**Architecture:** Exact local femalePairs binding; existing shared viewers.
**Constraints:** Preserve Male, guide, biceps Primary, forearms Secondary,
stable IDs and History. Exact 887-square RGB WebP92/method6 crops; no transforms.
Standing bilateral image does not redefine generic catalog scope.
**Base:** canonical develop e43e9d3499bfb16a14b9c372764efe261620f385 tree
e813fa3983f7a54c34d217d9b5bf5a0962516112 equals local 6fc7b82 tree.

- [x] Extend existing switching case and observe missing binding fail.
- [x] Add exact assets, binding, original prompt and actual input provenance.
- [x] Run tests/typecheck/lint/format/native exports; independent review.
- [x] Publish draft PR; stamp actual PR version, verify metadata, mark ready.

Review focus: exact variant/phase, shared character switching, preservation of
other curls, unavailable Female placeholders, crop/provenance integrity.

PR #207, display 0.2.07/package 0.2.7. Full 148 suites / 1397 tests passed.
Checks, native exports and independent review passed; CI/device QA pending.
