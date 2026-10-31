# Lying Barbell Triceps Extension Pair Implementation Plan

Use superpowers:executing-plans inline; one fresh whole-branch review.

**Goal:** Integrate exact user-approved r4 through the existing shared viewers.
**Architecture:** local exact-ID Male artwork resolver; existing guide and map.
**Tech Stack:** React Native/Expo/TypeScript, Jest, RGB WebP.
**Spec:** docs/superpowers/specs/2026-10-31-lying-triceps-pair-design.md

## Global Constraints

Exact selected pixels; stable ID/History/guide/roles; no Female or attachment
borrowing; actual PR/version; preserve prior source bytes; user merges.

## Review Focus

- Confirm exact crop/reencode/hash/prompt/input provenance and all source retention.
- Visible hand/grip/head clearance, stable upper arms, plate/bench geometry and materials.
- Equal contain framing, full shoes/bar/bench, 320/390 phase readability.
- Exact ID only, no unrelated exercise, Female or attachment leakage.
- Inline/expanded phase sources and FINISH retained after anatomy close; triceps only.

### Task 1: Bind selected pair

**Files:** assets/exercises/lying-barbell-triceps-extension/{start.webp,finish.webp,technique-manifest.json,technique-selection.json,generation-prompts.json}; lib/exercise-artwork.ts; lib/**tests**/{exercise-artwork.test.ts,technique-screen.test.tsx}; owning docs.
**Interfaces:** resolveExerciseArtwork(id,phase,model) supplies unchanged shared viewers. No conflicting tasks.

- [ ] Add regression expectations: START3001/FINISH3002 only for exact Male ID; Female null, attachment null; other extensions unchanged. Screen phases + anatomy FINISH retention with triceps only.
- [ ] Run npm test -- --runTestsByPath lib/**tests**/exercise-artwork.test.ts lib/**tests**/technique-screen.test.tsx; expect missing binding/image failures.
- [ ] Add minimal pair and exact-ID binding; provenance and approved decision docs.
- [ ] Same tests pass; full npm run check and native export pass. Commit focused change.
- [ ] One fresh whole-branch review, fix important findings if any.
- [ ] Draft PR; actual version stamp; final-head CI; cumulative source checkpoint; ready.
