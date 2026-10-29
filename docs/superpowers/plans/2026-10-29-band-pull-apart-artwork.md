# Band Pull-Apart Artwork Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display the selected Band Pull-Apart START/FINISH pair in existing technique viewers.
**Architecture:** Exact local phase crops, one existing Male-ID resolver binding, shared square contain. No catalog, guide, data or screen changes.
**Tech Stack:** React Native, Expo, TypeScript, WebP, Jest.
**Spec:** `docs/EXERCISE_ASSETS.md`, Band Pull-Apart selected Male pair, 2026-10-29.

## Global Constraints

- Only existing `resistance-band-pull-apart` / Male; preserve identity, guides, qualitative muscles, History, attachments and Female/unrelated fallbacks.
- Selected source `exec-acdda835-8a6e-48b6-abc2-cbbb2cefe6b7.png`, SHA256 `a5d9abfcc2c0686dc497b8bb832d9854435a42a94af77f6a2c60edc8b8fe0fe6`, 1774 x 887.
- Left/right exact 887-square crops, RGB WebP quality92/method6, no repaint, padding, resampling or phase-specific transforms.
- Preserve exact paired generation prompt and actual user example/Male Master references. Do not add anatomical overlays or change exercise semantics.
- User-selected-provisional: detailed independent biomechanics, measured elastic strain and device acceptance remain open; archive is not verified PC/Oracle backup.
- Stamp version using actual draft PR number.

## Review Focus

- Reproduce exact selected source halves and hashes; preserve historical generation record.
- Master identity/material continuity and full scene at 320/390 projections.
- Forward START versus lateral FINISH with visible band tension and appropriate torso occlusion.
- Correct phase inline and expanded; Female and unrelated artwork remain unchanged.
- Generic catalog/guide/data/attachments unchanged; no measured elastic or anatomy certification.

### Task 1: Integrate selected pair

**Files:** Create `assets/exercises/resistance-band-pull-apart/{start.webp,finish.webp,generation-prompts.json,technique-manifest.json,technique-selection.json}`. Modify `lib/exercise-artwork.ts`, its two existing test files, `docs/EXERCISE_ASSETS.md`, `docs/DECISIONS.md`, and actual-PR version metadata.
**Interfaces:** Consume `resolveExerciseArtwork(id, phase, model)` and existing TechniqueArtwork; produce local Male phase images without API changes.

- [ ] Run existing focused tests; Expected: 38 pass.
- [ ] Export selected exact crops and provenance; extend existing phase consumer scenario with `['Resistance Band Pull-Apart', 2001, 2002]` and two native mocks in each existing test file.
- [ ] Run focused tests before binding; Expected: new scenario fails with zero START images, existing 38 pass.
- [ ] Add two requires and exact Male ID binding; rerun focused tests; Expected: 39 pass.
- [ ] Inspect full-frame and 320/390 projections, commit and publish isolated branch; open draft PR to develop.
- [ ] Stamp actual PR number; run full `npm run check`, native iOS/Android exports and `git diff --check`; Expected: all succeed. Verify exact asset bytes/content IDs in metadata and native bundles.
- [ ] Fresh whole-branch review; publish final version, verify final-head CI, mark ready. User merges.
