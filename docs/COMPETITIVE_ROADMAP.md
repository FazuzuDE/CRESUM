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
