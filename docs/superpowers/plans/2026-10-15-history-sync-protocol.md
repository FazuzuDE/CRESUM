# History Sync Protocol Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Deliver tested atomic history publication and lossless mapping for the next first-sync integration.

**Architecture:** Normalized storage is accessed through authenticated invoker wrappers around narrowly privileged private functions. Owner-serialized feed/receipts provide CAS and idempotency; a storage-free TypeScript adapter validates the boundary.

**Tech Stack:** Existing TypeScript/Jest, PostgreSQL 17 CI, Supabase CLI 2.121.0, scratch-only PGlite.

**Spec:** `docs/superpowers/specs/2026-10-15-history-sync-protocol-design.md`

## Global Constraints

- Base merged #53 `c1f757280e3ec247d5ca353a4c373af4ad6a0bca`; preserve frozen auth branch.
- No new app dependencies, UI/scheduler activation, Core schema/key changes, real email, paid services or auto-merge.
- Keep new protocol migration unapplied remotely; only merged foundation is deployable.
- No user_id argument on RPC, no public SECURITY DEFINER, no raw errors/payloads in client errors.
- Independent database copies/restore drill are a release gate, deferred by user.

## Review Focus

1. A server-success/client-timeout retry must not duplicate history or add another revision/feed entry.
2. Parallel same-owner writes must not commit out of cursor order and skip a workout forever.
3. Invalid nested payloads must not leave a root, device, receipt or partial aggregate committed.
4. Valid legacy duplicate IDs, optional fields, large rest values and paired/empty strings must round trip without reinterpretation.
5. Replaying after later edits, account separation and malformed feed/cursor responses must not advance false state or expose another owner.

### Task 1: Core/cloud mapping and RPC boundary

Files: `lib/workout-repository.ts` (export pure completed reader),
`lib/sync/history-mapper.ts`, `lib/sync/history-rpc.ts`,
`lib/__tests__/history-sync.test.ts`.

Interfaces: `encodeHistoryWorkout(WorkoutSession): CloudHistoryWorkout`,
`decodeHistoryWorkout(unknown): WorkoutSession`,
`HistoryRpc.publish({workoutId, mutationId, deviceId, expectedRevision, workout})`,
`HistoryRpc.pull(after='0', limit=50)`. RPC receives normalized snake_case
aggregates; returns validated revision/sequence or ordered mapped history changes.

- [x] Write missing-module RED for exact round trips, invalid active/partial history, safe classified failures, precision/order/cursor checks and request IDs.
- [x] Expose current completed reader and implement the mapping/adapter without storage or SDK imports.
- [x] Run focused Jest. Expected: all pass; no Core changes or real network calls.

### Task 2: Atomic server protocol

Files: CLI-generated `supabase/migrations/*_history_sync_protocol.sql`,
`supabase/tests/history-sync.sql`, `.github/workflows/ci.yml`.

Interfaces: exact public RPC signatures and output shapes in the spec; private
receipt/feed tables, private validation/read/publish/pull functions.

- [x] Write real SQL fixtures for publish/pull, replay, CAS, owner/anonymous denial, held locks, rollback, tombstones and bigint pagination; run RED without RPC.
- [x] Generate migration with pinned CLI; implement only protocol/grant changes.
- [x] Run SQL contracts in migration order; expected all pass. Pin negative controls for removed owner lock and broken receipt replay.
- [x] Update PostgreSQL17 CI to test each schema stage in order, not foundation grants after permission tightening.

### Task 3: Documentation, reviewed deployment and delivery

- [x] Record merged53, protocol stage/activation prerequisites and release disaster-recovery gate in PRODUCT/ROADMAP/DECISIONS/CLOUD_SYNC.
- [ ] Apply only exact merged foundation migration to verified empty cresum-dev; verify version/schema/owner grants and advisors. Never load fixtures remotely.
- [x] Run full check, sequential offline iOS/Android JS export and diff check.
- [x] One fresh-context whole-branch review; fix Important findings with RED→GREEN and full suite.
- [ ] Publish focused PR to develop, verify both CI jobs and leave merge to user.

## Final review record

Two Important boundary findings were reproduced before fixes: SQL accepted
Core-invalid program year0099, and the client accepted an impossible publication
revision. SQL now matches Core's minimum year0100 and rejects0099 without a
device/root/feed/receipt. The client requires revision1 for create and exactly
expected+1 for update/delete, including original-receipt replay.

Deferred minor: SQL pins a held transaction lock and its position is reviewed,
but two-session contention/commit-order CI coverage remains a follow-up. App
activation, provenance, recovery and actual multi-device acceptance remain gated.
