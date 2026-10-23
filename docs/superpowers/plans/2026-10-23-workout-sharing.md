# Workout Sharing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Share a saved workout by link/QR and import a curated library plan without requiring a student account.

**Architecture:** One versioned transfer contract and durable local importer serve
both public snapshot links and curated entries. Supabase owns author publications
and revocation, independently of private history sync. Network actions remain gated
until domain, service and device acceptance; local Core stays available.

**Tech Stack:** Existing React Native/Expo/TypeScript, AsyncStorage repository,
Supabase/Postgres/Edge Functions, react-native-svg, typed offline i18n.

**Spec:** `docs/superpowers/specs/2026-10-23-workout-sharing-design.md` (approved 2026-10-23).

## Global Constraints

- No student account binding; anyone possessing the link can forward it.
- Author sign-in for publish/revoke; no privileged trainer role or coach dashboard.
- No completed history/profile transfer, no automatic recipient copy updates.
- Maximum 64 KiB payload, 120-character title, 1–50 distinct exercises.
- Use current stricter domain limit: 1–20 sets; reps 1–1000, rest 0–3600 seconds,
  finite kg 0–2000. Preserve exact decimal strings, never numeric-round weights.
- QR token entropy at least 128 bits; hash stored server-side; no tokens in logs.
- New copy and accessibility labels in EN/RU/DE/FR together; release flags unchanged.
- Use Node 22.16+/npm 10, existing tokens, 44px minimum targets and active-session protections.
- Read current official Supabase changelog/docs and Expo package docs before coding
  integrations; pin compatible dependencies and retain lockfile.

## Review Focus

- Crash after save/before start: recovered plan exists once and retry does not duplicate it (Task 2).
- Locale change mid-preview: identity, inputs and destination remain unchanged (Task 3).
- Token in diagnostic URL: errors and telemetry redact the complete secret (Task 5).
- Backup origin metadata from another installation: no incorrect deduplication or author access (Task 2).
- QR arriving while app loads/restores: defer preview until local-data gate is ready (Task 6).

## File responsibilities

New `lib/workout-sharing/` modules own DTO validation, import, endpoint client,
links and catalog cache. New focused components own PlanPreview, SharePlanSheet,
PlanLibrary and PlanScanner. `app/index.tsx` only wires these to existing screen
state; `app/_layout.tsx` retains initialization gates. New `app/shared.tsx` hosts
the public preview route. Existing workout model/store/repository/backup validators
receive only compatible planned-target/origin extensions. No broad app rewrite.

### Task 1: Transfer contract and provenance-free planned targets

**Files:** Create `lib/workout-sharing/contract.ts`, `lib/workout-sharing/adapter.ts`,
`lib/__tests__/workout-sharing-contract.test.ts`; modify `lib/workout-model.ts`,
`lib/planned-exercise.ts`, `lib/workout-templates.ts` and target consumers.

**Interfaces:** `SharedPlanV1` contains schemaVersion=1, title and ordered exercises
with exerciseId, sets, optional weightKg:string and target:{repMin,repMax,restMin,
restMax,perSide?}. `parseSharedPlan(input: unknown): SharedPlanV1` throws a semantic
validation error; `exportSharedPlan(template: WorkoutTemplate, includeWeights: boolean): SharedPlanV1`;
`sharedPlanDraft(plan: SharedPlanV1): TemplateDraft` returns independent arrays.

- [x] Write tests asserting title 120 accepted/121 rejected; 20 sets accepted/21 rejected;
      50 IDs accepted/51 rejected; duplicate canonical aliases rejected; 64 KiB ceiling;
      invalid UTF-8/unknown version/NaN/negative bounds/unknown ID/duration ID rejected.
- [x] Run `npm test -- --runTestsByPath lib/__tests__/workout-sharing-contract.test.ts`; confirm failure before implementation.
- [x] Implement allowlisted serializer and client validator; shared server schema validator
      must use the same bounds. Strip all provenance and state fields; default absent
      planned entries to the existing engine default of three sets, without invented rep/rest targets.
- [x] Separate optional provenance from numeric `PlannedTarget` without weakening
      existing official `ExerciseTarget` validation. Update consumers to distinguish
      authored targets from evidence/program targets; accept rest=0 for authored targets.
- [x] Run contract, planned-exercise, template and program tests plus typecheck; commit Task 1.

### Task 2: Durable import, deduplication and backup compatibility

**Files:** Create `lib/workout-sharing/import.ts`, `lib/__tests__/workout-sharing-import.test.ts`;
modify `lib/workout-store.ts`, `lib/workout-model.ts`, `lib/local-backup.ts` and repository validators.

**Interfaces:** `PlanOrigin={publicationId:string;version:number}` is optional on
templates. `WorkoutStore.importSharedPlan(plan: SharedPlanV1, origin: PlanOrigin,
options?: {duplicate?:boolean}): Promise<{template:WorkoutTemplate;created:boolean}>`
resolves only after durable save. Reuse existing repository serialization.

- [x] Write tests for repeat import→one template; explicit duplicate→two; edited copy
      untouched; delete/reimport; persistence rejection→no success; concurrent imports;
      reload after save/before start→same ID; old/new backups round-trip origin.
- [x] Run the new import test and confirm failure.
- [x] Implement serialized atomic validation/deduplication/ID allocation/save; do not use
      optimistic fire-and-forget `persist` as proof of a durable import. Failed writes
      keep History and active session intact and permit safe retry.
- [x] Validate restored origin as data only; dedup uses publication ID/version and
      actual existing templates, never cross-device local IDs. Update full backup
      export/restore validators; additive history import never imports templates.
- [x] Run importer/store/local-backup tests and typecheck; commit Task 2.

### Task 3: Saved-plan actions and recipient preview

**Files:** Create `components/workout-sharing/PlanPreview.tsx`,
`lib/__tests__/workout-sharing-preview.test.tsx`; modify `app/index.tsx`,
`lib/i18n/messages.ts`, four `lib/i18n/locales/{en,ru,de,fr}/sharing.ts` files.

**Interfaces:** `PlanPreview` consumes validated plan+origin, import callback from
Task 2 and current-session status; exposes Save for later, Add and start and Open
saved copy. Start reuses existing engine entry, never sharing's own session engine.

- [x] Write interaction tests: first-screen wide Start plus square Share; imports
      finish before start; failed save never starts; failed start retries saved ID;
      active session offers Continue/Cancel without replacement; repeated taps single-flight.
- [x] Confirm failure, then implement focused UI and wiring. Keep Add exercise above
      action row and accessibility name on icon-only Share. Locale switching retains
      preview and import state; test all four locale message contracts.
- [x] Run preview tests, existing template-screen tests, typecheck and `npm run i18n:check`;
      classify only actual new non-user source strings with explicit reasons; commit Task 3.

### Task 4: Author publications and public retrieval boundary

**Files:** Create `supabase/migrations/20261023_workout_sharing.sql`,
`supabase/functions/shared-plan/{index.ts,handler.ts}`, `supabase/tests/workout-sharing.sql`,
`lib/__tests__/shared-plan-server.test.ts` (use final timestamp migration naming convention).

**Interfaces:** `POST shared-plan` publishes validated snapshot for JWT owner with
idempotency key; response `{publicationId,version,token}`. `GET shared-plan?token=...`
returns `{origin,plan}` without author PII; `DELETE shared-plan` revokes owner's ID;
`GET shared-plan/library` returns curated metadata and snapshot identifiers only.

- [x] Write policy/handler tests: anonymous cannot enumerate; other author cannot
      read/manage owner records; token-only read succeeds; revoked/missing token
      returns indistinguishable unavailable response; public callers cannot curate.
- [x] Run tests and confirm failure, then implement immutable publications, hashes,
      owner grants/RLS and shared transfer validation. Use cryptographic tokens.
      Repeated unchanged owner requests reuse the same publication and URL: store
      recoverable token encrypted server-side with external secret, never plaintext
      in publicly reachable relations. Missing encryption config disables publishing.
- [x] Enforce persisted per-author publish quota (30/hour, 500 active), per-source
      public-read limit (120/minute), 64 KiB body limit and fail-closed limit storage.
      Do not rely on in-memory counters in distributed functions. Idempotency avoids
      quota consumption on retries. Do not touch private history tables.
- [x] Run SQL tests using existing database CI bootstrap plus handler tests; inspect
      grants manually, test token redaction; commit Task 4. No live production migration.

### Task 5: Publication client, QR and sharing sheet

**Files:** Create `lib/workout-sharing/{client,links}.ts`,
`components/workout-sharing/SharePlanSheet.tsx`,
`lib/__tests__/workout-sharing-client.test.ts`, `lib/__tests__/workout-sharing-links.test.ts`;
modify existing public configuration seam and `.env.example` if tracked.

**Interfaces:** `SharingClient.publish(plan: SharedPlanV1):Promise<PublishedPlan>`,
`resolve(token:string):Promise<{origin:PlanOrigin;plan:SharedPlanV1}>`,
`revoke(publicationId:string):Promise<void>`; `PublishedPlan` includes origin, URL.
`parsePlanLink(url:string, allowedHost:string):{token:string}|null` validates HTTPS host/path.

- [x] Test unsigned author, network timeout/retry idempotency, stale response after
      closing/changing plan, weights off, changed snapshot→new link, revoke failure,
      native share cancellation and complete URL/token redaction.
- [x] Confirm tests fail, implement client and share UI; show publishing progress
      before QR exists, and success only after server response. Keep unconfigured
      actions gated. Add compatible pinned QR encoder rendering via existing SVG;
      verify encoded value equals the canonical URL, no decorative fake production QR.
- [x] Test links rejecting lookalike hosts, credentials, extra path/query, malformed
      tokens, HTTP and external redirects. Run client/link/UI tests, localization
      checks and typecheck; commit Task 5.

### Task 6: Native scan, incoming links and HTTPS fallback

**Files:** Create `app/shared.tsx`, `components/workout-sharing/PlanScanner.tsx`,
`lib/__tests__/workout-sharing-routing.test.tsx`; modify `app/_layout.tsx`, `app.json`,
package manifest/lock and `docs/WORKOUT_SHARING.md` for configuration/rollout.

**Interfaces:** `/shared?token=...` opens the same PlanPreview after resolution;
scanner/paste input dispatch only links accepted by Task 5. HTTPS host serves this
route plus association documents for configured iOS/Android app identifiers.

- [x] Test cold incoming link while local-data gate loads/restores; duplicate events;
      camera denied/cancelled; invalid QR; offline resolution; background return;
      active workout still present after navigating back.
- [x] Confirm failure, then implement queued route handling and lazily requested
      expo-camera permission using current compatible pinned package. Paste remains
      available without camera. Web fallback renders same preview and truthful native
      open/install guidance; never promise deferred install handoff.
- [x] Document exact domain/association/hosting/OTP prerequisites; use a configured
      HTTPS static Expo export, no invented production host. Verify web export and
      native exports. Real system-camera/universal-link acceptance remains pending
      until domain and signed device builds exist. Commit Task 6.

### Task 7: Curated library and offline cache

**Files:** Create `lib/workout-sharing/{library,library-cache}.ts`,
`components/workout-sharing/PlanLibrary.tsx`,
`lib/__tests__/workout-plan-library.test.tsx`; modify `app/index.tsx`.

**Interfaces:** `listPlans(locale:SupportedLocale):Promise<LibraryPlan[]>` returns
localized metadata, origin and reviewed filters; `LibraryCache.read/write` stores
last successful validated metadata. Library selection resolves snapshot then uses
Task 3; no second import path.

- [x] Test goal/experience/equipment search, unavailable locale metadata, empty/error,
      cached offline label, withdrawn entry, stale fetch ordering and same-origin
      repeated import. Invalid catalog payload never replaces last good cache.
- [x] Confirm failure, implement My plans/Library entry within Workouts, Scan/Paste,
      reviewed-only metadata and server-admin publication. Initial fixtures are not
      automatically live content; duration appears only with explicit estimate.
- [x] Run library/import/localization tests and typecheck; commit Task 7.

### Task 8: Whole-flow verification and delivery

**Files:** Update `docs/WORKOUT_SHARING.md`, `docs/PRODUCT.md`, `docs/ROADMAP.md`,
`docs/DECISIONS.md`, localization classification artifacts when justified.

- [x] Run `npm run check`, database CI suite and `npm run export:check`; verify exact
      working-tree head, not an older run. Perform independent whole-branch review.
- [ ] Exercise signed author→unsigned recipient→save→start, duplicate/revoke,
      library→same importer, offline saved plan, persistence failures and backups.
- [ ] Record narrow-phone/Dynamic Type/screen-reader, camera permission and real
      deep-link checks as passed only when actually observed on supported devices.
      Leave flags disabled where domain/mail/native checks remain incomplete.
- [ ] Reconcile approved/implemented/deployed/verified status in docs, publish focused
      PRs with exact CI evidence; never merge automatically. No readiness percentages.

## Self-review

The eight tasks cover every spec section; Review Focus conditions each have owning
tests. Existing stricter 20-set limit is intentionally retained. Numeric authored
targets need real model support before UI; optimistic store persistence cannot be
used as a durable import signal. Account mail, domain hosting and physical-device
validation are explicit rollout dependencies rather than invented completed work.

## Execution handoff

Recommend native execution in this session: tasks share contract/store interfaces
and benefit from one implementer, with independent whole-branch review. The user approved the plan and native inline execution on 2026-10-23.
Tasks 1–7 are implemented. Final review fixes and automated verification are recorded
in WORKOUT_SHARING.md; external rollout/device acceptance remains explicitly pending.
