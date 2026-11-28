# Competitive development specification — approved 2026-11-26

The owner approved these priorities. Existing behavior was audited against
[develop at `ced4a99`](https://github.com/FazuzuDE/CRESUM/commit/ced4a9982aa0df8eda8db11cc41ac87db38a7fca).
The targets below guide future implementation. Physical-device acceptance
remains pending. Preserve approved interactions and all registry locales.

## P0 — release reliability

### P0.1 Durable workout recovery

The [repository](../lib/workout-repository.ts) already serializes schema-v1
writes and migrates legacy data. The [store](../lib/workout-store.ts) retains
failed writes for retry. [Core tests](../lib/__tests__/workout-engine.test.ts)
exercise migration, persistence and write failure. Test process kill after
each edit, set completion and Finish; failed
writes, interrupted migration, duplicate Finish, background/foreground,
low storage and corrupted/unknown schema. Restore last durable state exactly,
never present a failed write as saved, never silently discard active data.
Preserve current V7 removal options and historical snapshots. Acceptance:
zero lost acknowledged sets, duplicate completions or silent resets in tests
and physical iOS/Android lifecycle scenarios.

### P0.2 Smooth interaction

The [back gesture](../components/BackSwipe.tsx) already respects Reduce Motion.
The [app entry](../app/index.tsx) retains Progress and Muscle Map across tab
switches. Profile release-like builds on physical iOS and Android, cold/warm image
loading, rapid tab switching, back swipe, large library, map and keyboard.
Measure frame timings, input latency and memory; proposed target at 60 Hz:
at least 95% of frames within 16.7 ms on agreed reference devices, no visible
blank image flashes or lost drafts. Record device/build and before/after traces.
Respect Reduce Motion; preserve glass layout, artwork dimensions and quality.
Do not claim a device pass from web or JavaScript export.
See the [P0.2 performance report](P0.2_PERFORMANCE.md) for implemented library
windowing, technique phase buffering, Chromium measurements and pending device
acceptance.

### P0.3 Fast set entry

The [entry sheet](../components/SetEntrySheet.tsx) already shows the previous
completed set at the same position and separates Save from completion.
[Set-entry logic](../lib/set-entry.ts) supports exact decimals, localized
digits, bilateral values and predefined increments by equipment type.
Add explicit Copy previous and Apply to incomplete sets. Protect completed
sets and keep completion explicit. Validate kg/lb behavior and configurable
increments without reinterpreting stored loads.
Proposed usability target: repeat prior values and complete a set in at most
two taps from focused exercise where valid values already exist. Test invalid
values, cancellation, navigation, locale switching and keyboard accessibility.

### P0.4 Locked-phone timers

The [engine](../lib/workout-engine.ts) stores a rest deadline and
the [workout screen](../components/Workout.tsx) refreshes its clock on app-state
changes. [Cardio](../lib/cardio-timer.ts) tracks elapsed time and a running
interval separately. Validate each timer across lock and resume. Investigate
native notifications and
permission-denied fallback; avoid duplicates on skip, finish or reset.
Acceptance: displayed elapsed/remaining time within one second of expected
on resume in controlled tests; device checks for lock, background, process kill,
clock changes, silent mode and denied notification permissions. OS delivery
is best effort, not an exact alarm guarantee.

## P1 — training value

### P1.1 RIR/RPE and double progression

The [calibration draft in PR #17](https://github.com/FazuzuDE/CRESUM/pull/17)
derives a starting load from an actual saved completed set for supported
external-load exercises. It remains separate from the shipped workout model
and from recurring progression. Reuse that constraint when designing optional RIR
(repetitions in reserve) and RPE (perceived effort) with unknown distinct from
zero. Propose next load only from comparable completed working sets of the
same exact exercise/equipment; target rep range and available load increment
are configurable. Example: 3 x 12 at 60 kg within 8–12 and adequate reserve
may suggest 62.5 kg. Otherwise retain load or suggest review; never infer
strength from demographics or prescribe maximal effort. Explain, override,
dismiss; store actual separately. Test missing feedback, failed sets, unit
conversion, paired/assisted/bodyweight variants and backup compatibility.
Exact thresholds and scale UX need review before implementation.

### P1.2 Equipment settings and historical notes

The [workout model](../lib/workout-model.ts) retains exercise identity and
per-workout snapshots. Store optional gym/equipment-specific seat, backrest, grip, other settings
and exercise/template/session notes. Copy defaults into a workout snapshot;
later edits never rewrite history. Distinguish settings from actual variant
identity and preserve old IDs. Test two gyms, repeated sessions, backup/import,
offline use and missing settings. Free text is never auto-translated.

### P1.3 Personal records and previous comparison

Existing [analytics](PROGRESS_ANALYTICS.md) cover safe volume, estimated
Epley 1RM, selected-period bests and top logged weight. Set entry already shows
the previous matching set. Add explicit lifetime and newly achieved PRs,
comparable rep records and an overview of the previous matching workout. Exclude
unfinished sets, distinguish zero-load/paired sets and estimated 1RM from
measured strength; no false PR after import or ties. Test source consistency
across History, Progress, Library and active workout.

### P1.4 CSV portability

The [backup implementation](../lib/local-backup.ts) uses versioned JSON. The
[History importer](../lib/history-import.ts) appends completed workouts by
stable ID and protects active workouts. Add CSV alongside JSON. Export completed sets
with stable IDs, timestamps/timezone, units, type, notes and optional metrics.
Design explicit adapters for Hevy/Strong first using verified sample formats;
others follow evidence. Preview mappings and duplicates, allow correction,
report skipped rows, confirm additive import atomically; never overwrite
active workout. Handle quoting, locale decimals, malformed/oversized files,
spreadsheet formula injection and repeated import. Test roundtrip of supported
fields and preservation of existing history; CSV is not full-fidelity backup.

### P1.5 Plate and warm-up calculator

The current editor adjusts entered weight by equipment type. Add a calculator
with configurable bar mass, plate inventory, unit and target total. For a
symmetric bar subtract bar mass then divide by two; show per-side plates and
achievable total if target impossible. Distinguish machine/dumbbell semantics.
Warm-up suggestions are optional, editable, conservative and marked separately
from working sets; no automatic completion. Test odd increments, kg/lb,
insufficient inventory and targets below bar mass.

### P1.6 Cardio and endurance

The [cardio screen](../components/CardioCountdown.tsx) already offers an
adjustable countdown and start/pause controls. Active workouts pause cardio
when changing exercises and [History](../components/WorkoutHistory.tsx)
shows measured duration. Build on this for endurance trends and optional
distance, pace/speed, resistance/incline and heart rate when supplied.
Distinguish planned and actual, elapsed and active time, manual and sensor
source; no fabricated calories or distance. Compare like equipment/units,
show time/distance/pace trends; no mixing with strength tonnage.
Test pause/resume, finish, reset, offline and missing metrics.

## P2 — platform integrations after Core gates

### P2.1 Apple Health and Android Health Connect

The current app has no HealthKit or Health Connect bridge. Design native
integration with least-privilege per-type permissions and
explicit opt-in. Start with supported workout export; evaluate read access
separately. Stable external IDs and provenance prevent duplicates/loops;
permission denial/revocation and offline use never block Core. No health
data upload to unrelated services. Verify current platform SDK/store rules,
privacy disclosures and real signed builds before acceptance.

### P2.2 Apple Watch and Wear OS

The current app has no paired watch client. Phase one covers the active
session, set completion and rest timer. Handle phone/watch
reconnection, offline queue, deterministic conflict resolution and duplicate
prevention. Define authority before coding; preserve phone-only logging.
Validate actual paired devices, locked phone, disconnected watch and
permission/battery behavior. Native build work is separate from Expo Go.

## P3 — discovery only until preceding gates

### P3.1 GPS, AI coach and nutrition

These are discovery items. Use separate specifications and PRs for route
recording, coaching and nutrition. GPS: explicit location consent, pause,
route privacy and battery tests. AI: opt-in, explainable history-based
suggestions, no medical claims, no automatic history mutation, privacy/cost
review. Nutrition: start with interoperability, sourced data and explicit
user entry; no unverified calorie or medical advice. No backend/vendor,
subscription, data-sharing or launch decision is approved by priority alone.

## Delivery rules

P0 first; P1 in focused PRs after affected P0 gates; P2 native feasibility
after stable Core; P3 discovery only. Existing approved localization/artwork
work and open PRs remain separate. Each PR: inspect current develop and tests,
avoid duplicate implementations, preserve history/offline behavior, translate
all new app text in every registry locale, run npm run check and affected
exports; physical acceptance recorded separately. Follow PR_VERSIONING.md.

## Follow-up — approved 2026-11-28

Baseline: develop 0.3.48; PRs #336, #346, #347 and #348 merged.
The following nine additions refine existing priorities, not nine replacement
implementations. Source inspection is targeted; native acceptance remains open.

### P0 — Recovery and notification reconciliation

Extend P0.1/P0.4, not the persistence engine from scratch. PR #346 already
waits for durable set writes before showing completion. The workout model
stores restEndsAt and Workout.tsx refreshes on AppState changes; the current
package has no expo-notifications dependency. Verify any existing native
notification mechanism before introducing one. On startup reconcile only
notifications owned by CRESUM's active session and timer identity with durable
state. Cancel stale reminders after finish, skip, removal, reset or expiration;
do not resurrect finished sessions or deliver duplicate reminders. Test real
device reboot, process death, locked screen, permission denial and deadline
changes; distinguish UI notifications from OS delivery. Never require
notifications for offline logging.

### P0 — Individual rest preferences

Reuse workout-model.ts PlannedTarget restMin/restMax, session
restDurationSeconds/restOverrideSeconds and workout-engine.ts toggleSet.
The engine already selects session override, planned target restMin, then
session duration. Preserve legacy behavior for existing sessions. Add durable
exercise defaults and editable plan-specific values only where missing.
Proposed precedence: explicit active override, explicit plan/exercise target,
saved exercise default, global default. Define scope and reset semantics
before coding; do not accidentally inherit another exercise's timer.
Preserve planned targets, saved snapshots, zero-rest choice and current
deadline unless explicitly changed. Test reload, plan duplication, switching
exercises, explicit overrides and older backups.

### P1 — Set types and supersets

Extend the existing rest engine and exercise group infrastructure; existing
exercise groups are not proof of superset scheduling. Add optional warm-up
versus working set identity and per-type rest, plus explicit ordered superset
membership and rest between members/rounds. Preserve actual set logging,
manual navigation and editing; do not silently complete another exercise.
Legacy sets retain their prior meaning; do not invent historical warm-up
classification. Review analytics inclusion and progression eligibility,
and test partial rounds, removed members, reordering and restart.

### P1 — Muscle statistics granularity

Reuse MuscleProgress.tsx, muscle-participation.ts, muscle-exercise-discovery.ts
and existing area/group hierarchy, source set details and period filters.
Add a view switch between existing individual muscle IDs and larger groups.
Count unique source sets within each group using stable workout/exercise/set
identity, with primary/secondary overlap explicitly defined. Never add
overlapping counts as unique total or infer anatomical intensity from counts.
Keep existing masks, red highlights, period and drill-down. Test overlap,
unknown exercise, zero counts and current versus completed history.

### P1 — Missing exercise suggestion

ExerciseLibrary.tsx already provides localized search and filters. Add an
optional suggestion action for genuine no-match queries; distinguish filtered
results from absent catalog entries. Show a reviewable draft with exercise
name/equipment and optional details. No automatic submission, account
requirement or inclusion of personal workout data. Preserve offline search;
define opt-in delivery, moderation and retention separately before launch.
Use EXERCISE_ADDITION_WORKFLOW.md for accepted additions; no automatic
canonical ID creation. Test empty search, filters, cancellation and offline.

### P1 — Progression after a break

Extend P1.1 and review deferred calibration PR #17. Use time since the last
comparable completed working set, actual performance and available equipment.
After a meaningful gap offer a conservative, explainable reduction or
reassessment rather than blindly increasing load. No fixed gap/percentage
approved yet; review thresholds and evidence before implementation. Manual
and explicit plan values keep their priority (PR #348); recommendations never
rewrite history. Test missing history, imports, timezones, partial fragments
and different variants.

### P1 — Library frequency and recency sorting

ExerciseLibrary.tsx receives optional history and currently calls
searchLocalizedExercises with query/muscle/equipment. Extend the shared
result projection rather than duplicate search. Offer existing order,
most frequently performed and most recently performed. Proposed frequency
metric: count distinct eligible completed sessions, not individual sets;
recency: last eligible completed set/session. Define handling of fragments
consistently with #348 and analytics; grouped variants must avoid double
counting. Never-trained exercises sort after trained ones with stable ties.
Preserve search relevance, filters and localized labels; test absent history,
aliases, grouped variants, ties and selection state.

### P2 — Direct BLE heart-rate sensors

Separate native feasibility task after Core gates. package.json currently
has no BLE-specific dependency. Evaluate standard Bluetooth Heart Rate
Service, explicit permission and connection, reconnect, device identity,
timestamped samples and source provenance. Missing samples remain missing;
show stale/disconnected state and never fabricate a pulse. Keep logging
independent of sensor availability. Review battery, privacy, OS restrictions,
HealthKit/Health Connect deduplication and signed-device testing. No vendor
or dependency selected by this approval.

### P2 — Coach PDF report

Reuse validated History/Progress projections and local sharing infrastructure.
Allow date range, preview and explicit export/share of completed workouts,
actual sets, volume and clearly labeled estimated 1RM. Optional notes and
heart rate are excluded by default unless explicitly selected. No automatic
coach delivery or cloud upload; no claim of saving until the platform
confirms where possible. Handle localized dates/units, fonts, RTL, empty
periods, pagination and privacy. PDF complements CSV and JSON backup; not an
import format. No PDF engine selected yet.

All nine directions are approved; detailed precedence, metrics and technical
options above are proposed engineering acceptance rules. Recheck live code
before each implementation PR, run all required checks and translate all
new app-controlled text into every current registry locale.
