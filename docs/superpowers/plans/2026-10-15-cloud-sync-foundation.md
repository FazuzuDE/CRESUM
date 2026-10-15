# Cloud Sync Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Deliver tested cloud ownership contracts and dormant durable sync metadata after merged #52.

**Architecture:** Normalized user-owned PostgreSQL tables preserve Core history snapshots. A separate storage-only repository partitions entity intents by account, serializes writes and guards acknowledgements with account generations and local sequence numbers. No app transport is activated.

**Tech Stack:** Existing Expo/TypeScript/Jest stack, Supabase CLI 2.121.0 for migration scaffolding, PostgreSQL 17 CI, scratch-only PGlite 0.5.10 for local SQL checks.

**Spec:** `docs/superpowers/specs/2026-10-15-cloud-sync-foundation-design.md`

## Global Constraints

- Base merged #52: `8f2029430b7d19201d78e2a39f150e530da1a4c6`; preserve the frozen auth checkpoint.
- Preserve Core schema v1 and all existing keys, except adding sync metadata to reset-only keys. Do not change LOCAL_DATA_KEYS or restore journal shape.
- No app runtime dependencies, UI changes, live cloud writes, real emails, production migrations, active-workout sync, Calibration #17 or automatic merge.
- Keep migrations unapplied remotely until reviewed/integrated; no live Auth fixture users.
- Device key `cresum_sync_device_v1`; metadata key `cresum_sync_metadata_v1`; schema version 1.
- Apply existing Supabase/Postgres RLS guidance; test owner and role restrictions in real SQL.

## Review Focus

1. Legacy nested IDs may repeat; valid saved order and paired/zero values must round trip.
2. Late acknowledgements/failures after account clear or reset must not affect new queued work.
3. A stale upload success must retain newer work and never regress its base revision.
4. Storage writes may reject after committing or silently do nothing; Core and queued durability must remain truthful.
5. Anonymous/cross-owner requests and stale revisions must fail even without client-side filtering.

### Task 1: Cloud schema and SQL isolation contract

Files: CLI-generated `supabase/migrations/*_cloud_sync_foundation.sql`,
`supabase/tests/bootstrap.sql`, `supabase/tests/cloud-foundation.sql`,
`.github/workflows/ci.yml`.

Produces: four tables and their constraints/RLS policies as specified; private
identity/revision triggers. Tests bootstrap isolated Auth roles/users only.

- [x] Write SQL assertions first; run against bootstrap with no migration and observe missing-table RED.
- [x] Generate the migration using the pinned CLI; implement only four tables, explicit grants, RLS, composite FKs and invoker triggers. No API publication runner.
- [x] Run local real-Postgres SQL tests: owner, anon, cross-owner INSERT/SELECT/UPDATE, reparenting, stale revisions, tombstone resurrection, physical DELETE, duplicate nested IDs, invalid completion times and paired strings. Expected: all assertions pass.
- [x] Add an isolated PostgreSQL 17 CI service/job applying bootstrap, sorted migrations and the same SQL contract with ON_ERROR_STOP.

### Task 2: Durable local metadata and recovery boundary

Files: `lib/sync/model.ts`, `lib/sync/storage.ts`, `lib/sync/repository.ts`,
`lib/__tests__/sync-repository.test.ts`, existing reset/backup libraries/tests.

Interfaces: `SyncRepository(storage, makeId)` exposes `getDeviceId()`,
`snapshot(userId)`, `enqueue(userId, {entityId, operation, baseRevision})`,
`acknowledge(userId, entityId, {generation, entityId, sequence}, remoteRevision)`,
`defer(userId, entityId, token, errorKind)`, `retry(userId, entityId, token)`,
`setCursor(userId, cursor, generation)`, `clearUser(userId)`, `flush()`.
Snapshot contains `{generation, cursor, intents}`; intent contains safe metadata
and a `{generation, entityId, sequence}` token. Mutations return true only for a matching
current intent/account. `acknowledge` returns true only when it removes that intent.

- [x] Write missing-module RED for persistence/coalescing, per-account generations, stale success/failure, revision advancement, concurrency, corruption and rejected/silent writes.
- [x] Implement storage-only repository, validation and shared serialization. Require a caller-supplied unique-ID factory; preserve exact legacy entity IDs.
- [x] Run focused queue tests. Expected: pass, no networking or Core writes.
- [x] Add reset/backup regressions first and observe RED for reset metadata cleanup; add only the reset-only key, preserving auth/device/archive and existing rollback behavior. Expected: focused recovery tests pass.

### Task 3: Documentation and delivery

- [x] Sync PRODUCT/ROADMAP/DECISIONS and add `docs/CLOUD_SYNC.md` describing actual limits, migration/testing and activation prerequisites.
- [ ] Run typecheck/lint/format/full tests/config/deps and sequential offline native JS exports; git diff check. No concurrent Jest/export.
- [x] Fresh-context whole-branch review; fix important findings with RED→GREEN regressions in one pass.
- [ ] Publish focused PR into develop; wait for Quality checks and Database contracts CI, preserve original auth checkpoint and user merge control.

## Final review record

The independent whole-branch review found one Important compatibility issue:
Core permits finite positive integer rest durations beyond PostgreSQL int4/int8.
A SQL regression first failed with `22003` at `2147483648`; the migration now
uses double precision with positive, finite and integral checks. The contract
also round-trips `1e20` and the largest finite JS number, and rejects zero,
negative, fractional, infinite and NaN durations.

Deferred minor coverage: direct child immutable-identity trigger mutation
regressions. Deferred theoretical limitation: int4 array positions cover
practical saved histories, but not JS arrays above 2,147,483,647 positions.
Remote deployment/advisors, actual Auth/native acceptance, atomic publication,
ordered pull cursors and concurrent recovery/transport integration remain
explicit activation gates; no transport is wired by this foundation.
