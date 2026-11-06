# Female Floor Glute Bridge Implementation Plan

**Goal:** Integrate approved final Female pair for `dumbbell-floor-glute-bridge`.
**Spec:** User approved after merge #198; LEFT lowered / RIGHT raised pelvis.
**Architecture:** Exact local femalePairs binding; reuse character/viewer logic.
**Constraints:** Preserve Male, guide, glutes/hamstrings roles and History. Exact
887-square RGB WebP92/method6 crops; no resizing or independent transforms.

- [x] Extend existing switch/fallback cases and observe missing binding fail.
- [x] Add exact assets, binding and original/edit prompt/input provenance.
- [x] Run tests, typecheck, lint, formatting and native exports; review changes.
- [x] Publish draft PR; stamp actual PR number, check metadata, mark ready.

Review focus: phase order; exact-variant scope; shared Male/Female switching;
pending placeholders for other Female variants; crop/provenance reproduction.

PR #199: version 0.1.99. Full suite 148 / 1389 passed, native exports and checks
passed. Independent review found no actionable findings. Final CI/device QA pending.
