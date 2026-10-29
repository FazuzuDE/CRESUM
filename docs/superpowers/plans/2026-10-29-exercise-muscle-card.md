# Exercise Muscle Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add approved option3 compact per-exercise muscle summary and expanded details.
**Architecture:** Reuse MuscleMap with optional presentation height and noninteractive mode, plus an ExerciseMuscles component driven only by LibraryExercise roles. Mount it in ExerciseTechnique keyed to the viewed exact ID; preserve Progress behavior.
**Tech Stack:** React Native, Expo, TypeScript, react-native-svg, Jest.
**Spec:** `docs/superpowers/specs/2026-10-29-exercise-muscle-card-design.md`

## Global Constraints

- Preserve all data, catalog roles, artwork, attachments and accepted masks; no dependencies.
- Compact160pt/full340pt; stack below375pt or fontScale above1.2;44pt controls.
- Named textual roles for all groups, relevant missing-mask and lower-back caveats.
- No set counts, percentages, measured activation/recovery claims; EN/RU/DE/FR.
- Actual PR version only, target develop, user merges.

## Review Focus

- Exact equipment variant changes update the summary and never retain stale details.
- Large text/narrow phones wrap and scroll; no clipped muscle labels.
- SVG paths in this card are decorative, Progress paths stay selectable.
- All missing masks stay unpainted but named; lower-back remains schematic.
- Dismissal restores focus and retains movement phase, exercise and history.

### Task 1: Integrate compact per-exercise muscles and details

**Files:** Modify `components/MuscleMap.tsx`, `components/ExerciseTechnique.tsx`, `lib/theme.ts`, four `lib/i18n/locales/*/library.ts` packs, `lib/__tests__/technique-screen.test.tsx`, `lib/__tests__/exercise-muscles.test.tsx`, docs PRODUCT/DESIGN_SYSTEM/ROADMAP/DECISIONS. Create `components/ExerciseMuscles.tsx`.
**Interfaces:** Consume LibraryExercise primaryMuscles/secondaryMuscles and current local MuscleMap. Add optional height:number and onSelect callback to map, narrow input to readonly id/primary/secondary records without altering existing callers.

- [ ] Baseline focused technique/anatomy tests. Expected:pass.
- [ ] Add consumer tests for exact curl tint, details/Back/close retaining phase, missing masks, empty secondary; run before implementation. Expected:fail because card absent.
- [ ] Implement compact role-based card and expanded native details; reuse masks and focus restoration, localize copy and sync approved documentation. Expected:new consumer and existing Progress/anatomy tests pass.
- [ ] Test narrow/large-font fallback, live locale and selected equipment identity. Expected:role labels/tints follow exact selection, no stale modal.
- [ ] Commit implementation, open draft PR and stamp actual number; run npm run check and native iOS/Android exports. Expected:all pass.
- [ ] Fresh whole-branch review and final-head CI; update PR with checks and device limits, mark ready. User merges.
