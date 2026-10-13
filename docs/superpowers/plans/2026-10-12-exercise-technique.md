# Exercise Technique Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline; one fresh whole-branch review.

**Goal:** Implement the user-approved Technique mockup with sourced instructions for every current exercise and explicit image placeholders.

**Architecture:** Separate a versioned, offline technique catalog/source registry from exercise identity and logging. Shared Technique sheet owns local phase/viewer state; library browsing and selection retain distinct actions. No storage migration or generated production artwork.

**Tech Stack:** React Native, TypeScript, existing theme/AppScrollView/Modal and gesture-handler primitives.

**Spec:** User-approved mockup and explicit implementation instruction 2026-10-12; docs/PRODUCT.md and docs/DESIGN_SYSTEM.md updated with approved rules.

## Global constraints

- Base: develop adb404c964687553613f064b41fec59647e0963b; preserve all 65 IDs, aliases and historical snapshots.
- Right-hand square thumbnail and quiet Technique label. Browse title/thumbnail opens sheet; selection/Add remains explicit and never fires from Technique.
- START/FINISH placeholders, not unreviewed images. Full-screen view retains phase and returns to the same sheet.
- Setup, Movement, Key checks, Common mistakes, Sources. Clear source-derived vs adapted variant mapping; original concise summaries, no copied articles or claimed clinician approval.
- Existing English UI/content, local availability; sources alone require internet. No Expo/native launch or automatic merge.
- Weight-input work remains deferred and preserved separately.

## Review focus

- Legacy generic exercise IDs must not acquire specific grips/attachments.
- Modal dismissal from a library selection sheet must not mutate selection or lose search/filter state.
- Full-screen viewer Back/Close must return to instruction, not accidentally close the library.
- Large text/narrow phones must wrap without pushing thumbnails/actions offscreen.
- External source failures must leave instructions available and show a recoverable message.

### Task 1: Technique content and sources

Files: lib/exercise-technique/{types,sources,catalog,index}.ts; docs/EXERCISE_TECHNIQUE.md; lib/**tests**/exercise-technique.test.ts.

- [x] Research and open primary exercise references; retain titles/URLs and exact-vs-adapted boundaries.
- [x] Write/run RED tests for complete 65-ID coverage, alias resolution, unknown-ID failure, valid HTTPS source references and variant distinctions.
- [x] Implement readonly offline catalog and resolver; include real setup/movement/errors for every exercise.
- [x] Run catalog tests/typecheck. Audit reused-source paraphrase budgets and unsupported biomechanical claims.

### Task 2: Library and Technique UI

Files: components/{ExerciseLibrary,ExerciseTechnique,TechniqueArtwork,TechniqueViewer}.tsx; exercise-library/technique screen tests.

- [x] Write/run RED tests: browse opens correct guide, Technique does not add/toggle, phase persists into/back from viewer, errors/sources expand, missing art honest.
- [x] Place names left and square artwork right in quiet white cards; pale-blue filters, approved title hierarchy. Keep separate selection actions.
- [x] Implement page sheet with retained instructional state, common mistakes and source disclosure; full-screen placeholder viewer with phase controls. Never fake zoom of nonexistent images.
- [x] Reuse smooth upward navigation, accessible labels and explicit dark headings; preserve active workout and builder selection behavior.
- [x] Run affected and full tests.

### Task 3: Validation and delivery

- [x] Synchronize approved rules into product/design/roadmap/decision docs.
- [x] Verify typecheck, lint, format, tests, config/dependencies and diff cleanliness; explicitly distinguish native phone QA.
- [x] Obtain one fresh review; fix material issues with RED→GREEN regressions.
- [ ] Commit, publish focused PR against current develop, and report scope, sources and image/device limitations.

## Execution ledger

Baseline: 558 tests / 58 suites passed. Existing worktree reused; no user modifications.
Ruling: proceed inline under explicit implementation authorization; no repeated approval gate. Images remain unavailable rather than invented. UI stays English to match existing application.

Verification: 567 tests / 60 suites passed after review fixes. TypeScript, lint and Prettier checks passed; config check passed, dependency check passed in offline mode (network validation limited). No Expo/native app/server/export was launched locally. git diff --check passed.

Independent whole-branch review found two P2 issues: generic barbell row had acquired an overhand grip; Common mistakes disclosure could overflow at larger text sizes. Both corrected with regressions observed RED (2 failed / 7 passed) then GREEN (9 passed). Reviewer found no concrete selection/filter/phase/instruction-loss bug. Review was selective source verification, not qualified clinical review. Native build/device/VoiceOver/Dynamic Type acceptance remains outstanding.

Phone-style browser preview reproduces actual technique catalog content and placeholders. Local runtime checks covered all 65 entries, search, opening guide, disclosures, source links, phase/viewer return and preserved query; no native fidelity claim. Remote develop was rechecked at adb404c before publication.
