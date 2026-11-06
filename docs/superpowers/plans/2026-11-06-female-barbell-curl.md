# Female Straight-Bar Biceps Curl Implementation Plan

**Goal:** Integrate approved Female pair for `barbell-curl`.
**Spec:** User approved after merge #207; LEFT lowered / RIGHT elbows flexed.
**Architecture:** Exact local femalePairs binding; existing shared viewers.
**Constraints:** Preserve Male, guide, biceps Primary, forearms Secondary,
stable IDs and History. Exact 887-square RGB WebP92/method6 crops; no transforms.
Keep straight bar distinct from EZ bar and dumbbells.
**Base:** canonical develop ed54254610ec28ec9f97e392dac063510aefe0fd tree
25e1873f5eef94bdb9cf3026a6fe01d2b89212c8 equals local 4dce99a tree.

- [x] Extend existing switching case and observe missing binding fail.
- [x] Add exact assets, binding, original prompt and actual input provenance.
- [x] Run tests/typecheck/lint/format/native exports; independent review.
- [x] Publish draft PR; stamp actual PR version, verify metadata, mark ready.

Review focus: exact variant/phase, shared character switching, preservation of
other curls, unavailable Female placeholders, crop/provenance integrity.
