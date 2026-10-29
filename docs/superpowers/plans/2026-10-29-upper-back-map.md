# Upper Back Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the exact selected upper-back schematic projection to the shared map.
**Architecture:** Add selected provenance/paths to the atlas builder; scope pairwise upper-back/traps tint occlusion in MuscleMap. Reuse existing map consumers with shared localized projection disclosure.
**Tech Stack:** TypeScript, Expo, react-native-svg, Jest, local SVG/PNG.
**Spec:** `docs/superpowers/specs/2026-10-29-upper-back-map-design.md`

## Global Constraints

- Exact r3 paths, source1312x1199, inset0/0, inward0/0, Y0/-1.5.70% preview only.
- Preserve prior94 regions/36 unresolved identities, source, catalog roles and saved data.
- Primary beats Secondary; ties prefer active projection, paint once, no count changes.
- Scoped render masks, no trimming geometry; winning active projection drawn above traps.
- Shared exercise/Progress disclosure in EN/RU/DE/FR; rear-delts/adductors remain missing.
- Native device acceptance remains open; actual PR version only, user merges develop.

## Review Focus

- Active projection remains selectable above neutral/secondary traps, without affecting decorative maps.
- Any Primary/Secondary/neutral pairing avoids double tint and Secondary occlusion.
- Same source/path/transform in compact/full and Progress; only accepted rightY changes.
- Two simultaneous map instances retain unique mask references; hidden shoulders remain unassigned.
- Missing-group and projection copy stays truthful, all role counts and history data unchanged.

### Task 1: Integrate selected upper-back projection

**Files:** Create selected study under `assets/muscle-map/male-anatomy-v1/upper-back-projection-study/`. Modify generated-study formatter exclusions, atlas builder/runtime-atlas, MuscleMap, ExerciseMuscles, MuscleProgress, four progress locale packs, existing anatomy/card/Progress tests, PRODUCT/DESIGN_SYSTEM/ROADMAP/DECISIONS and actual-PR metadata.
**Interfaces:** Existing MuscleMap muscles/selected/onSelect/height contract remains unchanged. Atlas gains two upper-back regions; rendering derives categorical pair precedence from existing role flags only.

- [ ] Run focused baseline. Expected:13 tests pass.
- [ ] Add renderer tests for selected transform and7 role pairings, mask scope/order and visible consumer caveats before mapping. Expected:new projection/occlusion/disclosure assertions fail.
- [ ] Add selected geometry/translation and atlas provenance, implement scoped occlusion and localized disclosures; adjust existing counts/coverage expectations only for the2 added regions. Expected:focused tests pass and prior94 paths unchanged.
- [ ] Verify selected raster/vector exports/source hashes and static overlap/raster compositor; synchronize approved rules and commit. Expected:zero background/mutual overlap, no extra tint.
- [ ] Open draft PR, stamp actual number; npm run check and native exports. Expected:all pass.
- [ ] One fresh independent branch review, final-head CI and source-archive update; mark ready. User merges.
