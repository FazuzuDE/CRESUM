# Workout sharing — implementation and rollout

The approved design is in `superpowers/specs/2026-10-23-workout-sharing-design.md`;
the task plan is in `superpowers/plans/2026-10-23-workout-sharing.md`.

## Behavior

Profile → WORKOUTS → Workout plans opens saved-plan details and a plan-library
entry. A saved plan has independent Start and square Share actions. Custom plans
can use the existing editor. Shared imports create independent copies, with
durable saving before starting, origin-based retry deduplication, and an explicit
another-copy action. Existing active sessions are never replaced. Plan copies
and authored numeric targets survive local backups and restore. History import
still imports only History. Existing official program targets keep their evidence
provenance; authored targets never fabricate it.

Sharing requires author sign-in. Recipients do not sign in. The QR encodes the
same HTTPS link used by Copy/Send; anyone possessing it may forward it. Editing
publishes a new snapshot. Old links stay active until disabled, including from
the author's active-links list. Disabling a link cannot erase downloaded copies.
The library is curated; no user publishing, trainer messaging or result monitoring.

## Configuration — disabled by default

Network actions require all of:

- `EXPO_PUBLIC_SHARING_ENABLED=true`
- `EXPO_PUBLIC_SHARING_HOST`: an owned HTTPS hostname, without a scheme or path
- Existing `EXPO_PUBLIC_SUPABASE_URL` and publishable key
- Applied sharing migration and deployed `shared-plan` Edge Function
- Server-only `SHARING_ENCRYPTION_SECRET`, at least 32 random characters, plus
  Supabase-provided service URL/key. Never expose either secret in public env.

Auth uses the existing client/session lifecycle and verifies the expected owner
both before requests and after responses. The function has `verify_jwt=false`
because recipient reads are public; it verifies JWTs with `auth.getUser` for all
author mutations/listing. Anonymous-auth identities cannot publish. Only service
role can execute sharing RPCs. Private sharing tables have RLS enabled and no
client grants. Stored token hashes support lookup; encrypted tokens support
idempotent author re-sharing without storing plaintext. Treat secret rotation as
a migration: losing the old key prevents recovering existing author URLs; public
token reads still work until individually revoked.

The endpoint enforces a persisted conservative global ceiling of 120 requests/min
as well as owner publication quotas of 30/hour and 500 active snapshots. This is
stricter than a per-IP-only limit and cannot be bypassed using forged forwarded
headers. Before large public rollout, add trusted-gateway source limiting and
load/capacity review; global saturation currently limits availability. No request
tokens or URLs are logged by the app/handler. Native share dismissal is not proof
of delivery. No endpoint returns completed history or author emails.

## Domain and native rollout dependencies

An owned domain is still required. Host the Expo web export with `/shared` and
root-route support on that host, and serve Apple association and Android
asset-links documents using the actual bundle identifier, team ID and signing
certificate fingerprints. Never publish fabricated values. `app.config.ts`
adds associated domains/verified intent filters only when sharing is configured.
After installing CRESUM, users reopen the original link; there is no deferred
store-install handoff. The HTTPS preview redirects to the app's common preview
and local-data gates; it must not instantiate another workout store.

Install a new native build for the camera plugin. Camera permission is requested
only when scanning; pasted links remain available when denied. The current native
permission string is English, matching the only release-enabled locale; localized
JS permission guidance exists for EN/RU/DE/FR. Native system permission localization
requires verification before enabling other release locales.

Custom SMTP/domain delivery and actual author OTP sign-in acceptance are still
pending. Do not enable public publishing merely because unit tests pass.

## Curated content

Server administrators populate `cresum_private.plan_library` through a trusted
deployment process; there is no client publication grant. Each entry points at
an immutable publication and contains `title` and `description` dictionaries in
EN/RU/DE/FR, `goal` (`build_muscle`, `get_stronger`, `general_fitness`),
`experience` (`beginner`, `some`, `experienced`) and canonical equipment IDs.
Set `published=true` only after reviewing the actual plan and translations.
No starter plan is automatically uploaded. Unpublishing/revocation blocks new
downloads; imported local copies remain. Cached metadata is marked offline;
downloading a new plan requires network access.

## Verification boundaries

Automated coverage includes DTO bounds, exact decimal strings, legacy aliases,
authored/official targets, durable import/write failure/retry, local origin and
backup compatibility, ownership/auth-response races, token-only reads and
revocation, URL validation, active-session preservation and library cache/filtering.
Database contracts run against every migration in CI. Test fixtures must never
be created in a real project.

Live deployment, native system-camera scans, signed-build universal links,
camera permission behavior, phone layout/Dynamic Type/screen-reader acceptance,
real OTP delivery and production content review remain rollout acceptance.
Keep network flags off until these are observed. No public service was deployed
as part of this local implementation.

## Independent review follow-up

Fixed incoming links during an ongoing restore: queue above the recovery subtree,
propagate live access readiness, and defer native modal/import/start until reload.
Incoming route navigation dismisses to an existing root rather than creating
a second root store. Revocation from either control invalidates the current QR.
Reopened plans offer Open saved copy and explicitly start the edited saved copy;
both previews display optional weights, per-side instructions and rest ranges.
Active links display creation time and a snapshot reference for selective revocation.

Deferred UI polish: library cards currently display title/description; equipment
is filterable, but equipment, exercise count and source should also appear on cards.
Full plan preview still precedes explicit import. Browser visual smoke was unavailable
because no browser executable could be obtained in this environment; a successful
web export is not visual acceptance.

Automated checkpoint (2026-10-23): Node22.16/npm10.9.2 quality command passed,
133 suites/1071 tests. iOS/Android and web exports passed. Isolated PostgreSQL
contracts and actual Edge-entry/handler/AES-GCM/RPC integration smoke passed.
The existing StrictMode `findNodeHandle` deprecation also appears on baseline;
it is not a new sharing failure. These checks do not activate deployment flags.
