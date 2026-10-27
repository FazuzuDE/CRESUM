# Wide Pronated Artwork Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Connect the selected Male wide-pronated pair with its repaired FINISH.

**Architecture:** Extend the existing exact-variant local artwork resolver.
Keep all catalog, muscle mapping and stored workout identities unchanged.

**Tech Stack:** Expo, React Native, TypeScript, Jest, local WebP.

**Spec:** `docs/EXERCISE_ASSETS.md`, selected wide pair and user-approved integration.

## Global Constraints

- Bind only `lat-pulldown-wide-pronated-bar` / Male.
- Keep other unsupported variants/models on placeholders.
- Preserve source hashes; distinguish user selection from certified biomechanics.

## Review Focus

- START and FINISH resolve their matching local phase assets.
- Full-screen expansion retains the selected phase.
- Female never borrows the Male pair.
- Legacy/generic and reverse-grip variants keep their existing semantics.
- Existing V-handle and ergonomic bindings remain available.

## Task 1: Bind and verify the pair

**Files:** `lib/exercise-artwork.ts`, its existing tests and technique-screen tests;
the wide variant asset folder; `docs/PRODUCT.md`, `docs/EXERCISE_ASSETS.md`,
`docs/DECISIONS.md`.

**Interfaces:** Existing `resolveExerciseArtwork(variantId, phase, model)` contract.

- [x] Update existing resolution assertions and add a technique-screen case
      opening wide START, switching to FINISH and expanding it. Move the
      placeholder case to Reverse Grip. Run both suites; expect missing artwork.
- [x] Add the exact Male binding; export the repaired FINISH and update source
      hashes, provenance and approved integration documentation.
- [x] Run focused suites, TypeScript, lint, formatting and native exports.
      Run full repository checks in CI before marking the PR ready.
- [x] Review the complete diff and asset provenance; commit and open a PR
      against develop. Do not merge automatically.

## Execution record

- Existing linked worktree reused; branch `assets/wide-pronated-technique`.
- Resolver and screen tests failed for missing wide artwork, then passed (9/9).
- Full local check: 142 suites / 1120 tests passed; iOS/Android exports passed.
- Current/historical source and output hashes and dimensions verified.
- Fresh read-only reviewer found no Critical or Important issues.
- Deferred minor: tests use non-null sources and phase labels; unique asset
  identifiers could additionally detect swapped phase files in a future edit.
- Review scope: user approval is present in the conversation; independent
  biomechanics certification and physical-device readability are not claimed.
- PR creation follows the existing authorized workflow; no automatic merge.
