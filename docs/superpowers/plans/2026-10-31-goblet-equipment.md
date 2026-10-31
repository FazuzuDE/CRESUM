# Goblet equipment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** One Goblet Squat card with equipment selection and All statistics.
**Architecture:** Preserve goblet-squat dumbbell ID. Add kettlebell-goblet-squat concrete ID, hide child from duplicate visible listing, share parent UI. Persist concrete IDs using existing libraryId/exerciseId paths instead of schema fields.
**Tech Stack:** React Native Expo TypeScript Jest WebP.
**Spec:** docs/superpowers/specs/2026-10-31-goblet-equipment-design.md

## Global Constraints

No stored-data rewrite; old goblet-squat remains dumbbell. Existing charts/map and unrelated fallbacks retained. RU/DE/FR labels. Separate previous performance; All is display-only aggregation. No auto-merge or ZIP.

## Review Focus

Selection in onAdd and onToggle flows; reopen plans/workouts; backup/sharing/import accepts new canonical ID; mixed-equipment same-session aggregation and attribution; filters and empty data; authored guide/source correctness.

### Task 1: End-to-end equipment choice

Files: lib/exercise-library.ts, lib/exercise-catalog-adapter.ts, lib/i18n/catalog.ts, lib/exercise-statistics.ts, components/ExerciseLibrary.tsx, components/ExerciseTechnique.tsx, components/ExerciseStatistics.tsx, lib/exercise-technique/catalog.ts and localized catalog/technique messages, tests and approved artwork manifests.
Interfaces: existing callbacks consume concrete LibraryExercise/ID; existing snapshots persist them. Add focused lib/goblet-equipment.ts helper if useful; no schema migration.

- [ ] Add failing meaningful tests for choice propagation, two equipment filters and All aggregation with provenance, old snapshots and independent previous performance.
- [ ] Run focused tests RED.
- [ ] Add concrete kettlebell variant/guide and family-aware single visible listing. Match art and instructions to selected ID.
- [ ] Add equipment choice to selection and browse flows, statistics All/Dumbbell/Kettlebell; retain chart/map/period controls and equipment labels on results.
- [ ] Regenerate/localize authored messages and inventories, fix count/registry tests meaningfully.
- [ ] Run focused tests GREEN, typecheck/lint/format/i18n, self-review and commit.
- [ ] Controller reviews task, runs full checks/native exports, publishes draft PR, stamps actual version and verifies final-head CI.
