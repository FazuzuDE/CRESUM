# Cloud Schema + Sync Foundation

## Intent and boundary

Continue the approved Account + Sync sequence after merged #52 (`8f202943`).
Prepare a user-owned cloud schema and durable device-local sync intent without
activating upload/download. Core/offline behavior, schema v1, auth ownership,
backup/recovery and the current Account UI remain unchanged. SMTP/domain setup
is deferred by the user and does not block this development stage.

Use normalized completed-workout tables rather than storing the Core document
as JSON. A whole-document cloud backup would mix active sessions and unrelated
settings; building the complete sync engine now would combine two roadmap PRs.
This foundation therefore contains the schema, isolation tests and local queue;
History mapping, atomic aggregate publication and transport follow separately.

## Cloud contract

- Four public tables: `sync_devices`, `completed_workouts`,
  `completed_workout_exercises`, `completed_workout_sets`.
- All rows have an Auth `user_id`. Composite primary/foreign keys include the
  owner, so nested rows cannot reference another owner's parent/device.
- Preserve existing workout IDs as text; do not convert legacy IDs to UUIDs.
  Exercise/set identity uses saved ordinal positions within the aggregate,
  retaining the original IDs as snapshots. The existing reader permits repeated
  nested IDs; cloud storage must preserve these rather than drop valid history.
- Preserve weight/reps/other-side reps as strings and factual timestamps as
  finite nonnegative milliseconds. Preserve names, library IDs, muscle labels,
  planned targets and optional program-slot context. No active-session table.
- Devices and workout roots have explicit positive safe-integer revisions.
  Inserts start at 1; updates require exactly the previous revision + 1.
  Server audit time is not conflict protection. Identity columns are immutable.
- Workout roots support `deleted_at` tombstones. Tombstones cannot be cleared;
  no automatic retention/purge is introduced. Client physical DELETE is denied.
- RLS is enabled on every public table; only `authenticated` receives explicit
  SELECT/INSERT/UPDATE grants and owner policies, including WITH CHECK. Anonymous
  access and cross-owner writes/reparenting are denied. No public privileged RPC.
- Private trigger functions use SECURITY INVOKER and a fixed search path. This
  is a storage contract, not a completed sync protocol: the History PR must add
  atomic aggregate write/pull semantics before any app cloud writes are enabled.
- Versioned SQL migrations are reviewed in Git before remote application.
  Tests run on actual PostgreSQL semantics locally and PostgreSQL 17 in CI;
  isolated test fixtures emulate only Supabase roles/auth.uid(), never live users.

## Local metadata contract

`cresum_sync_device_v1` stores one versioned opaque device ID. A platform caller
supplies a unique-ID factory; no new app dependency or active owner is added.
`cresum_sync_metadata_v1` stores a versioned document with account partitions,
independent account generations, pull cursors and completed-workout intents.

Each intent holds entity ID, upsert/delete operation, local sequence, optional
base remote revision, pending/blocked status, attempt count and safe error kind.
No auth tokens, workout payloads or raw HTTP requests/errors are stored.

- Serialize operations across repository instances sharing the storage object.
  Verify persisted bytes before acknowledging a write. Failed/corrupt/future
  storage must throw without silently replacing metadata or changing Core.
- Coalesce newer changes for the same owner/entity, issuing a new sequence.
  Acknowledgements require account generation + entity ID + sequence; old responses cannot
  clear newer work or work created after account clearing/local reset.
- A successful older upload may advance the base remote revision of newer
  pending work, but never lower a known revision. Other accounts remain isolated.
- Retryable failures remain pending. Auth/conflict/invalid-payload failures are
  blocked and distinct. Explicit retry clears a block; stale failures are ignored.
- Cursor writes require the current account generation. Clearing one account
  cannot clear another account or accept a late old cursor response.
- Core reset clears sync metadata transactionally with existing reset keys,
  retaining device ID, auth session and saved backup files. Sync/device metadata
  stays outside the full backup whitelist; do not alter the restore journal.
- The queue has no scheduler/network wiring in this PR. Before activation the
  History PR must reconcile intents with current local entities, integrate its
  writer drain with recovery, and invalidate/reconcile cursors after import,
  restore and reset. This prevents deferred transport from uploading stale data.

## Acceptance

SQL tests exercise actual roles: owner round trips, anonymous/cross-owner denial,
composite ownership, stable identities, revision conflicts, tombstone protection,
no physical delete, valid zero/paired snapshots and repeated nested IDs. Queue
tests cover restart, two-instance concurrency, rejected/silent writes, stale
acknowledgements, account switching/clearing, generations and corruption. Reset
and backup regressions prove metadata boundaries. Existing checks and mobile JS
exports remain required; no real SMTP/device/cloud-sync acceptance is claimed.
