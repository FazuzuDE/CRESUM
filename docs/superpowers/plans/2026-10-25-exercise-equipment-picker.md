# Exercise Equipment Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship exact-attachment illustrations and contextual selection, then preserve attachment-specific set blocks inside one workout card.

**Architecture:** Keep flat canonical exercise snapshots for logging and analytics. An explicit optional group snapshot provides presentation grouping; a reviewed compatibility registry governs selection and a local manifest resolves exact-variant imagery. Extend strict serialization boundaries before exposing grouped writes.

**Tech Stack:** React Native + Expo + TypeScript; existing state/repository, localization, sheet and image primitives; existing PostgreSQL/Edge contracts where serialization requires extension.

**Spec:** `docs/superpowers/specs/2026-10-25-exercise-equipment-picker-design.md`

**Status:** Proposed for review. UX is approved; this plan has not been executed. Each task is a focused commit/PR; no automatic merge or live backend deployment.

## Global Constraints

- React Native + Expo + TypeScript; no new dependency is planned.
- New messages, catalog/technique labels and spoken labels in EN/RU/DE/FR.
- Preserve white artwork backgrounds and existing light UI; 44-point targets and 320/390-point checks.
- Never repurpose generic or V-handle IDs; keep exact-variant strength records separate.
- Existing 1–20 set limit per exact variant block; no duplicate variants within a new group.
- Without additional accessories is available only for a reviewed optional policy.
- No deployed remote migration is authorized by this documentation step.
- No muscle-load coefficients, guessed medium/wide ergonomic configurations or inferred production asset approval.

## Review Focus

- Unmapped exercise policy must not claim that equipment is unnecessary — Task 2.
- A variant already outside the new group must not be moved or absorbed — Task 3.
- Browsing/dismissing a picker or retrying a failed save must preserve drafts and completed sets — Tasks 3 and 5.
- Backup, old transfer versions and cloud normalization must not silently strip new metadata — Task 4.
- An asset missing for the selected variant/model/phase must not fall back to a related configuration — Task 1.

## Task 1: Exact compact variant and local image resolution

**Files:** Modify `lib/exercise-library.ts`, `lib/exercise-catalog-adapter.ts`, `lib/exercise-variant-model.ts`, `lib/exercise-technique/catalog.ts`, `components/TechniqueArtwork.tsx`, `components/ExerciseArtwork.tsx`, `docs/EXERCISE_BIOMECHANICS.md`, `docs/EXERCISE_ASSETS.md`; create `lib/exercise-artwork.ts`, `assets/exercises/lat-pulldown-close-neutral-ergonomic-handle/` and `lib/__tests__/exercise-artwork.test.ts`; update existing catalog/technique tests and localized generated catalogs.

**Interfaces:** Export `resolveExerciseArtwork(variantId: string, phase: 'start' | 'finish', model: 'male' | 'female'): ImageSourcePropType | null` and `resolveAttachmentArtwork(variantId: string): ImageSourcePropType | null` from `lib/exercise-artwork.ts`. Resolve static local requires; null means an honest placeholder.

- [ ] Verify the three source SHA-256 hashes against the spec. Record candidate/approval scope and complete exact-variant pair/thumbnail review. If a material error remains, keep that output unavailable and report the concrete failure; do not fabricate QA approval.
- [ ] Add failing assertions: new exact ID resolves separately from the V-handle; generic/legacy IDs keep unspecified semantics; compact image lookup does not resolve for a wide bar, V-handle or unproduced Female pair.
- [ ] Run `npm test -- --runTestsByPath lib/__tests__/exercise-artwork.test.ts lib/__tests__/exercise-catalog-adapter.test.ts lib/__tests__/exercise-technique.test.ts`; confirm the new assertions fail for the intended missing behavior.
- [ ] Add `lat-pulldown-close-neutral-ergonomic-handle` with explicit ergonomic attachment and neutral close grip. Preserve qualitative lats/biceps/upper-back roles; add reviewed technique and sources rather than cloning V-handle geometry.
- [ ] Commit separately optimized START, FINISH and attachment assets only after their review, recording source hashes/export settings. Connect the local resolver to artwork boundaries and retain existing placeholders where lookup is null.
- [ ] Add EN/RU/DE/FR catalog and technique content through existing generators. Run the focused tests, `npm run typecheck` and `npm run i18n:check`; inspect START/FINISH and thumbnail at phone size. Commit the exact variant/image slice without claiming grouped sets are implemented.

## Task 2: Reviewed equipment policy and reusable picker

**Files:** Create `lib/exercise-equipment.ts`, `components/ExerciseEquipmentRow.tsx`, `components/ExerciseEquipmentSheet.tsx`, `lib/__tests__/exercise-equipment.test.ts`, `lib/__tests__/exercise-equipment-screen.test.tsx`; modify `components/ExerciseTechnique.tsx`, `components/TemplateEditor.tsx`, `lib/i18n/locales/{en,ru,de,fr}/editor.ts` and `lib/i18n/locales/{en,ru,de,fr}/program-technique.ts`.

**Interfaces:** `equipmentPolicyFor(exerciseId: string): ExerciseEquipmentPolicy | null`; `ExerciseEquipmentPolicy` has contextual label, `requirement: 'required' | 'optional' | 'not-applicable'` and reviewed `choices: { id: string; variantId: string }[]`. A `none` choice requires an explicit valid base variant. Row props: `{ exerciseId: string; onPress?: () => void }`. Sheet props: `{ policy: ExerciseEquipmentPolicy; selectedVariantId: string; onSelect: (variantId: string) => void; onClose: () => void }`.

- [ ] Write tests covering required policies rejecting `none`, optional baseline resolving to a real base variant, unmapped policy returning null, single-choice/non-applicable rows remaining noninteractive and choices never resolving to unknown IDs.
- [ ] Test selection/dismissal, selected check/semantic state, platform back handling and focus restoration. Assert the separate permanent width-chip selector is absent.
- [ ] Run both new test files and confirm the new behavior fails before implementation.
- [ ] Implement the pure registry and sheet using existing React Native Modal/safe-area/theme/scroll primitives. Initial offered options are the new reviewed compact ergonomic variant and existing specifically reviewed V-handle/wide-pronated-bar variants; display their different attachment/grip names. Do not offer unreviewed medium/wide ergonomic examples.
- [ ] Connect contextual information in Technique and draft selection in the editor; standalone Library browsing does not mutate a workout. Render unavailable artwork honestly. Add all four locales.
- [ ] Run the two test files, typecheck and localization checks; inspect 320/390-point and enlarged text layouts, including a longer compatible-choice fixture. Commit the reusable picker slice.

## Task 3: Ordered group and individual-prescription domain

**Files:** Modify `lib/workout-model.ts`, `lib/planned-exercise.ts`, `lib/workout-templates.ts`, `lib/workout-engine.ts`, `lib/workout-store.ts`; create `lib/exercise-groups.ts` and `lib/__tests__/exercise-groups.test.ts`; update planned/template/engine/store tests.

**Interfaces:** Add `ExerciseGroupSnapshot = { id: string; familyId: string; name: string }`, `PlannedSet = { id: string; weight?: string; reps?: string }`; optional `exerciseGroup?: ExerciseGroupSnapshot` on PlannedExercise/WorkoutExercise and `plannedSets?: PlannedSet[]` on PlannedExercise. Export `projectExerciseGroups(exercises: readonly WorkoutExercise[]): { groupId: string; name: string; indices: number[] }[]` and `validateExerciseGroupMembers(entries: readonly PlannedExercise[]): boolean`. Add `appendExerciseGroup(session: WorkoutSession, entries: readonly PlannedExercise[], library: readonly LibraryExercise[], idFactory?: IdFactory): WorkoutSession` as an all-or-nothing pure operation.

- [ ] Write assertions: three distinct variants with two rows each materialize six sets; supplied presets override legacy defaults, omitted values use existing target/default rules without invented zero; inconsistent count/duplicate row IDs/mixed or noncontiguous groups reject; legacy plans without new fields retain existing defaults. New writes check family membership; historical snapshots with later-unavailable catalog entries remain readable.
- [ ] Cover append-to-existing-block without changing prior values/order/completion, a variant outside the draft group rejecting before mutation, and existing historical/active duplicate snapshots remaining readable.
- [ ] Cover group move/remove/current-index behavior and an interrupted/failed atomic group append preserving the old session. Existing two-sided/target/program provenance must survive.
- [ ] Run the new group tests plus existing engine/template tests; confirm the intended missing-behavior failures.
- [ ] Implement optional types, strict group/preset validation, independent deep copies and explicit grouping projection. Keep each exact library ID and count each set once; do not match by display name. Treat a repeated addition to the same exact draft variant as additional rows within its existing block.
- [ ] Adapt materialization/start and store append transactions to commit the prepared group once. Do not expose grouped writes until Task 4 roundtrips are available. Run focused tests and typecheck, then commit the domain slice.

## Task 4: Lossless local, shared-plan and cloud roundtrips

**Files:** Modify `lib/workout-repository.ts`, `lib/local-backup.ts`, `lib/history-import.ts`, `lib/sync/history-mapper.ts`, `lib/sync/model.ts`, `lib/workout-sharing/{contract,adapter,import}.ts`, `supabase/functions/_shared/plan-contract.ts`, affected existing sync/publishing server code identified from its imports, `supabase/tests/history-sync.sql`, `supabase/tests/workout-sharing.sql`; create `lib/__tests__/exercise-group-roundtrip.test.ts`. A new migration filename is generated at execution with `supabase migration new exercise_attachment_groups`, never guessed in advance.

**Interfaces:** Existing local read/write/import and `encodeHistoryWorkout`/`decodeHistoryWorkout` preserve optional group snapshots. Shared contracts accept old V1 and new V2; V2 includes optional group and individual planned rows. `exportSharedPlan` returns V1 for legacy-compatible plans and V2 when new fields are required; `sharedPlanDraft` accepts their validated union. If weights are excluded, omit every default and per-row weight; do not substitute zero or disclose a hidden weight.

- [ ] Write roundtrip assertions for template copy/edit/start/reopen, completed History import/backup/restore and cloud encode/decode, retaining IDs/order/weights/reps/group names. Assert old V1 fixtures still load unchanged.
- [ ] Test V2 share import/export, complete weight omission when includeWeights is false, unknown-version/unknown-variant rejection and 64 KiB transfer limits. Unsupported deployment capability must visibly block a new-format publication, never silently downgrade it.
- [ ] Run the new roundtrip tests and existing repository/backup/history-mapper/sharing-contract tests; confirm failures demonstrate actual field loss/version rejection.
- [ ] Extend the existing validators/copiers/normalizers before enabling writes. Read current Supabase docs/changelog and CLI help at implementation time. Prepare the additive database/RPC contract and generated migration locally, preserving ownership/revisions/idempotency/conflict fingerprints and old records. Do not deploy it in this task.
- [ ] Update server/shared validators and client capability handling so old V1 remains supported and unsupported V2 cannot be flattened. A backend without reviewed group support keeps grouped publication/sync unavailable with truthful pending/retry status; offline logging and local backup remain usable. Do not disable legacy sync.
- [ ] Run focused TS tests, existing PostgreSQL contracts against a disposable local database and affected checks. Commit the serialization slice with a separate deployment/activation checklist; no live data mutations.

## Task 5: Configure and log one card with attachment blocks

**Files:** Modify `components/TemplateEditor.tsx`, `components/Workout.tsx`, `components/WorkoutHistory.tsx`, `components/WorkoutTemplates.tsx`; create `components/ExerciseAttachmentBlock.tsx`, `lib/__tests__/exercise-attachment-workflow.test.tsx`; update existing workout/history/template screen tests and all affected EN/RU/DE/FR messages.

**Interfaces:** `ExerciseAttachmentBlock` consumes an exact child WorkoutExercise and its session index; edit/complete callbacks continue addressing that child/set. Use Task 3's group projection for one-card presentation and Task 2's picker for draft selection. Existing save callbacks receive the full validated grouped draft once.

- [ ] Test configuring two sets for each of three reviewed test-fixture variants, preserving separate unsaved values while browsing/dismissing, then committing one card/six sets. Fixtures do not make unreviewed production configurations selectable.
- [ ] Test Save/Cancel/retry isolation, built-in-plan editing as personal copy, duplicate-outside-group message and atomic active-workout Add Exercise. Existing block variants are not replaced during logging.
- [ ] Test attachment-change cues, correct child advancement/rest after completion, per-set edits, group move/removal and restart recovery. Assert previous-performance/strength series remain variant-specific and total/factual muscle counts see six sets, not eighteen.
- [ ] Run new and affected screen tests; confirm the initial missing UI behavior fails.
- [ ] Implement row -> picker -> retained draft -> block addition -> final group save. Show attachment headers and exact images/placeholders inside one station card; no selection may reassign completed sets. Keep individual logging inputs directly editable.
- [ ] Run focused domain/screen/analytics tests, typecheck and localization checks; commit the end-to-end UI slice. Backend-dependent pathways remain capability-gated until separately deployed and verified.

## Task 6: Integration and review evidence

**Files:** Update `docs/PRODUCT.md`, `docs/DESIGN_SYSTEM.md`, `docs/ROADMAP.md`, `docs/DECISIONS.md`, `docs/EXERCISE_ASSETS.md` and this plan's checkboxes with actual evidence only.

- [ ] Run `npm run check` and `npm run export:check`. Record exact results; fix regressions caused by these changes and distinguish unrelated baseline failures.
- [ ] Inspect the actual exported app at 320/390px in EN/RU/DE/FR: picker close/back/focus, static/not-applicable states, unavailable images, groups, set entry, retry, History and variant records. Verify bundle images decode offline. Keep physical gesture/screen-reader/device acceptance explicitly open if unavailable.
- [ ] Review the whole branch against the spec, especially optional-none policy, variant identity, copy/import/sync fidelity and double-counting. Resolve findings before reporting completion.
- [ ] Open focused PRs targeting develop with implementation, checks and remaining deployment/device gates. Do not merge automatically. Do not claim the complete feature while any user-facing stage is only a prototype.
