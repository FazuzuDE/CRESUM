# CRESUM — Workout sharing and plan library

Status: approved by user on 2026-10-23. Approved inputs: trainer/student and in-app library
scenarios, revised four-screen visual direction, Start plus square Share action,
and link-based access without recipient account binding (2026-10-23).
The user approved the complete specification after review; the implementation plan is separate.

## Intent and scope

A trainer creates a reusable workout plan, shares it by URL or QR, and a student
previews and saves an independent local copy. A curated CRESUM plan library uses
the same preview/import mechanism. Core logging stays offline and account-optional.
Sharing a plan does not share completed history, profile, records or body data.
No trainer dashboard, assignments, feedback, messaging, payments, automatic plan
updates or public user submissions in v1. A plan represents one workout template;
multi-week schedules remain separate from the existing program assignment model.

## Approaches

- Embedded file/QR: offline payload transfer, but larger plans make QR unreliable
  and there is no central revocation or common library. Deferred optional export.
- Short URL plus QR: one server-backed snapshot powers both handoff and library.
  Initial download requires internet and a configured HTTPS host. Recommended;
  the user's link-based access choice and approved screens follow this direction.
- Account-bound student assignment: stronger recipient restriction but requires
  student sign-in and a coach/student relationship. Explicitly deferred by user.

## Trainer and student interaction

On a saved plan, a wide Start workout button sits beside a square Share icon.
Sharing requires author sign-in; local creation and starting do not. Account is
used for ownership/revocation, not a separate privileged trainer role. Any signed-in
user can share their own plan. Do not imply professional verification of authors.
If offline, keep editing/starting available and explain that creating a link
needs a connection. If account mail delivery is not ready, keep publishing gated.

The sharing screen previews the plan and has Include working weights (off by
default), QR, Send link, Copy link and Disable link. QR contains exactly the URL,
not the plan payload or any auth credential. Clearly state that anyone with the
link can access and forward it. No automatic expiry in v1; the author can revoke.
Revocation prevents new fetches, not retrieval of data already downloaded/copied.

Student opens a link/scans QR, sees plan content, then explicitly imports it.
No recipient login. Scanning never starts a workout or imports without confirmation.
For a new plan offer Add and start plus Save for later; once imported offer Start
workout and Open saved copy. The revised first-screen Start/Share layout applies
to saved plans. Starting uses the existing session engine only after durable save.
If another workout exists, offer Continue current workout or Cancel; never replace
it. The new plan can still be saved for later. Starting twice cannot duplicate
sessions. If save succeeds but start fails, retry starting the already saved copy.

Import assigns a new local template ID, preserves exercise order and creates no
History entry. Track origin publication/version alongside the local template for
idempotency: repeated import opens the existing copy by default. An explicit Make
another copy action may create a second copy. Edited local copies are not overwritten.
When a saved copy is deleted, importing again may create a new copy.

Author publishes an immutable snapshot. Reopening Share for an unchanged payload
reuses its active publication; changed plan/weight inclusion publishes a new
version/link with explicit notice. Existing links keep their old snapshot until
individually revoked; local recipient copies never update automatically.

## Payload and compatibility

Use a versioned allowlisted transfer object, never serialize the whole WorkoutState.
Include title, ordered canonical exercise IDs, planned set counts, optional target
rep/rest ranges, per-side semantics and optionally normalized planned weights with
an explicit kg unit. Do not include local session IDs, completion timestamps,
program assignment state, personal history, last performed weights or user profile.
Stable exercise IDs resolve to localized catalog labels on each device; custom
plan titles remain verbatim. No free-form executable content or remote image URLs.
Untrusted provenance/source references must not masquerade as reviewed evidence.

Existing WorkoutTemplate/PlannedExercise support order, sets, optional weight and
ExerciseTarget, but targets currently require program provenance. Add a distinct
transfer representation and a reviewed adapter; do not fabricate programId or
research sourceRefs to satisfy that type. Locally imported plans do not count as
installing an official program. Preserve backward compatibility of saved templates.
Add optional origin metadata with corresponding backup/restore validation; legacy
backups without it remain valid. Origins never grant author access to student data.

Validate server-side on publication and client-side before preview/import: exact
schema version, no duplicate exercise IDs, 1–50 exercises, 1–30 sets each,
nonempty title up to 120 characters, finite bounded numeric targets/weights and
payload at most 64 KiB. Rep bounds 1–1000, rest seconds 0–3600, kg 0–2000; require
min <= max. The builder may tighten these to current domain validator limits.
Unknown IDs, unsupported measurement types or schema versions block import with an
update/compatibility message; never drop exercises silently or remap by name.
V1 publishes only supported catalog variants and fields the app actually persists.
The mockup's adjustable bench-angle chip is illustrative: no arbitrary angle/grip
editor or new muscle-evidence claim is authorized by sharing. Do not offer dynamic
configuration unless a separately implemented stable variant represents it.

## Backend and links — proposed design

Use the existing Supabase project/client boundary with new sharing entities,
separate from private completed-history sync tables. Migrations define author-owned
publications, immutable payload revisions, token hashes, revocation and curated
library entries pointing to snapshots. Public callers cannot list coach publications.
Public access goes through a bounded read endpoint requiring a high-entropy random
token (at least 128 bits), returning only the transfer DTO. No public table SELECT
policy that exposes all shared payloads. Authors can list/revoke only their own
publications. Library publication is restricted to a server-controlled administrator
capability; never trust user-editable auth metadata or client role flags.
No service-role key in the app. Use explicit grants/RLS and authorize every write.

Opaque HTTPS links use a configurable production host and a fixed sharing path.
Validate host/path/token before resolution; pasted arbitrary URLs must not trigger
arbitrary network fetches. Redact token paths/query from diagnostics and analytics.
Apply bounded request sizes, author publication limits and endpoint rate limiting;
the builder selects deployment-compatible values and verifies the boundary.
External service credentials are not placed in migrations or source control.

An installed native app opens the preview using verified universal/app links.
The HTTPS fallback shows the same public preview plus honest install/open guidance;
no claim that the plan survives store installation automatically. Keep Copy link
and Paste link as camera-independent alternatives. Native scanner requests camera
permission only on use; denial/error leaves paste available. HTTPS hosting, domain
ownership, universal-link association and native build configuration are explicit
rollout dependencies, not completed setup. Existing cresum scheme is a development
route, not proof that system-camera production links work. Unconfigured builds
hide publishing/library network actions rather than generating unusable links.

## Library

Separate plan library from the existing Exercise Library. Entry from saved Workouts;
show My plans and Library with a Scan/Paste action. Offer search and curated filters
for goal, experience and equipment. Card content includes title, equipment, number
of exercises and source; duration appears only when explicitly authored/estimated.
Only reviewed CRESUM plans in v1; existing starter plans are candidates, not
automatically published. All library entries receive EN/RU/DE/FR title/description
metadata before publication. Adding downloads a copy through the shared importer.
Offline display can use a last successful library cache clearly marked as cached;
new downloads require connection. Previously imported plans remain usable offline.
Withdrawn entries disappear from new browsing, without deleting saved copies.

## States and quality

Handle loading, offline/no cache, no results, invalid QR/URL, denied camera,
revoked/not-found link, incompatible plan, unauthenticated author, rate limits,
network/persistence failure and successful import. Never show partial imports or
claim a native share-sheet dismissal proves delivery. Persist first, then report
success. All app copy and accessibility labels ship together in EN/RU/DE/FR without
enabling languages still gated by current release acceptance. Maintain 44px targets,
screen-reader order, Dynamic Type and narrow-phone layouts.

## Delivery and verification

1. Transfer contract, adapters, idempotent durable local importer and origin backup
   compatibility, plus saved-plan Start/Share and recipient preview states.
2. Owned publication/revocation service, URL resolution, QR display and native
   scanning/paste; HTTPS fallback and real device deep-link validation.
3. Curated library metadata, browsing/filter/cache and same importer.

Keep network feature flags off until service/configuration acceptance. Verify
malformed payload boundaries, unknown IDs, cross-author RLS, anonymous token-only
reads, no enumeration/history leakage, revoked links, repeat requests, independent
copies, start/save failures and active-session preservation. Run repository quality
checks, database policy tests and native exports. Actual device QA must cover QR
from camera and in-app scanner, permission denial, background/open routing, offline
execution, large text and screen readers. Test link forwarding as an intentionally
supported behavior. Never claim deployed or end-to-end verified based on mocks.

## Acceptance and remaining external setup

Success: a signed-in author publishes a supported plan, an unsigned student opens
it from QR/link, previews, saves and starts it without losing another active
session; the same importer accepts a curated library plan and works offline after
save. Revoking prevents fresh access but preserves imported copies.
Domain/hosting selection and real OTP delivery require setup before public rollout.
The builder owns file/component boundaries and exact endpoint/library implementation,
subject to current official Supabase/Expo guidance checked before implementation.
