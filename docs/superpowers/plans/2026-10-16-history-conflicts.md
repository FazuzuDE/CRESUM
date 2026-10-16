# History Conflict Resolution Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline, task-by-task.

**Goal:** Resolve completed-history divergence with a clear comparison and explicit safe choice.
**Architecture:** Owner-bound lookup and atomic resolution RPCs reuse publication, revisions and private receipts. A metadata-only intent drives one verified Core merge, recovered before ordinary sync. Existing coordinator epoch/recovery guards own the resolver.
**Tech Stack:** Existing Expo/TypeScript/Jest, Supabase/Postgres, expo-crypto. No dependencies.
**Spec:** `docs/superpowers/specs/2026-10-16-history-conflict-resolution-design.md`.

## Global Constraints

- Base505a0692e0f444f400db8e383e3ab26246304ec2, merged56. Preserve frozen618c7e2.
- Two primary per-version choices, Decide later, Keep both only in More options.
- No timestamp-based winner, invented edit times, cross-account transfer or active-session replacement.
- Core v1 and backup whitelist/journal remain unchanged. No live fixture writes, mail, auto-merge or deployment of unmerged SQL.
- User approved the concrete UX; translate it to docs and execute engineering work using the established inline/PR workflow.

## Review Focus

1. A server-success timeout after Keep both must recover exactly one copy, including after an ambiguous Core write.
2. Account switching, backgrounding and local replacement must fence old choices, copy claims and queued replies.
3. Local changes or newer remote revisions while the comparison is open must invalidate the choice without overwriting unseen data.
4. Metadata corruption, silent writes and acknowledgement failures must not clear conflicts or report Synced prematurely.
5. Tombstones, legacy/repeated nested IDs, empty IDs and other-owner/active collisions must preserve history and never revive a deleted identity.

### Task 1: Owner-scoped atomic protocol

Files: new CLI-created history_conflict_resolution migration, `supabase/tests/history-conflicts.sql`, workflow database step, `lib/sync/history-rpc.ts`, `lib/__tests__/history-resolution-rpc.test.ts`.
Interfaces: `HistoryRemote {workoutId,revision,deletedAt,workout}`; `ResolutionChoice='local'|'cloud'|'both'`; `HistoryResolutionRequest {workoutId,mutationId,deviceId,expectedRevision,choice,copyId,workout}`; `HistoryResolutionResult {original,copy}`. `HistoryRpc.get(id):Promise<HistoryRemote|null>`, `.resolve(request):Promise<HistoryResolutionResult>`.

- [x] RED lookup/result validation and SQL owner/CAS/replay/copy/delete/rollback contracts.
- [x] Implement private guarded functions + invoker wrappers; transaction lock, exact replay, no direct table grants.
- [x] GREEN Jest + real disposable PostgreSQL contracts, then commit focused protocol.

### Task 2: Durable resolution and coordinator

Files: new `lib/sync/history-resolver.ts`, ledger/coordinator, new resolver/coordinator tests.
Interfaces: `HistoryComparison {userId,workoutId,local,remote,localHash,remoteHash,blocked}`; `HistoryConflictSummary {id,name}`. Coordinator `.conflicts()`, `.compare(id)`, `.resolve(comparison,choice)`; resolver consumes injected ledger/queue/store/hash/current/API and recovers persisted intents before ordinary sync.

- [x] RED each choice, stale comparison, timeout/restart/copy identity, missing/active/foreign IDs, metadata/Core failures and account/recovery fences.
- [x] Add optional versioned intent fields compatible with old ledger, validated hashes/IDs/actions. Persist copy claims before network.
- [x] Serialize resolver work with epoch fencing and writer draining, not old-network waiting; clear obsolete choices on explicit Resume after replacement.
- [x] Verify Core bytes before facts/ack/intent removal. GREEN targeted + existing sync/recovery regressions, then commit.

### Task 3: Comparison UI

Files: new `components/HistoryConflictReview.tsx`, AccountPage/HistorySyncPanel/useHistorySync, new UI/app tests.
Interfaces: optional review actions on HistorySyncControls; AccountPage owns screen navigation. Owner-keyed review state cannot survive an account switch.

- [x] RED review entry/list, per-set differences, two choices, Decide later, secondary Keep both disclosure, deletion confirmation, stale/network/blocked states and live account/recovery actions.
- [x] Implement scrollable token-based comparison/confirmation and explicit pending state. No preselection or technical metadata in product UI.
- [x] GREEN integration tests; sync PRODUCT/DESIGN_SYSTEM/ROADMAP/DECISIONS/CLOUD_SYNC to approved/actual behavior; commit.

### Task 4: Verification and delivery

- [x] Full npm check, sequential offline iOS/Android JS exports, SQL contracts and actual coordinator/RPC/Postgres scenario.
- [x] One whole-branch fresh reviewer; one Critical/Important fix pass RED→GREEN and full suite.
- [ ] Publish focused PR into develop, verify both GitHub CI jobs, preserve merge control.
- [ ] Report native/device/mail/SQL deployment acceptance separately; no false production-readiness claim.
