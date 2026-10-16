# History Conflict Resolution — proposed design

Status: UX approved by the user on 2026-10-16 after the simplified explanation.
Implementation and native/device acceptance remain pending.
Base: develop 505a0692e0f444f400db8e383e3ab26246304ec2 (merged #56).

## Purpose and success

Let a signed-in user resolve a disagreement between a completed local workout and
its cloud counterpart without automatic replacement, account reassignment or
loss caused by retries. Offline logging, Finish, existing file backups and
active-session recovery remain independent. An ordinary distinct-workout merge
continues automatically; the new screen is only for genuine conflicts.

## Alternatives and recommendation

1. Approved: automatic ordinary merges, explicit per-workout choice of device or
   cloud only for divergence, Decide later, and Keep both in additional actions.
2. Keep both only: conservative, but creates unwanted duplicate history and does
   not let users correct an erroneous version.
3. Automatic newest-wins: fewer decisions, but timestamps do not establish which
   workout data is correct; reject this approach.

## Entry and comparison

Profile → Account & Sync shows Review conflicting workouts when applicable.
The dedicated scrollable page lists conflicting completed workouts. Selecting one
shows This device and Cloud cards, followed by a readable exercise/set comparison.
Show original date, workout name, completed sets, logged weights/repetitions and
volume where the existing domain calculation supports it. Show differing values,
not invented last-edited times. Missing or unsupported values remain explicit.

### Identity and time after the UUID discussion

New app-started workouts now use UUID v4 after merged #56. Preserve existing
IDs. A Keep both/deletion-copy operation creates its new UUID once and persists
it before side effects; restart/retry must reuse it. Different IDs remain distinct
workouts, while the same ID with divergent content needs revision-aware handling.
UUIDs are not chronological sequence numbers and do not select the correct data.

Show the existing workout date/time to identify the session. Distinguish it from
the time of a later edit and from server receipt time. The first resolver must
not fabricate edit timestamps from workout time, sync time, file time or UUIDs.
Show an edit time only when explicit per-version metadata supplies it, label its
source/device and preserve unknown for older data. Otherwise display Time of edit
unknown. Device clocks can disagree; a server can receive an older offline edit
later. Do not preselect a version or mark one Correct based only on timestamps.
New reliable edit-time tracking is a separate metadata contract to define before
implementation if included; this draft does not assume that it already exists.

No default resolution is selected. Present two equal Keep this version actions
under the device/cloud versions and Decide later. Keep both as separate workouts
is under More options, with an explicit duplicate-statistics warning. A final
confirmation names the selected outcome. Back/cancel changes nothing. Reuse BrandHeader,
AppScrollView, theme tokens, shared cards/buttons, wrapping and ≥44pt targets.
Cover loading, offline/error/retry, stale comparison, saving and resolved states.
Sign Out remains available; leaving a page does not discard a committed operation.

## Choices for two live versions owned by this account

- Keep both: keep the cloud version at the original ID and preserve the device
  version as a new completed-workout ID. Retain its original training data/date.
  Explain before confirming that both workouts will count in History/Progress;
  do not silently deduplicate or exclude either from analytics.
- Use this device: replace the cloud version with the displayed local snapshot
  only through the existing revision-checked publication. Confirmation explicitly
  states that the displayed cloud version will be replaced.
- Use cloud: replace the displayed local snapshot only after a fresh verified
  account-scoped cloud read and local-reference/hash checks. Confirmation explicitly
  states that the device version will be replaced.

Keep both preserves both versions. The two single-version actions intentionally
replace the unselected version after explicit confirmation; they do not promise a
hidden permanent archive. Existing local export remains available before choosing.
No bulk resolve or automatic selection in this version.

## Deletions and identity boundaries

For a cloud tombstone, show Deleted in cloud rather than an empty workout card.
Offer Keep device workout as a new copy or Accept cloud deletion, with explicit
local-deletion confirmation for the latter. Never revive the deleted original ID.
The retained copy becomes a new identity and can be uploaded safely.

Other-account ownership is not a normal two-version choice. Do not reassign the
known local workout or upload it to the current account. Explain that it is linked
to another account and offer return/sign-in guidance. Do not expose another
account's cloud contents. Active-workout ID collisions also block replacement;
the active workout remains untouched. These cases do not claim Synced while
unresolved; automatic ID migration is outside this step.

## Protocol and state boundaries

Add an authenticated lookup RPC for the current user's latest snapshot/tombstone
and an atomic resolution RPC. Reuse existing snapshot mapping, account-bound
transport and SQL authorization conventions.
No service-role credential, second auth client or direct privileged client write.
Migrate via reviewed versioned SQL; no live deployment during design.

Extend the existing coordinator through focused comparison/resolve methods; keep
presentation free of storage/network logic. A comparison captures account ID,
local canonical hash/reference and remote revision/hash/deletion. Refresh when
opening and revalidate when confirming. Changed local content, a newer remote
revision or a CAS rejection invalidates the choice and shows an updated comparison;
never apply the old choice automatically to an unseen version. Read-only choices
are verified against the latest available remote snapshot at application time;
there is no claim of a cross-device lock against later edits.

Persist a metadata-only resolution intent before side effects: account generation,
original/copy IDs, choice, compared hashes/revision and stable operation/device ID.
No workout payloads or auth tokens enter device sync metadata. Keep the source
workout locally until the server transaction succeeds and Core replacement is
verified. A retry reuses the exact request and copy UUID.

The resolution RPC serializes on the existing owner transaction lock and checks
the compared remote revision. It either publishes the chosen device snapshot,
accepts the current cloud snapshot/tombstone, or publishes a new copy while keeping
the cloud original. The operation and replay receipt commit together. Store the
selected response snapshots in the private server receipt so a timeout/restart
can retrieve the exact authorized outcome, even after later cloud edits. This
adds server receipt storage cost; capacity/retention remains a release gate.

After the RPC result, verify one Core history merge containing the selected
original and optional copy, persist observed facts, acknowledge superseded intents,
then clear the resolution intent. A failed/ambiguous local write stays pending.
Restart recognizes already applied hashes and reuses a preserved copy as the
source if the original has already been replaced. Clear only the resolved
conflict; retain unrelated workouts/conflicts. New local changes or a stale CAS
stop for a fresh comparison rather than replaying a changed request body.

All steps retain live auth/epoch guards and existing serialized metadata/Core
writes. Sign-out, reset, import and full restore invalidate comparisons and fence
late completions; recovery drains writes without waiting on network. Replacement
continues to persist cloud pause. Recovery must retire stale resolution intents
without carrying chosen replacements or obsolete copy operations across a new
local-data generation. Owner claims remain retained and never reassigned.
Corrupt/future resolution metadata fails cloud closed while Core remains usable.

## Verification and acceptance

Tests must cover all choices, cloud deletion, duplicate analytics disclosure,
lookup ownership/anonymous denial, stale local/remote comparisons, CAS races,
server-success timeout, restart at each durable phase, exact copy-ID reuse,
silent/rejected/commit-then-reject writes, active/other-account collisions,
sign-out/account switch and import/reset/restore during held network requests.
Include actual Account-page actions and a real PostgreSQL protocol scenario.
Run full project checks, SQL contracts and sequential iOS/Android JS exports;
review and PR target develop, with user-controlled merge.

Physical-phone, accessibility, native-build, real SMTP and two-device acceptance
remain separate gates. Domain/SMTP and independent disaster recovery remain
previously deferred. No account deletion, active-workout sync, custom routine sync,
new analytics algorithm or unrelated product expansion is included.
