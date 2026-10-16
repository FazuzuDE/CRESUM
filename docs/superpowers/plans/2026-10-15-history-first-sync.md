# History First Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Activate completed-history backup/sync with truthful UI and safe account/recovery boundaries.

**Architecture:** One existing auth client supplies account-bound RPC. A storage-only provenance ledger plus existing intent queue drive a serialized, epoch-fenced coordinator; verified Core merges commit before pull cursors. Recovery pauses/drains the coordinator independently of network completion.

**Tech Stack:** Expo/TypeScript/Jest, existing Supabase RPC, SDK-matched expo-crypto~57.0.4 for lazy SHA-256/UUID.

**Spec:** `docs/superpowers/specs/2026-10-15-history-first-sync-design.md`

## Global Constraints

- Base84e7fe59bb03337084e38c8380c058f317c0af32; preserve frozen618c7e2.
- Preserve Core v1, backup whitelist/journal and offline Finish. No active/template/body sync, real email or fixture remote users, paid infrastructure or auto-merge.
- New ledger/pause marker excluded from backups and preserved on reset; reset clears existing intent metadata.
- Never store auth tokens/workout payloads in sync metadata or reuse mutation IDs for changed request bodies.
- Apply only reviewed merged protocol SQL; release backup infrastructure stays deferred.

## Review Focus

1. A shared client's session can change while an old account's request is being constructed; no payload may be sent under the new account.
2. Network replies after sign-out/reset/import/restore must not recreate local history or metadata.
3. Server-success timeout followed by restart or local replacement must recover without duplicate publication or changed-token replay.
4. Account claims and cursor ordering must remain safe after rejected/silent metadata or Core writes, including after commit.
5. Remote edits/deletes, repeated pages and active/local/other-account ID collisions must preserve all unsynchronized local data and avoid false Synced.

### Task1: Durable ledger and coordinator

Files `lib/sync/history-ledger.ts`, `history-coordinator.ts`, `history-reconcile.ts`,
`lib/__tests__/history-coordinator.test.ts`.
Interfaces: ledger read/change/pause marker with existing serializeSync; coordinator
setAccount, enable, request(manual), quiesce(pause), dispose, subscribe/getSnapshot.
Consume injected HistoryRpc, WorkoutStore, unique ID/hash factories and live auth predicate.

- [x] Write RED tests for provenance, retry/restart, conflicts, guards and quiesce.
- [x] Implement minimal ledger/reconcile/coordinator; use existing SyncRepository.
- [x] Focused tests GREEN without networking or native modules.

### Task2: Auth transport and verified Core merge

Files auth-repository/auth-store/supabase-auth, workout-repository/workout-store,
existing/new auth/store tests and package manifest/lock for expo-crypto.
Interfaces: optional account-bound historyRpc plus live isCurrentAccount predicate;
WorkoutStore.applyCloudHistory(expected,next,guard) and repository verified save.

- [x] RED auth capture/dispose/timeout and Core merge concurrency/write failures.
- [x] Add account-bound headers to the existing SDK client and verified merge.
- [x] Focused auth/Core/coordinator tests GREEN; baseline regressions pass.

### Task3: UI and recovery integration

Files components/useHistorySync.ts, HistorySyncPanel.tsx, AccountSection/Page,
useAccount.ts, app/index.tsx, new integration tests.
Interfaces: hook exposes panel state/actions and quiesce guard; app wraps all
backup/reset work with sync drain, persisting pause only for replacement/import/reset.

- [x] RED app states/actions, account switching and recovery drain/pause tests.
- [x] Wire launch/history/foreground/bounded retry and Account & Sync panel.
- [x] Preserve all Core/auth/backup regression tests and truthful reset copy.

### Task4: Deployment, docs and delivery

- [x] Apply exact merged54 protocol migration; reconcile generated deployment version to source by verified SQL hash; verify grants/advisors, no fixture writes.
- [x] Sync PRODUCT/DESIGN_SYSTEM/ROADMAP/DECISIONS/CLOUD_SYNC to actual behavior and limitations.
- [x] Full check + sequential offline mobile JS exports + SQL contracts + diff check.
- [x] One final fresh-context review; Important fixes RED→GREEN + full suite.
- [ ] Publish focused PR to develop, verify CI and preserve user merge control.
