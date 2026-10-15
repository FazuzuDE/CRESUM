# Cloud Sync Foundation

This stage follows merged #52. It prepares storage contracts; it does **not**
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
