# Technique source dates implementation plan

> **For agentic workers:** use superpowers:executing-plans for this focused fix.

**Goal:** close the source-date defect deferred in PR #98: the Sources panel
must display each reference's actual `checkedOn` date instead of October 12.

**Architecture:** retain the reference catalog and existing source links. Move
the check date into each reference row; keep the summary note date-free. Format
ISO calendar dates using UTC explicitly so the displayed day remains stable.

**Tech stack:** React Native, TypeScript, existing Intl/i18n engine, Jest.
**Spec:** existing source metadata in `lib/exercise-technique/sources.ts` and
the deferred Sources-panel finding documented in PR #98.

## Constraints and review focus

- Preserve source dates, URLs, exercise identities, workout data and artwork.
- Translate the note and per-source date label in EN/RU/DE/FR together.
- Mixed October 12/27 references must retain their own dates beside their links.
- Display must remain correct in negative and positive device time zones.
- Follow PR_VERSIONING.md using the actual new PR number, never a prediction.

## Task 1: Correct the Sources panel

- [ ] Baseline: run technique, localized-program/technique and source-contract tests.
- [ ] RED: add a mixed-date row-guide test in each locale and both device time
      zones; assert each link's date independently. Add a source-metadata calendar
      validity contract so malformed authored dates cannot reach the renderer.
- [ ] GREEN: modify `components/ExerciseTechnique.tsx`, the four
      `lib/i18n/locales/*/program-technique.ts` packs, and relevant tests. Consume
      `techniqueSources[id].checkedOn` with date-only parsing and explicit UTC;
      `technique.sourceCheckedOn` receives a localized date interpolation.
- [ ] Document the fix and create a draft PR, then stamp its actual number.
- [ ] Run targeted/full checks and native exports; obtain independent review,
      fix blockers, publish the validated tree and verify GitHub CI.

Leave merge and physical-device acceptance to the existing review/release flow.
