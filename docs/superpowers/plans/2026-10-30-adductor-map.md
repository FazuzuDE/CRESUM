# Adductor map implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans.

**Goal:** Bind four approved medial thigh patches without retracing.
**Architecture:** Override parent/representation of four existing atlas records;
reuse shared renderer and fixed role opacity. Localized partial coverage caveat.
**Tech Stack:** React Native SVG, existing TypeScript/atlas builder.
**Spec:** docs/superpowers/specs/2026-10-30-adductor-map-design.md

## Global Constraints

Source1312x1199 unchanged; original paths/transforms/clips and other92 records
exact; no catalog, persistence, load formula or dependency changes.

## Review Focus

- Primary/Secondary/no-set colors and selections retain existing behavior.
- Four stored settings and front anatomical side signs remain exact.
- All17 groups represented must not imply complete anatomy; empty coverage hidden.
- Partial coverage caveat appears in both consumers and expanded details.
- Native physical compositing/accessibility remain device acceptance.

### Task1: Bind selected patches and disclose partial coverage

**Files:** atlas builder/runtime JSON; ExerciseMuscles/MuscleProgress; four
progress locale packs; anatomical/exercise/Progress/technique tests; owning docs.
**Interfaces:** Consume existing selected study JSON; produce adductors records
and muscle.adductorRegion key using established consumers.

- [ ] Add failing selection/disclosure tests, run focused Jest (expected RED).
- [ ] Bind four records with source/selection checks; add localized caveats;
      hide missing coverage when empty; preserve all original study bytes.
- [ ] Update prior unmapped-adductor regression to cover bound partial regions.
- [ ] Run focused tests, full check, preservation and native export checks.
- [ ] Commit, one fresh whole-branch review, draft PR, actual-number version,
      final CI, ready. User merges.
