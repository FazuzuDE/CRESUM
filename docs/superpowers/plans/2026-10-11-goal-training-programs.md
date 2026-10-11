# CRESUM Goal-based Training Programs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the approved nine Gym starter-program variants, safe acceptance through START!, and a factual planned-week entry on Home.

**Architecture:** Versioned authored prescriptions → explicit library/readiness mapping → independent durable assignment → existing editable workout templates and engine. Targets are optional snapshots separate from completed values; weekly scheduling is independent of factual analytics. Keep the current app and storage architecture.

**Tech Stack:** React Native, TypeScript, existing Expo project, AsyncStorage, Jest/Jest Expo, existing theme and shared scroll/button/card components. No new dependency assumed.

**Spec:** [Approved research and prescriptions](../specs/2026-10-11-goal-training-programs-design.md), approved as an initial basis on 2026-10-11. Owning rules: [PRODUCT](../../PRODUCT.md), [DESIGN_SYSTEM](../../DESIGN_SYSTEM.md), [ROADMAP](../../ROADMAP.md), [DECISIONS](../../DECISIONS.md).

**Inspection baseline:** develop `1335f11f2f1fb9b02bf05a7273884528da5d9422`. PR #34 is a separate Profile change, still open when this plan was prepared. Inspect/rebase against the latest develop before each implementation PR; do not replay Profile changes.

## Global Constraints

- Preserve current routines, active workouts, completed snapshots, rest deadlines and offline access. No storage-wide migration, catalog-ID reinterpretation or broad rewrite.
- Gym is implicit; remove Environment only from the new flow. Read legacy Home/Both answers and the old environment step safely. Keep self-setup and later Profile personalization.
- START! accepts a shown, executable program and navigates to Home after durable success. It never starts a session or inserts completed work.
- All nine variants retain every prescribed movement. Missing mappings are explicit and block execution, never filtered out by `resolveTemplateExercises`.
- Never infer initial load from body details. Program-created actual weight/reps fields start empty; target ranges remain visible guidance. Existing legacy/manual-template defaults stay compatible.
- Cardio guidance has duration/intensity semantics and is not sent to the kg/reps engine, volume or Epley projections. A cardio logger, distance logger, calibration, AI generation, cloud sync and production artwork are separate work.
- Per-side instructions must be explicit. Do not silently double legacy volume or compare newly defined unilateral estimates with existing unspecified series. Settle actual per-side logging/analytics semantics before enabling those movements.
- Keep schedule, catalog version and assignment identity separate. Changing the authored catalog cannot rewrite an accepted assignment or the source of an active session.
- Missed days never accumulate extra volume. Changing training frequency needs checked prescriptions, not deleting sessions from the approved week. Offer manual setup when no checked alternate exists.
- Reuse theme, AppScrollView/AppFlatList, button and card patterns. English Core copy; no app-wide translation or Expo development-server/simulator launch in this task.

## Review Focus

1. **Prescription drift:** all nine goal/experience mappings and exact set/rep totals match the approved spec; source fact and adaptation remain distinguishable (Tasks 1, 2).
2. **False executable readiness:** unknown IDs, incompatible measurement and per-side ambiguity cannot produce a shortened or falsely ready workout (Tasks 1–3).
3. **Target contamination:** strength ranges do not become 10 actual reps; rest selection does not reset inputs/deadlines; targets/cardio never inflate History/Progress (Task 3).
4. **Duplicate or destructive acceptance:** double taps, crashes after any write, retries, edits and reset preserve Core and do not recreate modified/deleted user routines (Task 4).
5. **Incorrect onboarding/calendar behavior:** resumed environment steps, Profile re-entry, DST, A/B alternation, missed days and START!/Home all preserve their documented meaning (Tasks 5, 6).

## Delivery and execution

This is a sequence of focused PRs, not a single large patch. Task 1 is the next library step. Tasks 2 and 3 can be prepared behind readiness checks, but acceptance cannot ship until their prerequisites pass. Tasks 4–6 share persistence and routing contracts, so native sequential execution is a practical default. Review this plan and select execution method before starting code.

No task here launches Expo. `npm run check` is validation, not a development server; run native export in GitHub CI. Physical-phone review remains explicit outstanding evidence.

### Task 1: Add the required library movements through verified variant packs

**Files:** Modify `lib/exercise-library.ts`, and only necessary entries in `lib/exercise-taxonomy.ts`, `lib/exercise-catalog-adapter.ts`, `docs/EXERCISE_LIBRARY.md`, `docs/EXERCISE_BIOMECHANICS.md`. Extend `lib/__tests__/exercise-library.test.ts`, `lib/__tests__/exercise-catalog-adapter.test.ts`; create `lib/__tests__/starter-program-variants.test.ts`.

- [ ] Read `docs/EXERCISE_LIBRARY.md` and `docs/EXERCISE_ASSETS.md` before metadata work. Reconfirm the spec's 13 existing mappings against current catalog IDs; legacy broad grip/position remains unspecified.
- [ ] Define the exact Gym configuration for Standing Anti-rotation Press, Step-up, Dumbbell Glute Bridge **on the floor**, and Lying Barbell Triceps Extension from the cited movements. Record equipment, support, laterality, mechanics and stable IDs. Resolve source ambiguity through reviewed variant specifications before adding a mapping; do not invent asset mechanics.
- [ ] Add targeted tests first: IDs resolve uniquely, old aliases retain meaning, floor bridge is not `barbell-hip-thrust`, lying extension is not overhead cable extension, old snapshots/series remain unchanged. Existing catalog count assertions must expand without weakening identity checks.
- [ ] Add the four reviewed resistance entries with existing placeholder artwork support. Walking/cycling remain typed program guidance until their dedicated catalog/accounting work; do not add fake kg/reps records. Broader “maximum exercise coverage” follows separate packs, not arbitrary duplicates in this PR.
- [ ] Coordinate release of new per-side entries with Task 3's actual-logging contract: metadata review alone does not validate their execution through the kg/reps engine. Document whether this pack can ship independently or must remain pending that contract.
- [ ] Run `npm test -- --runTestsByPath lib/__tests__/exercise-library.test.ts lib/__tests__/exercise-catalog-adapter.test.ts lib/__tests__/starter-program-variants.test.ts`, then `npm run check`.
- [ ] Review exact variant mechanics and record any unresolved mapping as a release blocker. Commit: `Add verified movements required by starter programs`.

### Task 2: Author the traceable nine-program catalog and readiness projection

**Files:** Create `lib/training-programs/model.ts`, `sources.ts`, `catalog.ts`, `selectors.ts`, `readiness.ts` under that directory; create `lib/__tests__/training-programs.test.ts`.

**Contracts:** `ProgramDefinition` has immutable `id`, `revision`, goal, experience, environment `gym`, ordered workout-day definitions, one/two-week schedule and source references. Each `ProgramMovement` retains authored movement identity/name, library mapping or `needs_catalog`, sets, rep range, rest range, per-side instruction and adaptation provenance. `CardioGuidance` uses minutes/intensity, never set fields. `selectProgram(goal, experience)` returns the exact variant or explicit unavailable result. `projectProgramReadiness(program, library)` returns `ready` or a complete list of blockers; it does not edit prescriptions. No React/storage dependency.

- [ ] Write table-driven tests for all 3 × 3 combinations before authoring the catalog. Freeze assertions for counts, order, rep bounds and source references rather than merely testing selector existence.
- [ ] Add the nine spec variants. Checks include Build muscle F = 16 beginner / 21 some-experience sets per session; U = 19 and L = 15 experienced sets. Beginner strength alternates A/B/A then B/A/B. General fitness is G/H with per-side overrides, not a renamed muscle template.
- [ ] Add the nine primary-source entries S1–S9 from the five organizations, dates and extracted-fact/adaptation distinctions. Full ACSM paper/blocked NSCA PDF must not be marked as read. Weights remain unspecified; progression is explainable manual guidance, not automatic scheduled increases.
- [ ] Keep missing movements in data. Assert that removing any required library mapping makes the whole program non-executable without reducing set totals. Cardio stays in separate guidance; no generated template IDs are treated as exercise IDs.
- [ ] Preserve immutable catalog revisions for accepted plans. Unsupported alternate frequency returns an unavailable checked-variant result with manual setup available; it must not discard sessions. Additional frequency prescriptions require spec refinement before rollout.
- [ ] Run `npm test -- --runTestsByPath lib/__tests__/training-programs.test.ts`, then `npm run check`. Commit: `Add versioned goal-based starter program catalog`.

### Task 3: Support planned targets without rewriting actual logging

**Files:** Modify `lib/workout-model.ts`, `lib/planned-exercise.ts`, `lib/workout-templates.ts`, `lib/workout-repository.ts`, `lib/workout-engine.ts`, `components/Workout.tsx`, `components/TemplateEditor.tsx`; add `lib/__tests__/workout-prescription.test.ts`; extend existing workout-engine, workout-templates, workout-duplicate, workout-screen and workout-metrics tests.

**Contracts:** Optional `ExerciseTarget` on planned entries and workout-exercise snapshots carries rep bounds, rest bounds, per-side guidance and program provenance. Core actual set fields retain their meaning. Parser validates and retains optional targets under schema 1; absent targets parse exactly as before. `startWorkout` snapshots a target; it never looks up a mutable future catalog to repair an old session. Exact per-side actual fields/metric exclusion rules must be specified before enabling unilateral mappings; a display label alone is insufficient.

- [ ] Write failure tests: strength 3–5 target creates empty actual reps, not `10`; completing an empty row remains invalid; partial input/restart retains target and actual values independently. Old templates keep their existing defaults. Target values alone contribute zero completed sets, volume and estimated 1RM.
- [ ] Add target validation, copy/update/duplicate behavior, repository round trips and legacy fixtures. Editing planned values never mutates an active or historical snapshot. Corrupt new target data must not silently reset existing actual data.
- [ ] Specify and test per-side actual logging: both sides must be represented/confirmed without treating seconds or combined reps as a single measured 1RM. Preserve legacy calculations and expose unsupported estimates explicitly. Update affected metric projections only for the new semantics; no retrospective multiplication of saved volumes.
- [ ] Show target range and side instruction above/alongside the existing numeric inputs. Program entry initializes actual fields empty. Add-set carries the target while preserving entered prior values appropriately; manual edits remain unrestricted and actual reps outside a target are recorded truthfully.
- [ ] Apply rest using the just-completed exercise before automatic advancement. Recommended bounds are guidance; use an explicit user-adjustable starting duration within them. Active manual override, existing rest deadline and restart/extend/skip behavior survive navigation and reordering. Never reset a running timer when selecting another exercise.
- [ ] Keep warm-up instructions separate from prescribed working-set counts. No automatic warm-up/calibration or new performed rows.
- [ ] Run `npm test -- --runTestsByPath lib/__tests__/workout-prescription.test.ts lib/__tests__/workout-engine.test.ts lib/__tests__/workout-templates.test.ts lib/__tests__/workout-duplicate.test.ts lib/__tests__/workout-screen.test.tsx lib/__tests__/workout-metrics.test.ts`, then `npm run check`. Commit: `Separate workout prescription targets from actual results`.

### Task 4: Add recoverable, idempotent program acceptance

**Files:** Create `lib/training-programs/assignment.ts`, `repository.ts`, `acceptance.ts`; modify `lib/workout-store.ts`, `lib/local-data-reset.ts`, `app/index.tsx`; create `lib/__tests__/training-program-acceptance.test.ts`; extend `lib/__tests__/local-data-reset.test.ts`, `local-data-reset-screen.test.tsx`.

**Contracts:** `ProgramAssignment` retains acceptance ID, program ID/revision, exact accepted prescription/schedule snapshot, template ownership links and start date. A separate versioned key `cresum_training_program_v1` contains committed assignment plus a pending acceptance journal. `acceptProgram(...)` and `recoverProgramAcceptance(...)` return explicit success/pending/conflict results. `WorkoutStore.installProgramTemplates(...)` installs the entire checked batch durably through the existing repository queue, preserving unrelated templates, activeWorkout and history.

- [ ] Write injected-failure tests before implementation: two START! taps, failure/crash after each storage write, restart/retry, existing active session, edited/deleted generated templates, missing library item, storage corruption and reset during an operation.
- [ ] Define deterministic generated template IDs from the durable acceptance ID and program workout-day key. Repeated F/U/L sessions reuse the relevant routine, not duplicate templates per calendar occurrence. A genuinely new accepted assignment gets a new ID and does not replace old user routines.
- [ ] Use a documented roll-forward journal, not claimed multi-key atomicity: (1) persist pending intent with stable IDs and expected template payloads; (2) install all templates in one workout-document save; (3) persist onboarding completion; (4) commit assignment/clear pending journal; (5) navigate. Serialize acceptance with template writes/reset. A failed await must not claim success.
- [ ] Reconcile pending work on every app load, including when custom templates already bypass onboarding. Retry reuses the intent; matching installed payloads are recognized rather than re-created. Differing user edits/deletions become an explicit conflict requiring review, never overwritten or resurrected. Do not gate existing Core behind damaged program storage.
- [ ] Ensure exact prescription snapshots/version links survive catalog revisions. No active workout/History write during acceptance. User re-personalization requires explicit acceptance of the new proposal; Cancel before START! leaves assignment/templates unchanged.
- [ ] Add the new key and pending writes to reset backup/delete/verify/recovery ordering. Invalidate pending async callbacks by the existing epoch/reset pattern so late completion cannot restore a deleted assignment or navigate after reset.
- [ ] Run `npm test -- --runTestsByPath lib/__tests__/training-program-acceptance.test.ts lib/__tests__/local-data-reset.test.ts lib/__tests__/local-data-reset-screen.test.tsx`, then `npm run check`. Commit: `Persist starter program acceptance with safe retry and recovery`.

### Task 5: Project the planned week independently of actual Home statistics

**Files:** Create `lib/training-programs/schedule.ts`, `components/TrainingProgramWeek.tsx`; modify `components/HomeDashboard.tsx`, `lib/home-dashboard.ts`, `lib/workout-model.ts`, `lib/workout-engine.ts`, `lib/workout-repository.ts`, `lib/workout-store.ts`, `app/index.tsx`; create `lib/__tests__/training-program-schedule.test.ts`, `training-program-home.test.tsx`; extend existing Home dashboard tests.

**Contracts:** `projectProgramWeek(assignment, history, localDate)` returns planned slots, linked factual completion, rest/cardio guidance and the next eligible slot. Optional immutable program-slot context is supplied only when starting that slot and stored with the session. Existing `start(template)` callers work unchanged. A template name alone never proves slot completion.

- [ ] Write schedule tests for a start on any weekday, month/year rollover and DST using calendar dates rather than `24h` millisecond offsets. Default session offsets preserve the spec: full body/strength 0/2/4, upper/lower 0/1/3/4, general fitness 0/3.
- [ ] Test the two-week strength alternation, schedule-day adjustment with recovery constraints, rest days, missed sessions and multiple real workouts per date. No catch-up double volume, automatic completed marks or hidden workout omission. Beginner reduced first-session volume remains a shown adjustment, not a destructive catalog rewrite.
- [ ] Add a separate planned-week module using existing DashboardGrid/theme patterns. Current actual Monday–Sunday completion marks, four-week stats and latest-workout projection remain factual. Cardio target minutes are labelled guidance and do not appear in kg/1RM/count totals.
- [ ] Preserve Resume as the primary action when any session is active. Home's planned Start explicitly starts one checked slot; START! in onboarding never calls it. Existing templates/manual starts stay available. Missing/deleted assignment routine shows honest repair/manual options, not automatic recreation.
- [ ] Run `npm test -- --runTestsByPath lib/__tests__/training-program-schedule.test.ts lib/__tests__/training-program-home.test.tsx lib/__tests__/home-dashboard.test.ts lib/__tests__/home-dashboard-screen.test.tsx`, then `npm run check`. Commit: `Show accepted training weeks without changing factual Home statistics`.

### Task 6: Connect streamlined onboarding and START! to acceptance and Home

**Files:** Modify `components/Onboarding.tsx`, `lib/onboarding.ts`, `lib/onboarding-repository.ts`, `app/index.tsx`; extend `lib/__tests__/onboarding.test.ts`, `onboarding-screen.test.tsx`, `onboarding-fixture.ts`; create `lib/__tests__/starter-program-flow.test.tsx`.

- [ ] Add tests for Goal → Experience → optional Body details → completion. Resume a persisted environment step at Body details; Back returns to Experience. Retain Home/Both legacy values until explicit new Gym acceptance. No mandatory equipment/body-data questions.
- [ ] Add a compact factual summary of the actual proposed variant and access to the complete week/schedule before acceptance. Distinguish blocked/not-ready, loading, ready and save-error states. Do not show “You're ready to start” with unresolved mappings.
- [ ] Replace Go to Home with **START!** in the accepted-program flow and connect it to Task 4. Disable repeat acceptance while saving; retain the proposal and Retry on failure. Success selects Home and creates no active session. The manual self-setup path still completes only after its existing durable save.
- [ ] Verify Profile re-entry proposes rather than silently replaces a program. Existing users bypass first-run gating, can cancel, and preserve custom/active/history data. Adjust schedule days before acceptance; frequency choices expose only checked alternatives, with manual setup for unsupported counts.
- [ ] Reuse the app-wide smooth up-arrow and light theme; verify all content/actions remain reachable at compact width and larger text, with keyboard/VoiceOver/Reduce Motion behavior. No fake name/statistics or demographic-derived load.
- [ ] Run `npm test -- --runTestsByPath lib/__tests__/onboarding.test.ts lib/__tests__/onboarding-screen.test.tsx lib/__tests__/starter-program-flow.test.tsx`, then `npm run check`. Commit: `Accept goal-based programs through START and open Home`.

## Release acceptance and checkpoint

- [ ] Review the full nine-variant fixtures against the approved prescriptions, source/mapping registry and per-side semantics. Mark any unsupported frequency/accounting state as unavailable rather than ready.
- [ ] Run `npm run check` and `git diff --check` on the final integration branch. Verify GitHub CI including `npm run export:check` before reporting readiness. No development server is needed for these checks.
- [ ] Record phone-review evidence separately: all nine choices, completion to Home, active Resume, logged targets/actuals/rest, offline restart, failed-write retry, smooth scrolling, large text and accessibility. Do not claim device acceptance from Jest or chat preview.
- [ ] Update the owning documents with implemented stage/status and remaining limitations. Open focused PRs to develop and link verification evidence. Do not merge automatically or claim a docs-only PR implements programs.

## Self-review record

Plan reviewed inline against the inspected engine, parser, store, onboarding, reset and Home boundaries. The existing unknown-ID filtering and fixed `reps: '10'` are explicit blockers, not reused as safe program behavior. The separate storage writes require recovery, and custom-template onboarding bypass must not skip that recovery. Catalog mapping, per-side metric semantics and alternate-frequency prescriptions remain visible prerequisite decisions; no artwork, AI or sync scope is added implicitly.
