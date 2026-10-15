# History Sync Protocol

## Intent and delivery boundary

Continue the approved History Backup + First Sync roadmap after merged #53
`c1f757280e3ec247d5ca353a4c373af4ad6a0bca`. This focused PR delivers atomic
server publication, idempotent receipts, an ordered per-owner pull protocol and
validated Core/cloud mapping with an injected RPC adapter. App activation,
account-switch provenance, writer draining and merge/recovery UI follow in the
next integration PR; no app traffic or Synced claim is enabled here.

The user deferred independent off-platform database backups until release.
Record a release gate to configure them and test restoration. Domain/mail
remains deferred. Do not provision paid services or send real emails.

## Server contract

- Versioned migration follows the merged foundation; preserve its four normalized
  tables and Core v1. Only authenticated users may invoke the public RPC wrappers.
- Public wrappers are SECURITY INVOKER. Private implementation functions are
  SECURITY DEFINER with fixed pg_catalog search paths and explicit auth.uid()
  checks; they accept no owner parameter. Revoke default function grants and
  direct authenticated INSERT/UPDATE to all four cloud tables. SELECT keeps RLS.
- `publish_completed_workout(p_workout_id text, p_mutation_id text,
p_device_id text, p_expected_revision bigint, p_workout jsonb)` returns
  `{revision: number, changeSequence: string}`. Null expected revision means
  create only; otherwise compare the exact current revision. Null workout means
  tombstone an existing root. Tombstones cannot be resurrected.
- A private per-owner receipt stores a SHA-256 request fingerprint and result.
  Replaying the identical mutation returns its original result, including after
  later edits; reuse with changed arguments is rejected. No failed transaction
  commits a partial root, child set, feed entry or receipt.
- Serialize all writes for an owner with a transaction advisory lock before
  allocating a change sequence. This makes committed per-owner cursor order
  safe despite parallel devices. Distinct owners remain isolated. Sequences are
  bigint transport strings, never rounded JS numbers.
- Aggregate writes replace nested occurrences atomically under root CAS. IDs,
  ordering, zero/empty/paired values, targets/context and fractional timestamps
  retain their Core meaning. Server validates payload types and shape.
- `pull_completed_workouts(p_after text='0', p_limit int=50)` returns
  `{cursor, hasMore, changes:[{sequence, workoutId, revision, deletedAt,
workout}]}` ordered by sequence; limit 1..100. Each live entry contains one
  complete current snapshot, not independently paginated child rows. Tombstones
  contain null workout. A root may appear more than once; later state can be
  observed on an older feed entry and must be applied by revision/idempotently.
- No receipt/feed retention or purge policy; release storage budgeting remains
  required. Direct owner-table mutation is intentionally closed to avoid changes
  bypassing the feed. Service/admin SQL must use the same protocol or explicitly
  repair the feed; it is outside the app contract.

## Client contract

`lib/sync/history-mapper.ts` maps validated completed Core sessions to normalized
wire aggregates and back. Reuse the current Core reader rather than duplicate
its domain rules. Decode unknown input before use; reject active/invalid/partial
history and unordered/mismatched positions. Do not mutate caller objects or Core.

`lib/sync/history-rpc.ts` accepts an injected authenticated RPC caller; it does
not create another Supabase client/session. It validates revisions, decimal
bigint cursors, page ordering, response identity and complete mapped aggregates.
Safe `auth/conflict/invalid/retryable` errors contain no provider payloads/tokens.
No automatic retries, local writes, cursor advancement or networking on import.
Stable mutation IDs must be durably chosen by the later sync owner before send.

## Acceptance and activation gates

SQL contracts pin owner/anon/no-session access, CAS, changed-token rejection,
server-success replay, tombstones, malformed nested rollback, pagination,
large sequence precision, live snapshots and held owner transaction locks.
Jest pins Core round trips, duplicate nested IDs, zero/empty/paired strings,
optional data, large rest durations, malformed payloads/pages and safe errors.
CI tests foundation before the permission-tightening migration, then protocol
contracts on the final schema. Full app checks and iOS/Android JS exports pass.

Apply only reviewed/merged migrations remotely. The merged foundation may be
applied to the verified empty cresum-dev database; keep this PR's protocol
migration unapplied until integration. Never run CI bootstrap or fixture Auth
users against Supabase. Remote security/performance advisors follow application.
