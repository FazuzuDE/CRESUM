# Account deletion: server foundation

## Intent and staged delivery

After merged #59, continue the account-management roadmap with a focused server
foundation. The next separate PR connects Profile confirmation, durable sync
pause, session cleanup and recovery. This PR must not expose a working-looking
client button or deploy/delete a live account.

## Contract

`POST /functions/v1/delete-account` accepts JSON containing exactly
`confirmation: "DELETE"` and `expectedUserId: <UUID>`. The expected ID identifies
what the user confirmed. It is never the deletion authority. A Bearer access
token must resolve through Supabase Auth `getUser(token)` to a non-anonymous
user with exactly that ID. The server alone holds the service-role key and
calls `auth.admin.deleteUser(verifiedId, false)` for hard deletion.

Reject missing/invalid auth, anonymous users, malformed/oversized requests,
account changes and upstream failures without deleting anything else. Cap the
streamed JSON body at 2048 bytes. OPTIONS is a no-op CORS preflight; only POST
can request deletion. Responses are small fixed JSON with no upstream errors,
account details or credentials, with Cache-Control: no-store. Success is exactly
`{deletedUserId: <verified UUID>}` after acknowledged hard deletion. A lost reply
or later 401 is not proof of success and cannot produce a false success result.

Existing auth.users foreign keys cascade through devices, completed workouts,
exercise/set snapshots, private change feed and mutation/resolution receipts.
Prove this in a disposable PostgreSQL contract using populated accounts A/B,
including same workout IDs. Deletion must leave B unchanged. Former A credentials
must not recreate A data after deletion. Authenticated/anonymous SQL roles cannot
delete auth users directly. No new schema migration is required.

## Boundaries and acceptance

Local active workouts, routines, History, file copies, account provenance and
app behavior remain unchanged. Do not promise removal of exported files, other
devices' local copies, platform logs or backups. Platform backup retention and
release privacy wording remain separate work. Storage objects are not used by
CRESUM; a future owned object that blocks Auth deletion must fail safely, never
be silently reassigned or broadly purged.

Use Node 22.16.x/npm 10.x, existing SDK version 2.117.2 for the Deno entrypoint,
no new app dependency, and no privileged frontend credentials. Handler behavior
is tested in Jest. Exercise the actual entrypoint with a mocked SDK/Deno boundary
as well, including hard-delete flag and verified target. Existing CI runs server
and SQL contracts. Do not deploy until this source is reviewed/merged.

## Follow-up client design

Profile > Account & Sync > Delete account. Confirm the named account and warn
that its cloud history is permanently deleted, while local workouts/files stay.
Pause/drain sync durably before the request, fence account changes and stale
replies, clear only the deleted account session after confirmed success, and
keep provenance to prevent retained A workouts leaking into B. Ambiguous failures
retain a pause and truthful recovery path. Offline Core stays usable. This client
flow is a separate deliverable, not acceptance claimed by this server PR.

## References

- https://supabase.com/docs/reference/javascript/auth-admin-deleteuser
- https://supabase.com/docs/guides/auth/managing-user-data
- https://supabase.com/docs/guides/functions/auth-legacy-jwt
- Supabase changelog checked 2026-10-16, including upcoming CBC TLS retirement.
