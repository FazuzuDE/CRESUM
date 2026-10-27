# Seated Row Artwork Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the user-selected corrected row pair available for its exact grip.

**Architecture:** Add one stable catalog child and an explicit local asset binding.
Reuse existing technique/full-screen, equipment information and i18n surfaces;
keep generic row identity, storage and historical values unchanged.

**Tech Stack:** TypeScript, React Native/Expo, Jest, WebP.

**Spec:** `docs/superpowers/specs/2026-10-27-seated-row-artwork-design.md`.

## Global Constraints

- Exact ID: `seated-cable-row-close-neutral-v-handle`; family: `seated-cable-row`.
- Generic `seated-cable-row` and alias `row` remain unspecified and unchanged.
- No automatic history/template migration, schema/backend changes or new dependencies.
- Male only; preserve exact selected source hashes; Oracle pending-upload.
- Keep qualitative muscle mapping; no invented activation coefficients.

## Review Focus

- Old `row` sessions retain generic identity and values; exact child has separate Progress identity.
- A single attachment row must not silently convert generic row into the child.
- Far grip and stack internals are not visible enough for independent QA claims.
- A landscape pair must fit the existing contain frame and phase/full-screen controls.
- EN/RU/DE/FR guide/label coverage must remain complete without activating locales.

### Task 1: Exact row configuration and selected pair

**Files:**

- Create: `assets/exercises/seated-cable-row-close-neutral-v-handle/` exports, manifest, selection and prompts.
- Modify: `lib/exercise-library.ts`, `lib/exercise-catalog-adapter.ts`, `lib/exercise-artwork.ts`, `lib/exercise-equipment.ts`.
- Modify: `lib/exercise-technique/catalog.ts`, `lib/exercise-technique/sources.ts` and EN/RU/DE/FR catalog/technique content.
- Modify: owning EXERCISE_LIBRARY, EXERCISE_BIOMECHANICS, EXERCISE_ASSETS, PRODUCT, ROADMAP and DECISIONS documentation.
- Test: exercise-artwork, exercise-library, exercise-catalog-adapter, exercise-equipment, technique-screen and i18n coverage.

**Interfaces:**

- Consumes existing selected PNGs and shared `resolveExerciseArtwork(id, phase, model)` and `resolveAttachmentArtwork(id)`.
- Produces the exact child record, 501/502 distinct test asset IDs and the existing V-handle thumbnail source 203.

- [ ] Step 1: Add tests for exact 501/502 phase sources, Female/generic isolation, generic alias/history identity, required single attachment and phase/full-screen behavior. Adjust curated-catalog expectations to 67 records; generic row now maps as unspecified to its new family.
- [ ] Step 2: Run targeted Jest tests; expect failures because the new record/bindings/policy do not exist.
- [ ] Step 3: Export the two selected PNGs to RGB WebP within 1280x1280, quality 92, LANCZOS thumbnail. Record exact inputs/outputs, repairs and open review scope. Add the child/catalog mapping, guide/translations, required single attachment and explicit artwork binding. Generate English i18n data and classify only new source strings.
- [ ] Step 4: Run targeted tests, then `npm run check && npm run export:check` on Node 22.16/npm 10.9.2; expect all pass. Validate image decode/dimensions/hashes and review the full diff.
- [ ] Step 5: Fresh whole-branch review under requesting-code-review; address significant findings with regression proof. Commit focused changes and open a PR against develop. Do not merge or deploy.

The generated shared-plan catalog must also be rebuilt from the canonical
records. This updates repository compatibility data only, not a deployment.
An older deployed sharing service may reject the new ID until separately updated;
keep local plans intact and never substitute the generic row identity.
