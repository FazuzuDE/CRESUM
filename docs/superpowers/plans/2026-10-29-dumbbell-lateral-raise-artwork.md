# Dumbbell Lateral Raise Artwork Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the approved START/FINISH pair in the existing exercise views.

**Architecture:** Add an exact Male-only resolver binding and two source crops.
Reuse shared square contain rendering; no catalog, guide, data or screen changes.

**Tech Stack:** React Native, Expo, TypeScript, WebP and existing Jest tests.

**Spec:** `docs/EXERCISE_ASSETS.md`, “Dumbbell Lateral Raise — selected Male pair, 2026-10-29”.

## Global Constraints

- Existing ID `dumbbell-lateral-raise`; preserve legacy `lateral` meaning.
- Source `exec-e9efbee4-55ae-445d-8d06-51055b6a480e.png`, 1774 x 887.
- Exact half-sheet crops, RGB WebP quality92/method6, 887 square, no resampling/padding/retouch.
- Male only; default square contain; no new dependencies or data changes.
- Preserve provisional biomechanics/device/archive status and exact provenance.
- Stamp the actual draft PR number using `npm run version:pr -- <number>`.

## Review Focus

- Source halves and supplied-reference bytes match the recorded hashes.
- Complete hands, weights and shoes fit the shared 320/390-point projection.
- START/FINISH selection and expanded FINISH keep the intended asset.
- Female, adjacent exercise and legacy data meanings remain unchanged.
- Original prompt history and pending PC/Oracle status remain truthful.

### Task 1: Integrate the selected pair

**Files:** Create `assets/exercises/dumbbell-lateral-raise/{start.webp,finish.webp,generation-prompts.json,technique-manifest.json,technique-selection.json}`.
Modify `lib/exercise-artwork.ts`, the two existing artwork/technique test files, owning asset rules and decision log. Version metadata follows actual PR creation.

**Interfaces:** Consumes `resolveExerciseArtwork(id, phase, model)` and the existing `TechniqueArtwork` viewer. Produces selected local images for this exact Male ID; no API changes.

- [ ] Export both exact crops and record complete actual source/prompt/reference provenance.
- [ ] Extend the existing phase-selection/expanded-view scenario with `['Dumbbell Lateral Raise', 1701, 1702]` and native asset mocks; do not add redundant constant/metadata tests.
- [ ] Run `npm test -- --runTestsByPath lib/__tests__/exercise-artwork.test.ts lib/__tests__/technique-screen.test.tsx`; expect the new image scenario to fail because the resolver returns null.
- [ ] Add only the two local requires and exact Male-ID binding in `lib/exercise-artwork.ts`.
- [ ] Re-run the focused command; expect every scenario to pass. Inspect full-size and 320/390-point image projections.
- [ ] Commit the integration, push its isolated branch and open a draft PR to `develop`.
- [ ] Stamp the returned PR number, then run `npm run check`, `npm run export:check` and `git diff --check`; expect success. Verify both WebPs in each native export's metadata and bundle.
- [ ] Obtain one fresh read-only whole-branch review, publish the version commit, verify final-head CI and mark the PR ready. Leave merge to the established user workflow.
