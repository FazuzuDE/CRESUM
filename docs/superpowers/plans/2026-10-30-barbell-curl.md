# Barbell Curl integration plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans.

**Goal:** Integrate approved exact Male pair with existing shared muscle card.
**Architecture:** Add static exact-ID pair to existing resolver; keep current
viewers and muscle consumers unchanged. Existing asset provenance convention.
**Tech Stack:** TypeScript/React Native local WebP; Pillow crop/export.
**Spec:** docs/superpowers/specs/2026-10-30-barbell-curl-design.md

## Global Constraints

Exact selected pixels and887 square crops; no data/ID/guide changes; no Female
or unrelated artwork fallback; version from actual PR; user merges.

## Review Focus

- START/FINISH identity, matched framing/materials and exact export hashes.
- Straight-bar identity must not leak into EZ-bar/hammer/cable curl.
- Phase switch and expanded muscle details retain correct image and roles.
- Source ZIP retains exact prompt/original/reference and truthful archive status.
- Native device and detailed biomechanics remain acceptance limits.

### Task1: Add selected pair and exact binding

**Files:** barbell-curl assets/metadata; lib/exercise-artwork.ts;
resolver/technique tests; owning docs; source archive.
**Interfaces:** resolveExerciseArtwork(barbell-curl, phase, male) -> local asset;
existing ExerciseTechnique -> ExerciseMuscles role/detail flow unchanged.

- [ ] Export selected crops and metadata; add failing binding/UI tests (RED).
- [ ] Add exact binding; run focused tests (GREEN); inspect320/390 images.
- [ ] Update owning docs; full check, hashes, native export; commit.
- [ ] One fresh branch review; draft PR; actual version stamp; final CI; ready.
