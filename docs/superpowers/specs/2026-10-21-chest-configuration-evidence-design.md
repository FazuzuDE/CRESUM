# Chest configuration snapshots and evidence lookup

Status: proposed contract, awaiting user review. Date: 2026-10-21.
Scope: the nine chest-related exercise identities in
[the evidence register](../../research/chest-regional-profiles.json).
This is a design for implementation; no snapshot field, capture UI or lookup
has been added to the application by this document.

## Outcome

Each recorded exercise instance can retain the setup actually confirmed for
that occurrence. Regional lookup can explain whether missing setup or missing
applicable evidence prevents a regional interpretation. Existing workouts remain
valid when no setup was recorded. Factual parent-group participation continues.

The immediate deliverable after contract approval is a pure configuration
validator and read-only evidence lookup with acceptance tests. Persisting and
editing snapshots is a subsequent integration slice, with round-trip checks
before enabling capture. Neither slice introduces physiological coefficients.

## Existing boundaries

- `lib/workout-model.ts`: `WorkoutExercise` contains an instance `id`, `libraryId`,
  display snapshot, optional target and sets. It has no configuration snapshot.
- `lib/workout-engine.ts`: `appendExercise` already permits another instance of
  the same catalog identity. Instance IDs distinguish these occurrences.
- `lib/exercise-variant-model.ts`: optional qualitative configuration fields
  exist; `specific` does not imply all regional-evidence inputs are known.
- `lib/exercise-technique/catalog.ts`: technique instructions describe intended
  setups, not observations of the user's historical execution.
- `lib/sync/history-mapper.ts` explicitly enumerates serialized fields. A new
  local property will not automatically survive a cloud round trip.
- The research register has nine proposed dispositions, all regional
  contributions null and runtime assignment disabled. It is not a runtime
  approval registry.

## Design choice

Use one immutable-after-completion snapshot per exercise instance. The rejected
alternative is silently changing one shared setup for completed and pending sets:
that would retroactively reinterpret completed work. Per-set snapshots could
support more granular variation, but are unnecessary for the first chest slice
and would expand every set/logging/serialization boundary.

A current-workout setting or template preference can later supply an editable
suggestion. It becomes a recorded setup only after user confirmation for that
occurrence. A later template, technique or catalog edit never changes a snapshot.
The pure lookup neither reads today's preferences nor infers historical setup.

## Snapshot contract

Proposed optional field: `WorkoutExercise.configurationSnapshot`. Its internal
schema has version 1 independently of the existing WorkoutState schema version.
The persistence slice must decide compatibility by actual reader behavior; this
document does not authorize a top-level schema bump or assume older readers keep
unknown fields.

| Field                          | Value and interpretation                                                                                                                                                                             |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `schemaVersion`                | Literal `1` for this configuration contract.                                                                                                                                                         |
| `canonicalExerciseId`          | Existing canonical catalog identity at capture; must match resolution of the owning `libraryId`. Original stored `libraryId` is retained.                                                            |
| `provenance`                   | Literal `user-confirmed`; technique/catalog defaults are separate explanatory metadata. This does not claim sensor measurement or execution accuracy.                                                |
| `setup.benchAngleDegrees`      | Optional finite number in [−90, 90]; 0 is horizontal, incline positive. No default, coercion or arbitrary rounding. The range validates representation, not safety or relevance.                     |
| `setup.gripOrientation`        | Optional `pronated`, `neutral` or `supinated`.                                                                                                                                                       |
| `setup.gripWidth`              | Optional tagged value: `shoulder-relative` with `narrower`, `shoulder-width` or `wider`; OR `biacromial-ratio` with a finite positive ratio. Never convert a qualitative width into a numeric ratio. |
| `setup.rangeOfMotion`          | Optional `full-comfortable`, `partial-lower`, `partial-upper` or `other`. Labels do not measure joint endpoints; a protocol requiring measured angles stays unmatched.                               |
| `setup.machineConfigurationId` | Optional reviewed stable machine-configuration identity. Generic `machine` and a user nickname do not identify a tested movement path. No machine registry is invented in this slice.                |
| `setup.cableDirection`         | Optional `low-to-high`, `level` or `high-to-low`; this alone does not fully identify an arm path.                                                                                                    |
| `setup.torsoPosition`          | Optional `supported-supine`, `supported-seated`, `upright` or `forward-leaning`.                                                                                                                     |
| `setup.flyContact`             | Optional `handles` or `forearm-pads`; does not identify a machine by itself.                                                                                                                         |
| `setup.assistance`             | Optional `none` or `counterweighted-machine`. Counterweight magnitude stays in the existing logging semantics; it is never a regional tissue-load value.                                             |

An absent setup property is unknown. Null-valued, nonfinite, mistyped, unsupported
schema or invalid enum input produces explicit validation issues. Unknown keys
are invalid for this version. Preserve the original workout if an optional
configuration fails validation; report unusable setup rather than discarding
weight, repetitions, completed timestamps or the session.

Contradictions between identity and setup produce `configuration-incompatible`.
Examples: a flat dumbbell-bench identity with a confirmed 45° incline, or the
standing cable fly tagged with a pec-deck forearm pad. Choosing a different
mechanically meaningful exercise is explicit; never silently rename an ID.
Unspecified values such as the incline angle remain unknown rather than false.

## Capture lifecycle for the later persistence slice

1. Starting/appending an exercise remains possible with no setup snapshot.
   Optional capture is not a prerequisite for logging or completing a workout.
2. With no currently completed sets, the user can confirm or edit its setup.
   Existing weights/reps are preserved; confirmation cannot complete a set.
3. Once any validated set is completed, the instance snapshot is read-only.
   No setup edit implicitly uncompletes, moves or reinterprets existing sets.
4. Changing setup creates a new exercise instance with the same catalog identity
   only when that setup is compatible with it. It receives a new instance ID and
   new pending sets through existing engine conventions. No completed sets are
   copied or removed. An incompatible angle/path requires explicit variant choice.
5. Undoing completion of every set restores the normal pre-completion edit rule;
   no completed work remains in that instance. Historic completed sessions are
   immutable under this capture action. Editing old recorded setup is outside scope.
6. Repeat occurrences are visibly distinguished by their setup summary in the
   later UI. Instance identity governs reorder/navigation/rest behavior.

## Evidence lookup contract

Proposed pure operation:
`inspectChestRegionalEvidence(libraryId, configurationSnapshot, registry)`.
It receives explicit inputs and performs no IO, mutations, history lookup,
workout-state updates or automatic registry promotion.

The `registry` argument is a read-only envelope containing an immutable nonempty
`revision` string and the research register data. For this first dataset the
caller can use the containing Git commit ID. A date or schema version alone is
not a content revision; updating data requires a new revision. Invalid registry
input returns a typed `invalid-registry` error result with no regional assignment;
it never throws through a workout screen or implies zero involvement.

Output includes:

- canonical identity or null, current catalog parent role where available;
- validated setup or explicit field-level issues;
- missing setup fields separately from scientific/applicability limitations;
- source IDs, registry revision and review status for provenance;
- display-region IDs as anatomical display identities, without activation values;
- `regionalContribution: null` and `regionalHighlightAuthorized: false` in this slice.

| Status                       | Meaning                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `unknown-exercise`           | Catalog resolver cannot resolve the ID; preserve existing unmapped-set handling.                              |
| `outside-pilot`              | Known catalog exercise is not one of the nine chest profiles; its normal catalog participation is unaffected. |
| `configuration-invalid`      | Supplied snapshot fails version/shape/value validation; optional setup is unusable.                           |
| `configuration-incompatible` | Validly shaped setup contradicts canonical identity or supported exercise mechanics.                          |
| `configuration-unresolved`   | Snapshot is absent or relevant required setup is unknown. Catalog technique text cannot fill the history gap. |
| `evidence-unresolved`        | Needed setup is known, but scientific review, source applicability or a regional model remains insufficient.  |

Evaluation order is deterministic: validate registry envelope; resolve exercise
identity; return unknown/outside-pilot when appropriate; return
configuration-unresolved for an absent snapshot; validate a supplied snapshot;
check identity/setup compatibility; inspect missing setup fields; finally report
remaining evidence limitations. The registry error result is distinct from the
exercise statuses above.

All current profiles remain scientifically unresolved for numerical regional
assignment. A future qualitative-evidence state requires a separately reviewed
runtime registry and documented applicability predicates; none is manufactured
from the existing research register's candidate statements.

Resolve aliases through the current canonical resolver first (`bench` and
`incline` retain their established meanings). Compare the snapshot's bound
identity after canonicalization. Never widen a match from dumbbell to barbell,
assisted to unassisted, one machine to another, or a qualitative width to 0.5/1.5
biacromial ratios. No angle-tolerance band or inferred symmetry is introduced.

## Setup requirements versus research blockers

| Identity                                | Relevant setup fields for this first inspection                              | Scientific blockers retained independently                                             |
| --------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Flat barbell press                      | Explicit angle, grip orientation/width, ROM                                  | Protocol/population applicability, conflicting findings, phase/contribution model      |
| Incline dumbbell press                  | Explicit angle, grip orientation, ROM                                        | Phase-dependent evidence and transfer; no accepted scalar profile                      |
| Flat dumbbell press                     | Explicit angle, grip orientation, ROM                                        | Regional-ratio and phase aggregation unresolved                                        |
| Seated machine press                    | Machine configuration identity, torso, grip orientation/width, ROM           | Tested-machine applicability and quantitative model                                    |
| Standing cable fly                      | Cable direction, torso, grip orientation, ROM                                | Arm-path applicability and accepted regional evidence                                  |
| Pec deck                                | Machine configuration identity, torso, contact, ROM                          | Suitable regional evidence and quantitative model                                      |
| Floor push-up                           | Torso execution remains floor identity; shoulder-relative hand width and ROM | Existing hand-position study does not establish the required regional split            |
| Shoulder-width close-grip barbell press | Explicit angle, grip orientation/width, ROM                                  | No transfer from an extremely narrow study condition; regional contribution unresolved |
| Counterweighted dip                     | Assistance kind, torso, machine configuration identity, ROM                  | Appropriate assisted-variant regional evidence unresolved                              |

“Population applicability” and “phase aggregation” are research work, never
questions to fill in a workout form. Satisfying all setup fields cannot clear
those blockers. A study requiring details beyond these coarse fields stays
unmatched. No configuration form is shown by the foundation-only implementation.

## History, storage and rollout boundaries

Legacy workouts have no snapshot and remain valid. They retain factual parent
participation, with unresolved regional setup. Today's catalog/technique/settings
must not be backfilled into them. Returning a group-level fallback never asserts
equal measured regional loading or turns unknown into zero.

The foundation slice adds no stored field or migration. Before enabling capture,
audit workout validation, repository serialization/recovery, manual and automatic
backup/import, template/planned defaults, active-workout cloning/undo, History
and cloud mapping. Each route must preserve an accepted snapshot or explicitly
declare unsupported storage; silently dropping it is not a valid rollout.
Cloud schema/API work requires its own concrete reviewed change. Existing
logging remains available during this rollout.

The UI/native renderer is another slice. It consumes reviewed outputs, deduplicates
parent set counts, and preserves existing source-set details. Missing regional
evidence must not be rendered as an inactive region. No scoring or opacity
multiplier can be derived from categorical evidence or research percentages.

## Acceptance cases for the foundation slice

1. Canonical and legacy alias IDs yield the same current profile identity and role.
2. Unknown IDs and known non-pilot IDs have distinct outcomes.
3. Missing setup yields unknown; numeric 0° remains a valid recorded angle.
4. Angle NaN/infinity/string, invalid enums, unknown keys and future schema versions
   produce explicit issues without mutating their input or the owning workout.
5. Qualitative shoulder width never satisfies a numeric biacromial requirement.
6. An identity/setup conflict is reported without rewriting the identity.
7. Complete 30° incline dumbbell setup remains evidence-unresolved with null
   contribution; completeness alone does not activate an unreviewed profile.
8. Machine, cable-fly, pec-deck and assisted-dip unknowns remain explicit.
9. Both Secondary chest roles remain Secondary; mask count does not multiply sets.
10. Results retain source/review revision provenance and all four existing display
    target IDs. Current registry stays runtime-disabled.
11. Multiple calls are deterministic and mutate no catalog, snapshot or registry.
12. Existing participation/history tests continue to pass with absent snapshots.

Persistence acceptance additionally covers snapshot round trips, restart/recovery,
undo, immutable completed instances, same-ID repeated-instance navigation and
explicit setup changes without copied/lost completed sets. Those tests accompany
that later integration, not the pure lookup foundation.

## Implementation sequence after contract review

1. Implement and test the pure snapshot validator, requirements inspection and
   read-only research-result lookup. Do not import research JSON into a production
   screen or invent a reviewed runtime activation registry.
2. Review the configuration capture/persistence integration against actual
   serialization boundaries and implement it as a focused follow-up.
3. Review evidence-profile applicability and the later regional display/scoring
   model separately; then connect eligible outputs to the accepted geometry.

This proposal makes the research-to-product boundary explicit. User review of
this contract precedes the implementation plan; neither publication of #67 nor
visual approval of the chest masks approves physiological coefficients.
