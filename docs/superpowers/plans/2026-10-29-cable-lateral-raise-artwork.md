# Cable Lateral Raise Artwork Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the approved Cable Lateral Raise START/FINISH pair in existing views.

**Architecture:** Add exact source crops and a Male-only resolver binding.
Reuse shared square contain; no catalog, guide, data or screen changes.

**Tech Stack:** React Native, Expo, TypeScript, WebP and existing Jest tests.

**Spec:** `docs/EXERCISE_ASSETS.md`, “Cable Lateral Raise — selected Male pair, 2026-10-29”.

## Global Constraints

- Existing generic ID `cable-lateral-raise`; depicted side/height/handle/model do not redefine it.
- Source `exec-80ca6901-7489-464a-9b99-cfbfa1ec79f0.png`, 1774 x 887, repaired pair r2.
- Exact half-sheet crops, RGB WebP quality92/method6, 887 square, no padding/resampling/retouch.
- Male only; default square contain; preserve guides, muscles, data and attachment/Female fallbacks.
- Retain initial and repair records with all actual input hashes and truthful provisional acceptance.
- Stamp the actual draft PR number with `npm run version:pr -- <number>`.

## Review Focus

- Exact selected r2 halves and complete r1/r2 prompt/reference lineage match recorded bytes.
- Full hands/handle, shoes and frame fit the shared 320/390-point projections.
- START/FINISH selection and expanded FINISH preserve the intended phase.
- Generic ID, working-side semantics, Female/adjacent and attachment contracts remain unchanged.
- Hidden stack mechanics, measured reconstruction, independent biomechanics and device/backup acceptance remain open.

### Task 1: Integrate the selected pair

**Files:** Create `assets/exercises/cable-lateral-raise/{start.webp,finish.webp,generation-prompts.json,technique-manifest.json,technique-selection.json}`.
Modify `lib/exercise-artwork.ts`, the two existing artwork/technique test files, owning asset rules and decision log. Version metadata follows actual PR creation.

**Interfaces:** Consumes `resolveExerciseArtwork(id, phase, model)` and existing `TechniqueArtwork`. Produces selected local images for this exact Male ID; no API changes.

- [ ] Export exact crops and record both generation records plus actual source/reference hashes.
- [ ] Extend existing phase/expanded-view scenario with `['Cable Lateral Raise', 1801, 1802]` and native asset mocks; add no redundant constant/metadata tests.
- [ ] Run `npm test -- --runTestsByPath lib/__tests__/exercise-artwork.test.ts lib/__tests__/technique-screen.test.tsx`; expect the new scenario to fail with no START image before binding.
- [ ] Add only the two requires and exact Male-ID binding in `lib/exercise-artwork.ts`; rerun the focused command and expect every scenario to pass.
- [ ] Inspect full-size and 320/390-point projections, commit and publish the isolated branch through the connected GitHub app, and open a draft PR to `develop`.
- [ ] Stamp its actual number; run `npm run check`, `npm run export:check` and `git diff --check`, expecting success. Verify selected bytes/content IDs in each native export's metadata and bundle.
- [ ] Obtain one fresh read-only whole-branch review, publish the version commit, verify final-head CI and mark ready. Preserve the established user merge workflow.
