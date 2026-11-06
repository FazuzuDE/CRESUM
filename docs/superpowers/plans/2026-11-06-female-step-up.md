# Female Step-up Implementation Plan

**Goal:** Integrate the user-approved pair for `bodyweight-step-up`/Female.
**Architecture:** Reuse exact-variant local `femalePairs` and shared viewers.
**Spec:** User approved the reattached JPEG on 2026-11-06; LEFT start, RIGHT finish.
**Constraints:** Preserve Male, unloaded each-lead-side guidance, muscle roles and History. Exact square crops, RGB WebP92/method6; no resizing or phase transforms.

- [x] Extend existing switching/fallback tests; verify missing Female binding fails.
- [x] Register exact Female phases and retain supplied source plus truthful provenance.
- [x] Run relevant/full tests, typecheck, lint, formatting and native exports; review diff.
- [x] Open draft PR, stamp actual PR version, verify metadata, mark ready.

Review focus: exact variant and phase order; Male ↔ Female across all viewers; unavailable Female placeholders; unchanged guide/history; reproducible exports from uploaded JPEG. Historical generation prompt/PNG/inputs unavailable; retain JPEG rather than invent provenance.

User explicitly approved image/source upload and PR creation on 2026-11-06. Draft PR #198 created; actual version stamped to 0.1.98 and metadata verified.
