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
