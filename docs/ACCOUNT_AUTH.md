# Optional CRESUM Account — Stage 1

This branch integrates the frozen `feature/account-auth-foundation` checkpoint
`618c7e202ec5e673a404c382c5438b3730682adf` onto develop after merged #51.
Implementation is prepared; real Email OTP and physical-device acceptance remain
unverified. Cloud workout backup and sync are not implemented by this stage.

## Behavior

Profile → **Account** opens the dedicated account page. An account is optional;
onboarding, workouts, History, Progress, local exports/imports and recovery do
not wait for authentication. With missing public config, the page explains that
Email sign-in is unavailable. Apple and Google are visible, disabled future
entry points.

Email uses a six-digit code inside the app. Sending a code does not authenticate;
the approved development-project expiry is 600 seconds (10 minutes). Only a
verified session connects the account. Invalid/expired codes, network
errors and rate limits leave the current local training data intact. Repeated
button presses do not overlap requests. A newer signed-out event wins over an
older pending verification result.

One auth owner lives above LocalDataGate. Local import/restore may reload Core
repositories without recreating the auth client. React effect replay does not
dispose that live owner; real unmount unsubscribes and disposes once. Native
refresh follows foreground/background state, including SDK initialization that
finishes after backgrounding or disposal. Full SDK disposal closes web broadcast
channels and subscribers as well as refresh timers.

The separate `cresum_auth_v1` session storage is excluded from Core backup,
additive History import and Reset local data. **Sign Out** does not reset workout
data. **Reset local data** does not sign out; its confirmation says so. A connected
account explicitly says **Cloud workout backup is not enabled yet**.

## Verified setup checkpoint — 2026-10-15

Following explicit user authorization, the existing `cresum-dev` project was
restored from its paused state. Healthy status and a read-only database query
were verified. Its modern public client key and URL are configured in the
ignored local environment file; build environments still require their own
configuration. No secret or service-role key is used by the app.

The user explicitly confirmed changing Email OTP length from 8 to 6 digits
and expiry from 3600 to 600 seconds. Both saved values were verified after
reloading the Dashboard. Email authentication and email confirmation remain
enabled; Apple/Google remain disabled.

Custom SMTP is still disabled. The existing sign-in template sends a link,
and the Dashboard blocks template editing on the free built-in email service
until custom SMTP is configured. The user does not yet own a domain. Domain
selection/registration, Resend verification, SMTP configuration and both signup
and sign-in OTP templates remain outstanding. No real OTP email has been sent;
this checkpoint does not establish working end-to-end email sign-in.

The user deferred domain purchase and mail setup after merging #52. Continue
the dormant cloud foundation independently; this does not waive real OTP or
native session acceptance before release.

## External setup — required before real OTP acceptance

1. Use a test Supabase project and enable Email authentication. Configure a
   six-digit OTP with a 600-second expiry and an email template containing
   `{{ .Token }}` for the relevant
   sign-in/signup email flows. A magic-link-only template does not match this UI.
2. Configure the agreed custom SMTP delivery path (domain → Resend → Supabase
   custom SMTP). This PR does not create accounts, buy a domain, change DNS/SMTP
   settings or send real email.
3. Set only `EXPO_PUBLIC_SUPABASE_URL` and
   `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in your local/build environment. They
   are public client values included in the app bundle. Never put a secret,
   service-role key, SMTP password or database credential in an EXPO_PUBLIC
   value or commit it to Git.
4. Rebuild/reload using those public values. No auth values are required to run
   local Core. Keep credentials and tokens out of logs, screenshots and support
   exports.

Official references:

- [React Native setup and lifecycle](https://supabase.com/docs/guides/auth/quickstarts/react-native)
- [Passwordless email OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless)
- [Email templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)

## Native acceptance — pending

- Request/receive a code, verify it, relaunch and confirm session restoration.
- Wrong/expired code, resend, rate limit and offline network failure remain
  recoverable; no premature connected/synced state.
- Background/foreground and repeated navigation leave one session owner.
- Sign Out preserves active workout, History and routines; local reset preserves
  the account session; export contains no session tokens.
- Local backup/import/restore work while auth is loading or unavailable.
- Review phone keyboard, scrolling, safe area, VoiceOver and Dynamic Type.

Automated tests use fakes and do not prove mail delivery or real refresh/session
behavior. Database migrations/RLS and History merge/upload/download follow as
separate PRs after the account foundation is accepted.

## Account deletion — server foundation after merged #59

The focused server branch supplies `supabase/functions/delete-account/index.js`
and its pure `handler.ts`. It is not deployed or connected to a Profile button
by this delivery. `supabase/config.toml` declares the JavaScript entrypoint and
`verify_jwt = true`. Keep the Edge gateway JWT check enabled when deploying the
reviewed source, and verify its compatibility with the project's signing keys.
The handler also validates the Bearer token through Auth `getUser(token)`.

`POST /functions/v1/delete-account` requires JSON
`{"confirmation":"DELETE","expectedUserId":"<confirmed account UUID>"}`.
Only the verified, non-anonymous matching user can be the target. The service-role
key stays in the server environment; the entrypoint pins SDK `2.117.2` and uses
`auth.admin.deleteUser(verifiedId, false)`. Success returns only
`{"deletedUserId":"<verified UUID>"}` after acknowledged hard deletion.
Anonymous, expired, mismatched, invalid and oversized requests never authorize
another account. Upstream failures return generic errors without claiming success.

Existing database cascades remove devices, completed History, exercise/set
snapshots, private changes and mutation/resolution receipts. A disposable SQL
contract populates A/B, removes A and checks every B row is unchanged. No schema
migration, live user fixture, production deletion or deployment is part of this PR.
Local workouts, active sessions, routines, backup files and provenance are untouched.
Deletion does not erase exports, other devices' local copies, or platform logs/
backups. CRESUM currently owns no Storage objects; any future object ownership
that blocks Auth deletion must return a failure, not a false success or broad purge.

The next client PR must add explicit account-named confirmation, durable sync
pause/drain before deletion, owner/session fencing, matching-session cleanup and
an honest ambiguous-response recovery path. Preserve local data and account
provenance. Deleted users' JWTs can remain cryptographically valid until expiry;
SQL tests also verify they cannot repopulate the deleted owner's cloud records.
Native two-device/session acceptance and release retention wording remain open.

## Account deletion — Profile client after merged #60

PR #60 merged at `6661552099f2b60ed61feca164a68d51582aa203`.
The client follow-up adds a quiet destructive **Delete account** action in
Profile > Account & Sync. Its confirmation names the current account, requires
typing **DELETE**, and explains permanent cloud deletion while local workouts,
routines and saved files remain. Exported files, other devices' local copies and
provider backups are explicitly outside this action. Confirmation resets on an
account change, and overlapping taps/auth actions are fenced.

The action defaults unavailable until a build explicitly sets
`EXPO_PUBLIC_ACCOUNT_DELETION_ENABLED=true`. This is a rollout flag, not server
authorization. Deploy and verify reviewed server source and signing-key/gateway
compatibility before enabling it. No environment configuration, deployed endpoint,
live deletion or native acceptance is claimed by the client PR. Domain/SMTP setup
remains deferred. Only the public client key is used by the app.

Before a request, durably verify a per-owner **pending** record under
`cresum_account_deletion_v1`, then pause/drain the existing cloud coordinator.
Only a matching captured session token and confirmed account ID reach the HTTP
endpoint. Timeout/abort, non-success or a mismatched acknowledgement never imply
success. Pending deletion fences all sync/Resume for that owner, including after
restart; it does not automatically retry the destructive request. The user can
explicitly retry from the same account or continue using offline Core/sign out.
If that session has expired, signing into a newly created account with the same
email is not proof of the old request's outcome and never deletes the new UUID.

A verified server acknowledgement is recorded as **confirmed** before matching
session cleanup. The SDK storage adapter and journal share a serialized queue
(plus an origin lock for cooperating browser tabs). Cleanup removes only a
session whose stored user ID matches the deleted owner. It does not call a late
unbound SDK signOut that could clear account B. Confirmed-owner session writes
and stale identity events cannot restore the deleted account. Metadata contains
IDs/statuses only, no tokens, email addresses or workout payloads. It stays outside
Core export/import/restore/reset, alongside retained history ownership provenance.

Confirmed cleanup retries are local-only and never repeat cloud deletion. Startup
finishes matching confirmed cleanup before SDK creation. Corrupt/ambiguous journal
storage blocks account traffic with Retry account setup while offline Core remains
available. Unknown stored session ownership is not silently erased by cleanup.
A late successful A response records A's outcome without signing out or announcing
deletion of B. Core restore/remount, active sessions and file copies remain intact.

Tests cover the actual App/hook/coordinator fence and persisted Core, restart,
backup exclusion, owner-specific session storage, journal corruption, timeout,
confirmation and account switching. Additional real-entrypoint SDK returned-error
and thrown-error cases close the nonblocking coverage follow-up from #60.
Real Deno/gateway, test-user deletion, mail, physical-device and retention acceptance
remain separate rollout/release gates.

## Account deletion deployment checkpoint — 2026-10-16

PR #61 merged at `16e7f1d64af4a051bd6d2d71a7e1812a30b994a3`.
Following user approval, reviewed `delete-account/index.js` and `handler.ts`
were deployed to `cresum-dev` (`gmpitmpydhvrufjcptqr`, eu-west-1).
The function is **ACTIVE**, version **1**, with **verify_jwt=true**. Deployment
bundle SHA-256 is `8d678bed9949523cd965d31bd069b710f052a1f4164af4be775df42a41fb68dc`.
Reading back both deployed files confirmed exact equality with merged source.

Live HTTP probes verified OPTIONS returns 204 with CORS and no-store headers;
POST without a user session, with a malformed token, or with the public key
incorrectly supplied as Bearer returns 401. These prove deployed availability
and unauthenticated rejection, not successful user-JWT compatibility or deletion.
Read-only counts before and after were zero Auth users and zero completed
workouts. No user, workout, email, schema migration or secret configuration was
created or changed by these probes.

The build rollout flag remains **off**. The connected Supabase tools provide no
Auth user creation/sign-in operation, and there is no test-user session available.
Next verify a separately authorized disposable user's actual session JWT,
wrong-owner rejection, acknowledged self-deletion and subsequent Auth rejection.
Only then enable the build-time flag and perform physical-device/local-data and
two-account acceptance. Do not treat an anon/public key or mocked session as a
substitute. Domain/SMTP and independent recovery remain deferred release work.
