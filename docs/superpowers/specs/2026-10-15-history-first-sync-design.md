# History First Sync Integration

Continue after merged54 `84e7fe59bb03337084e38c8380c058f317c0af32`.
Deliver usable Profile Account & Sync, completed-history upload/pull and safe
recovery integration. No active session, template, preference or body-weight
sync. Core v1 and file backup/restore format stay unchanged.

## User behavior

- Account sign-in stays optional. Signed-in users explicitly Enable cloud backup
  before unassigned local history is added to that account. Account connection
  alone is not a successful cloud copy. Then sync runs on launch, foreground,
  completed-history changes and Sync Now; transient retries are bounded while
  open. No per-set uploads or OS background-job promise.
- Account page shows off/paused/pending/syncing/synced/couldn't-sync states and
  local-data reassurance. Synced means a completed run for this account's history,
  not active workouts or every application setting. Auth/conflict/invalid failures
  stay distinct; conflicts never silently overwrite local or cloud snapshots.
- Sign Out preserves history. Persisted provenance prevents account A's known
  workouts from being uploaded under B. New unassigned history is claimed only
  by an explicitly enabled account. Unknown/corrupt metadata fails cloud closed.
- Import/full restore/reset persistently pause cloud before changing data;
  Resume cloud backup does a full pull and additive/revision-aware reconciliation.
  Reset never deletes cloud history or immediately repopulates local history.
  Temporary export/automatic archive operations drain sync writes, then resume.

## Persistence and coordinator

Reuse SyncRepository durable intents/generations/cursor and HistoryRpc. Add a
versioned `cresum_history_sync_v1` ledger with owner claims, per-account enabled
state, observed revision/hash/tombstones/conflicts and pending request fingerprints
(token + expected revision + SHA-256 hash, no payload). Add a separate verified
`cresum_history_sync_pause_v1` marker, independently writable even if the ledger
is corrupt. Both remain outside Core exports and are retained across local reset
to preserve account separation and pause state. No auth tokens enter metadata.

Use canonical sorted-key JSON of normalized snapshots for SHA-256. SDK-matched
expo-crypto provides hashes and UUIDs, lazily loaded only for cloud operations.
One caller-owned Auth client serves RPC. Bind each request's Authorization header
to a session whose user matches the captured account; use an abort/deadline and
reject late/disposed account work. A shared client must never read a newer user's
session while preparing an older user's payload.

Coordinator operations serialize; epoch/current-auth guards fence every network
continuation. Quiesce invalidates synchronously and drains local/metadata writes,
without waiting for remote responses. Old responses cannot write after recovery.
Retained pending fingerprints let a pull recognize an upload that succeeded before
a client timeout. A token is reused only with the exact payload/base revision.

Pull before pushing. Import distinct live snapshots; apply a remote edit/delete
only when the locally owned snapshot still matches its known base. A same-ID
local/remote disagreement or another account's claim remains a visible conflict;
never choose destructive whole-workout last-write-wins. Store owner claims before
adding pulled data, persist observed state after the verified Core merge, and
advance cursor last. Failed/ambiguous writes must remain retryable; replayed pulls
are idempotent. Active-workout ID collisions do not replace the active session.

Core merge uses a live history reference check, keeps the latest active session
and templates, and verifies persisted bytes under the existing repository write
queue. Busy merge windows are short; network/metadata failures never fail Finish.

## Deployment and acceptance

Apply only the already-merged54 protocol migration to the verified dev project
with empty history; verify recorded source version, RPC grants and advisors.
No real emails or fixture Auth users/workouts are sent remotely. Real SMTP,
physical phone, multi-device/native-build acceptance remain separate gates.
Independent database copies/restore drill remain deferred to release.

Tests: account-switch and late-response fences, server-success timeout/restart,
coalescing and exact token replay, safe remote edits/deletes/collisions, local
write/readback failures, corrupted provenance, reset/import/restore pause and
export drain, auth request header binding, and actual Account UI actions/states.
Full checks, SQL contracts, iOS/Android JS exports and one independent review
precede PR; user controls merge.
