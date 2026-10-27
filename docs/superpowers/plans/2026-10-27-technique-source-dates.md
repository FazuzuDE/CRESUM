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

- [x] Baseline: run technique, localized-program/technique and source-contract tests.
- [x] RED: add a mixed-date row-guide test in each locale and both device time
      zones; assert each link's date independently. Add a source-metadata calendar
      validity contract so malformed authored dates cannot reach the renderer.
- [x] GREEN: modify `components/ExerciseTechnique.tsx`, the four
      `lib/i18n/locales/*/program-technique.ts` packs, and relevant tests. Consume
      `techniqueSources[id].checkedOn` with date-only parsing and explicit UTC;
      `technique.sourceCheckedOn` receives a localized date interpolation.
- [x] Document the fix and create a draft PR, then stamp its actual number.
- [x] Run targeted/full checks and native exports; obtain independent review
      and fix the source-date omission from spoken link labels with RED/GREEN
      assertions. Stabilize initial-render test timeout and Intl mock capture.

Leave merge and physical-device acceptance to the existing review/release flow.

Local verification: 143 suites / 1,153 tests, typecheck, lint, format, anatomy/
i18n/config checks and iOS/Android exports passed under Node 22.16.0/npm 10.9.2.
The local dependency check used the bundled SDK map. A clean UTC-removal mutation
failed all four negative-zone cases and passed all four positive-zone cases.

Delivery: publish this verified tree to draft PR #100, verify its ordinary online
GitHub CI and mark ready. The PR records live delivery status. Physical-device
layout and VoiceOver acceptance remain separate from these automated checks.
