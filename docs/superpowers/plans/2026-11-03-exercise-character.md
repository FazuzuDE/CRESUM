# Exercise Character Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement task by task.

**Goal:** Persist one character choice and use it for every exercise illustration.

**Architecture:** Extend onboarding answers, share the resolved value through React
context and retain the existing exact-variant artwork resolver. Add one female
pair without changing male assets or saved workout identities.

**Tech Stack:** React Native, Expo, TypeScript, AsyncStorage, Jest.

**Spec:** `docs/superpowers/specs/2026-11-03-exercise-character-design.md`

## Global Constraints

- Offline first; no new dependency, storage version or workout migration.
- Missing artworkModel resolves to male. Unknown nonempty values fail validation.
- No cross-model or cross-equipment fallback; complete phase pairs only.
- Profile and welcome share the same saved field.

## Review Focus

- Legacy onboarding/backup without the field remains readable.
- Failed Profile saves retain old selection; retry can succeed.
- Switching during a workout changes artwork without changing workout bytes.
- Restore/reset cannot race a pending preference write.
- Existing first-run navigation and manual setup pass through the new choice.

### Task 1: Persist choice and expose UI

Files: `lib/onboarding.ts`, `components/ExerciseCharacterProvider.tsx`,
`components/ExerciseCharacterPicker.tsx`, `components/ProfileSettings.tsx`,
`components/Onboarding.tsx`, `app/index.tsx`, four locale profile dictionaries.
Interface: optional OnboardingAnswers.artworkModel; OnboardingStep character;
useExerciseCharacter returns model/saving/error/select/retry.

- [x] Add failing parser and app flow tests: round-trip female, reject unknown,
      legacy unchanged, welcome selection/back/reload, Profile change/restart/failure.
- [x] Run relevant Jest tests; confirm feature-specific failures.
- [x] Implement context, shared picker, welcome step and serialized Profile save.
- [x] Update existing flow tests for the new required welcome step.
- [x] Run parser/flow/profile/backup/reset tests; commit.

### Task 2: Exact-model artwork and female pilot

Files: `lib/exercise-artwork.ts`, `components/ExerciseArtwork.tsx`,
`components/TechniqueArtwork.tsx`, `assets/exercises/goblet-squat/female/*`.
Consumes Task 1 context; resolver retains (variantId, phase, model) signature.

- [x] Add failing female resolver and real rendered image switching tests,
      including expanded viewer and missing kettlebell/other female pairs.
- [x] Run tests and confirm missing female pair/hardcoded male failures.
- [x] Export exact half-sheet female phases, retain provenance/prompt/hash manifest,
      add female bindings and subscribe both artwork components to shared context.
- [x] Run affected artwork and complete Jest suite.
- [x] Sync PRODUCT/DESIGN_SYSTEM/ROADMAP/DECISIONS/EXERCISE_ASSETS.
- [ ] Run typecheck, lint, format, localization, native export and configured CI
      checks. Review diff, commit, open draft PR to develop, stamp actual PR version,
      verify and mark ready. Do not merge.

## Completion evidence

PR176 already existed with the Female Master checkpoint; merge that source commit
into this implementation and update the same draft instead of opening a duplicate.
Node22: all 148 suites / 1366 tests passed. Typecheck, lint, format, anatomy,
localization and config checks passed. Native iOS/Android exports passed.
Online dependency verification timed out at the HTTP proxy; the Expo offline
native-version check passed. No dependency versions changed. See
`docs/qa/2026-11-03-exercise-character.md` for device limits and review fixes.

Delivery status: local implementation, review fixes, full tests and native exports
are complete. After the initial automatic review rejection, the user explicitly
authorized sending this source/artwork payload to FazuzuDE/CRESUM,
assets/female-master-foundation, updating PR176. The shell Git transport has no
credentials; authorized delivery proceeds through the connected GitHub account.
Remote CI and ready-for-review status are tracked in PR176.
