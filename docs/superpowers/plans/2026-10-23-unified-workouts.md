# Unified workouts implementation plan

> Execute inline using superpowers:executing-plans.

**Goal:** Open approved Workout plans directly from WORKOUTS and create plans there.
**Architecture:** Reuse SharingHub, TemplateEditor and WorkoutStore. Preserve old
management behind a secondary action. Separate web UUID generation at platform boundary.
**Tech Stack:** React Native, Expo, TypeScript.
**Spec:** docs/superpowers/specs/2026-10-23-unified-workouts-design.md

## Global constraints

Preserve local data, active workouts, native lazy crypto loading and disabled
network sharing. Use existing translations; new copy must include EN/RU/DE/FR.

## Review focus

Creation failure/cancel retains safe state; busy prevents repeated actions;
management returns to Profile; hidden plans remain hidden; secure randomness
failure never creates a weak-ID workout.

## Task 1: Unified navigation, creation and web start

- [x] Add failing tests for direct WORKOUTS navigation and hub create/save/failure.
- [x] Add failing web UUID test without randomUUID, including failure safety.
- [x] Connect Profile direct navigation, hub editor and preserved management.
- [x] Add web UUID v4 generation using secure getRandomValues; preserve native behavior.
- [x] Update PRODUCT, DESIGN_SYSTEM, ROADMAP and DECISIONS with approved scope.
- [x] Run typecheck, lint, localization, tests and native/web exports.
- [ ] Complete browser start, completed-set and muscle-map acceptance.
- [ ] Commit and update PR #76; publish the same tested source to the existing preview.

## Verification record

`npm run check` passed: 134 suites / 1074 tests. iOS, Android and web exports
passed. Independent review found no material issues. Browser QA verified direct
WORKOUTS entry and the Create Workout editor/library transition. A later browser
reconnection was blocked by browser security policy; no workaround was attempted.
Workout start and muscle-map acceptance in the updated browser build remain pending.
