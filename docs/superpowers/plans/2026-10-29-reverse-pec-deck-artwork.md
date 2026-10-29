# Reverse Pec Deck Artwork Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display the user-approved reverse pec deck START/FINISH pair.
**Architecture:** Add exact crops to existing Male-only artwork resolver; reuse shared square contain and existing technique viewers.
**Tech Stack:** React Native, Expo, TypeScript, WebP, Jest.
**Spec:** `docs/EXERCISE_ASSETS.md`, Reverse Pec Deck selected Male pair, 2026-10-29.

## Global Constraints

- Only existing `reverse-pec-deck` / Male; preserve generic identity, guides, muscles, History, attachments and Female fallbacks.
- Selected r6 source `exec-11ca7134-b790-4217-8827-070ca4d7841d.png`, SHA256 `33c568c58a4c10bcc8e5685d42665658216eb0242db75f2df0a1d7f95e265219`, 1774 x 887.
- Left/right exact 887 square crops, RGB WebP quality92/method6; no repaint, padding, resampling or separate phase transforms.
- Preserve all six exact generation records and actual reference lineage; selected geometry comes from user template, not earlier SS-FLY drafts.
- Status remains user-selected-provisional; source archive does not certify independent biomechanics, transmission reconstruction, physical-device or PC/Oracle backup.
- Stamp version using actual draft PR number.

## Review Focus

- Exact selected crops and original/reference hashes; all historical r1-r6 records unchanged.
- User-template geometry and lifted FINISH load retained, with honest unmeasured-mechanics scope.
- Full frame and hands/shoes visible in shared 320/390 projections.
- Correct START/FINISH inline and expanded phase.
- No changes to identity, instructions, data, attachments or unrelated/Female resolution.

### Task 1: Integrate selected pair

**Files:** Create `assets/exercises/reverse-pec-deck/{start.webp,finish.webp,generation-prompts.json,technique-manifest.json,technique-selection.json}`. Modify `lib/exercise-artwork.ts`, its existing tests, `docs/EXERCISE_ASSETS.md`, `docs/DECISIONS.md` and actual-PR version metadata.
**Interfaces:** Consume `resolveExerciseArtwork(id, phase, model)` and existing TechniqueArtwork; produce selected local Male phase images, no API or presentation changes.

- [ ] Export exact selected crops and provenance; preserve six historical prompt records.
- [ ] Extend existing technique scenario with `['Reverse Pec Deck', 1901, 1902]` and native mocks in the two existing test files. Missing/wrong binding or swapped phases must fail this consumer-visible scenario.
- [ ] Run baseline then new scenario before binding; expect no START image for new row.
- [ ] Add two requires and exact Male ID binding; focused tests must pass.
- [ ] Inspect full-frame and 320/390 projections, commit and publish isolated branch; open draft PR to develop.
- [ ] Stamp actual PR number; full `npm run check`, native iOS/Android exports, `git diff --check`; verify exact asset bytes in native manifests/bundles.
- [ ] One fresh whole-branch review; publish final version commit, verify final-head CI and mark ready. User merges.
