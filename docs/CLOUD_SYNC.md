# Cloud Sync Foundation and History Integration

The original foundation stage below follows merged #52. It prepares storage contracts; it does **not**
upload/download workouts, run a sync scheduler or show a Synced state. Email
SMTP/domain setup is deliberately deferred. Account connection and Core remain
independent of this foundation.

## Cloud schema

The versioned migration creates four RLS-protected public tables:

| Table                         | Identity                                 | Data                                                               |
| ----------------------------- | ---------------------------------------- | ------------------------------------------------------------------ |
| `sync_devices`                | Owner + device ID                        | Device label and revision                                          |
| `completed_workouts`          | Owner + saved workout ID                 | Completion facts, context, revision and tombstone                  |
| `completed_workout_exercises` | Owner + workout + position               | Exact exercise identity/name/muscle/target snapshots               |
| `completed_workout_sets`      | Owner + workout + exercise/set positions | Exact ID, weight/reps and optional other-side/completion snapshots |

Existing workout IDs remain text. Core permits repeated nested IDs, so positions
preserve each occurrence and its order. Zero/empty/paired strings and fractional
millisecond facts and finite positive integer rest durations are retained; no catalog FK rewrites historical meaning. Only
completed workouts have cloud roots; active sessions remain device-local.

Composite FKs include ownership. Authenticated users can SELECT/INSERT/UPDATE
only their own rows; anonymous access and client physical DELETE are denied.
Tombstones remain visible to their owner and cannot be cleared. Child writes
require a live root. No tombstone purge/retention policy is activated.

Device/root revisions start at 1 and updates must advance exactly one revision.
Stable identity fields cannot be changed. Audit timestamps are server-managed,
not a substitute for compare-and-swap or an ordered change feed. Private triggers
are SECURITY INVOKER with a fixed search path; no public privileged RPC exists.

## Local metadata API

`new SyncRepository(storage, makeId)` is dormant until a future platform owner
provides a globally unique-ID factory and explicitly wires it to History sync.
It has no Auth/client/network imports. Methods:

- `getDeviceId()` creates/reads `cresum_sync_device_v1` with readback verification.
- `snapshot(userId)` reads the account generation, opaque cursor and intents.
- `enqueue(userId, {entityId, operation, baseRevision})` coalesces a completed-workout
  upsert/delete and returns a new `{generation, entityId, sequence}` token.
- `acknowledge(userId, entityId, token, remoteRevision)` removes only the exact
  intent. An older success can advance a newer intent's base revision, never
  reduce it or clear newer work.
- `defer(...)` retains transient failures as pending and distinguishes blocked
  auth/conflict/invalid failures. Only safe error categories are stored.
- `retry(...)` explicitly clears a matching intent's block.
- `setCursor(userId, cursor, generation)` ignores obsolete account generations.
- `clearUser(userId)` clears that account only; its next generation is different.
- `flush()` waits for previously scheduled metadata operations sharing storage.

All operations serialize across repositories using the same storage object.
The metadata document uses `cresum_sync_metadata_v1`, version 1, and contains
entity intent rather than workout payloads or raw HTTP requests. Corrupt/future
documents and failed/silent writes throw without resetting data. A write that
commits then rejects is reread on the next operation instead of being lost from
an optimistic in-memory cache. Metadata errors do not change Core or sign out.

Local reset clears metadata using its existing verified rollback path, preserving
auth, device ID and saved archive files. Device/queue/cursor values are excluded
from Core exports, History import and the full restore whitelist. The existing
restore journal format is unchanged.

## SQL verification and deployment

`supabase/tests/bootstrap.sql` creates test-only Auth roles and a minimal
`auth.uid()` adapter. **Run it only on an empty isolated test database, never on
a Supabase project.** `cloud-foundation.sql` uses real roles and assertions,
rolls back its synthetic users/workouts and exercises RLS, ownership FKs,
revision conflicts, tombstones and historical round trips.

The Database contracts CI job runs bootstrap → ordered migrations → assertions
inside an isolated PostgreSQL 17 service with ON_ERROR_STOP. Local checks use
scratch-only PGlite 0.5.10, not an app dependency. Migrations are scaffolded with
Supabase CLI 2.121.0 after reading its help.

The migration is prepared in Git and is **not applied remotely by this PR**.
After review/integration, apply only the production migration through the normal
Supabase migration workflow, verify its recorded version and run security
advisors. Never run the CI bootstrap against the live Auth schema.

## History PR activation requirements

Before enabling any transport, implement validated Core/cloud mapping, atomic
aggregate publication, idempotent retries, revision-aware conflict handling and
an ordered pull cursor/change feed. Reconcile queued intent against current
local entities; wire metadata draining to recovery and invalidate/reconcile
cursors after import/restore/reset. Sign-in merges without replacing local
history; account switching must not upload one account's intents under another.
Physical multi-device/session/offline acceptance remains separate.

## Atomic History protocol (next reviewed migration)

The new protocol migration adds private mutation receipts and an owner-ordered
change feed. Public `publish_completed_workout` and `pull_completed_workouts`
wrappers use SECURITY INVOKER; private implementations use fixed-search-path
SECURITY DEFINER with explicit auth.uid() ownership and no owner argument.
Direct client INSERT/UPDATE is revoked on the four public tables; SELECT keeps
owner RLS. Source-device identity remains the original creator on later edits.

Publication commits root/exercise/set snapshots, feed and receipt atomically.
Expected revision null means create-only; a positive revision is exact CAS.
Null workout tombstones an existing entity. The same mutation ID/request
returns its original receipt even after later edits; changed arguments fail.
A private SHA-256 request fingerprint avoids retaining payload copies in receipts.
Owner transaction locks precede sequence allocation to prevent late commits from
falling behind a previously acknowledged owner cursor. Receipts/feed have no
purge policy; retention and capacity must be designed before release.

Pull accepts canonical nonnegative decimal bigint string cursors and limits
1..100 (default50). It returns `{cursor,hasMore,changes}` with sequence strings,
workout ID, current revision, deletedAt and a complete current normalized
snapshot or null tombstone. Events may repeat a workout and may already contain
its later state. Apply monotonically by revision and advance a cursor only
after durable local reconciliation; never treat it as a historical snapshot log.

`history-mapper.ts` reuses the strict pure completed-Core reader.
`HistoryRpc` accepts an injected authenticated RPC caller rather than creating
another session/client, validates every response and exposes only safe error
categories. It performs no local writes, retries, cursor commits or app wiring.
The next owner must persist stable mutation IDs and preserve account provenance.

### Development deployment checkpoint

Only the exact merged foundation SQL was applied to the verified empty
`cresum-dev` project on 2026-10-15. Its recorded version is reconciled to source
`20261015131458` after verifying the stored SQL hash; the connector initially
assigned its application timestamp. No fixture users or workout rows were sent.
All four tables have RLS; anon SELECT and authenticated physical DELETE are
denied. The protocol migration is still unapplied until Git integration.

Security advisors reported the pre-existing platform function
`public.rls_auto_enable()` default EXECUTE grants. Inspection confirms it returns
`event_trigger`, has a fixed pg_catalog search path and enables RLS on new public
tables; this PR does not alter that platform hook. Review its default grants as
a separate infrastructure hardening item:
https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable
https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
Performance advisors only report the three not-yet-used foundation indexes.

Before release, configure independent off-platform database copies and test
restoration. This was explicitly deferred by the user; no backup service is
provisioned here. Existing local archive/export controls remain independent.

## App integration after merged54

The Account page now wires the protocol after explicit Enable/Resume. One auth
client supplies RPC: the matching session is captured and its Authorization
header fixed before fetch, with a15-second abort/deadline covering session lookup
and transport. Live auth/epoch checks fence late local writes across switching,
sign-out and recovery. No tokens enter sync metadata.

`HistoryCoordinator` reuses SyncRepository intents/cursors and adds
`cresum_history_sync_v1` for metadata-only claims, observed SHA-256 hashes/revisions,
conflicts and pending request fingerprints. `cresum_history_sync_pause_v1` is
independently writable even with a corrupt ledger. Both are excluded from file
exports and retained across local reset, preventing known-account history from
being reassigned and preventing immediate cloud repopulation after reset.

Eligible local history is assigned to the enabled account before the first pull,
so interrupted pulls cannot leave it available for another account to claim.
Pull/merge occurs before pushing. Add distinct snapshots; replace/remove only
an unchanged owned local base. Divergence/other-owner collisions remain visible
conflicts and never report Synced. Persist provenance before Core additions,
verify Core bytes under its write queue, persist observations, acknowledge
matching intents and advance cursors last. Failed merges preserve unsaved local
inputs; ambiguous committed bytes may refresh memory but never claim success.

A request token is reused only for the same canonical normalized SHA-256 content
and base revision. Timeout/restart pulls recognize already committed content;
newer requests keep newer intents. Recovery quiesce invalidates synchronously,
drains local/metadata work and does not wait on remote replies. Replacement,
import and reset persist pause; export/archive operations only suspend temporarily.
Resume starts a fresh generation/full pull. Local reset never deletes cloud data.

Automatic triggers are launch/foreground/completed-history changes; transient
errors get at most5 foreground retries at30s..5min, with manual retry available.
No per-set sync, background service, active-session sync or provider sign-in is
added. The UI scopes Synced to completed workouts linked to the current account.
Account & Sync exposes Review conflicting workouts. The comparison shows each
version's saved sets, workout dates and unknown edit time. Neither version is
preselected. Confirm Keep this version to replace the other, or Decide later.
More options offers separate copies with a History/Progress double-count warning.
Cloud deletions require accepting local removal or saving the device workout
under a new identity; the deleted identity is never revived.

`20261016111714_history_conflict_resolution.sql` adds authenticated owner-scoped
`get_completed_workout` and `resolve_completed_workout` RPCs. Resolution checks
the compared revision and commits the choice, optional copy and private replay
receipt atomically under the existing owner lock. Receipts include exact result
snapshots so a timeout can replay the same authorized result even after another
cloud edit. These private snapshots increase storage; retention/capacity remains
a release gate. This migration is prepared and locally tested, not deployed by
the feature branch; apply it after merge before enabling the new client.

Optional metadata-only resolution intents in the history ledger persist choice,
hashes, revision, stable operation/copy IDs and queue generation before RPC. The
coordinator recovers them before ordinary sync, verifies the Core write, records
facts and acknowledges superseded queue intents before retiring the operation.
Pending operations remain reviewable even if acknowledgement fails. Account,
foreground, active-workout, ownership, import/reset and cursor-generation fences
apply throughout. A changed local/remote comparison must be reviewed again.

### Protocol deployment verified

The exact merged54 SQL is applied to cresum-dev; stored SQL hash
`0a810afd20cf9d6d53b7414df8818862` matched the source. The connector initially
recorded `20261015193101`; only that matching migration record was aligned to
source version `20261015181021`, without rerunning SQL. Authenticated RPC execution
is granted, anon publication denied, direct root INSERT/child UPDATE denied and
completed history still empty. No fixture users/workouts were written remotely.

Security advisors report INFO for intentionally policy-free private RLS tables:
no direct client grants exist; only guarded private functions access them. The
pre-existing platform event-trigger grant warnings described above remain; no
public privileged function was added. Independent backups/restore drills, real
SMTP, native builds/phones and multi-device acceptance remain release gates.
