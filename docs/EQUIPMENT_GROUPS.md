# Equipment picker and attachment groups

The feature adds an exact compact ergonomic pulldown variant with a local Male
START/FINISH pair and attachment image. Configuration uses one tappable equipment
row and a compatible-choice sheet. Enter count/weight/repetitions, add a block,
configure another attachment, then commit the complete station. Individual rows
remain editable; browsing, cancelling and failed saves preserve drafts. Editing
a plan never rewrites active/completed snapshots.

Current choices are the compact ergonomic handle, existing chrome V-handle and
wide pronated bar. Medium/wide ergonomic geometry is not inferred. Missing images
stay explicit placeholders. Required pulldown attachments cannot be omitted.
The optional-none policy is supported only for reviewed optional registries;
unknown metadata does not mean equipment is unnecessary. Step-up's reviewed
no-additional-accessory state still requires its primary platform.

## Data boundaries

Storage/analytics retain flat exact-variant children. Frozen optional
`exerciseGroup` metadata projects one station for navigation and display.
`plannedSets` retains individual prescriptions. Synthetic combined program rows
are presentation-only: six real sets produce six factual counts, and records/
previous performance remain exact-variant-specific. Moves preserve the station,
its children and exact current selection. One block per variant is supported;
repeated additions append to that block, with a maximum of 20 rows.

Local sessions, templates, restart recovery, History mapping, backup and shared
plan V2 preserve the metadata. Backup V2 is used when groups/per-row prescriptions
are present; otherwise legacy V1 remains available. An old application cannot
read group-bearing backups: update it rather than lose metadata.

## Verification

The implementation's automated gate passed 142 suites / 1115 tests, TypeScript,
ESLint, Prettier, anatomy generators, localization contracts, Expo configuration
and dependency checks. Focused screen/domain cases cover exact second-child
editing/completion, six-row presentation, draft retention, failed atomic append,
outside duplicates, group reorder and versioned roundtrips. Both iOS/Android exports passed. All six independent-review findings were fixed with reproducing tests; see
[review and decisions](qa/equipment-picker/review.md).

The reproducible browser smoke uses the actual exported app at 320/390px in
EN/RU/DE/FR. It checks configuration/selection/dismissal/focus, saved presets,
active-session isolation, set editing, History/reload, image decoding and visible
horizontal overflow. It blocks external network requests and enables unreleased
locales only in the served QA bundle; production locale flags are unchanged.

```sh
npx expo export --platform web --output-dir .tools/equipment-web-export
node scripts/equipment-web-qa.cjs
```

Playwright and Chromium must be available to that development environment;
`PLAYWRIGHT_MODULE` and `CHROMIUM_PATH` optionally point to installed tools.
Reports/screenshots are written to `.tools/equipment-qa/`. The checked-in
[report](qa/equipment-picker/report.json) records all eight scenarios and the
source/export hashes. [Picker](qa/equipment-picker/ru-390-picker.png) and
[configuration](qa/equipment-picker/ru-390-configure.png) screenshots show the
actual app with local test data, not generated mockups. The browser assertion
also guards against intrinsic artwork height overriding the square phone frame.
This is not physical iOS/Android gesture, VoiceOver/TalkBack or Dynamic Type
acceptance. All of those remain release gates, as do RU/DE/FR activation and
unproduced Female/other-attachment artwork.

## Mixed-version cloud behavior

New readers/writers negotiate `historyProtocol: 2` and call versioned `*_v2`
History RPCs. Legacy get/pull/publication/resolution endpoints reject a grouped
entity or page before an old application can discard its metadata. They also
reject legacy writes that would erase an existing group. Ordinary legacy-only
history remains supported. After separate backend activation, older clients
must update to sync a page containing groups; unsupported new-client group
uploads against an old server remain local while other workouts continue.

## Separate backend activation checklist

Nothing in this feature deploys or authorizes a live database/Edge update.
Until support is deployed, grouped workouts/plans remain local with localized
pending status; other workouts can still sync. Do not strip groups or claim a
successful grouped publication against an old server.

1. Review migration `20261025212900_exercise_attachment_groups.sql` against the
   actual deployed migration history. Confirm current private writer/validator
   signatures and take the usual recoverable database checkpoint.
2. Apply it first to disposable/staging data. Run existing foundation/history/
   conflict/sharing/account-deletion contracts and
   `supabase/tests/exercise-attachment-groups.sql` and
   `supabase/tests/exercise-group-protocol.sql`. Check owner RLS, no direct
   authenticated writes, revision/idempotent retry, exact readback and legacy
   records. The local PGlite contract pass is evidence, not staging acceptance.
3. Deploy the matching shared-plan Edge handler and generated family catalog.
   Confirm authenticated capability RPC and public capability response agree,
   V1 remains supported, and V2 is rejected while capability is unavailable.
4. Exercise two authenticated owners/devices, grouped upload/download, retry,
   backup restore, share/import with and without weights, unavailable variant
   handling and conflict resolution without field loss. Never test by modifying
   a user's real workout.
5. Activate only after those checks and explicit deployment authorization.
   Do not revert the additive column by deleting stored group metadata; disable
   the capability/write path and preserve the data if rollout must pause.
