# Dumbbell Curl Artwork Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display the approved Dumbbell Biceps Curl pair and retain the agreed supplementary-source policy.
**Architecture:** Exact local crops and existing Male-ID artwork resolver; existing shared square-contain viewers. Documentation only for Gymbot discovery policy, no bulk import or guide/catalog changes.
**Tech Stack:** React Native, Expo, TypeScript, WebP, Jest.
**Spec:** `docs/EXERCISE_ASSETS.md`, Dumbbell Biceps Curl selected Male pair; `docs/EXERCISE_LIBRARY.md`, supplementary discovery sources, 2026-10-29.

## Global Constraints

- Only existing `dumbbell-biceps-curl` / Male. Standing bilateral supinated example does not redefine generic standing/seated identity.
- Preserve guides, qualitative muscles, History/data, attachments and Female/unrelated fallbacks.
- Selected `exec-874186c0-ddc3-486d-b09a-a4ab938659d0.png`, SHA256 `1b0de5fe37a162794c1a32bad70132c52b6199e035db54a1c783b3c27bda10f2`,1774x887.
- Exact left/right887-square RGB WebP quality92/method6. No repaint, padding, resampling or separate phase transforms.
- Retain exact historical generation record and actual Master/user example inputs. User alternating example is not mistaken for START/FINISH.
- Gymbot is supplementary discovery, not automatically verified or a reuse licence. Independently authored descriptions/original CRESUM illustrations; validate exact-variant claims with authoritative sources, no bulk import.
- User-selected-provisional: detailed independent biomechanics and physical-device checks remain open. Archive availability is not verified PC/Oracle backup.
- Stamp actual draft PR number only.

## Review Focus

- Reproduce exact selected halves/hashes and historical prompt/reference record.
- Master/outfit/dumbbell continuity, full-frame and320/390 projections.
- Both arms lowered versus both curled, supinated closed grips, stable upper arms/trunk.
- Correct phase inline and expanded; female/unrelated/attachment resolution unchanged.
- Source policy truthfully limits category inspection and verification/reuse scope; no catalogue identity or guide/data edits.

### Task 1: Integrate selected pair and approved source policy

**Files:** Create `assets/exercises/dumbbell-biceps-curl/{start.webp,finish.webp,generation-prompts.json,technique-manifest.json,technique-selection.json}`. Modify `lib/exercise-artwork.ts`, two existing test files, `docs/EXERCISE_ASSETS.md`, `docs/EXERCISE_LIBRARY.md`, `docs/DECISIONS.md` and actual-PR version metadata.
**Interfaces:** Consume `resolveExerciseArtwork(id, phase, model)` and existing TechniqueArtwork; produce selected Male local phases, no API changes.

- [ ] Run focused baseline; Expected:39pass.
- [ ] Export exact selected crops and provenance; extend existing consumer scenario with `['Dumbbell Biceps Curl',2101,2102]`, native mocks beside existing mocks.
- [ ] Run focused before binding; Expected:new scenario fails with0START, existing39pass.
- [ ] Add two requires and exact Male-ID binding; Expected:focused40pass.
- [ ] Sync approved artwork/source policy and decision log; inspect320/390 and full frame, commit/publish isolated branch and open draft to develop.
- [ ] Stamp actual PR; full `npm run check`, native iOS/Android exports and `git diff --check`; Expected:all pass. Verify exact asset bytes/content IDs in native metadata/bundles.
- [ ] One fresh whole-branch review, final-head CI, update source supplement with exports and mark ready. User merges.
