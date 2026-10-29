# Exercise Library contracts

## Supplementary discovery sources — approved 2026-10-29

Gymbot's [exercise category](https://gymbot.ru/journal/category/uprazhneniya)
may be used as an additional discovery catalogue for examples and coverage gaps.
Only its category page was inspected for this decision; this is not a blanket
verification of its articles or permission to reuse their protected content.

Write CRESUM descriptions independently and create original CRESUM illustrations.
Changing wording or rendering style alone is not evidence of originality or reuse
rights. Validate technical claims for the exact exercise/setup against relevant
authoritative sources such as ACE, research or manufacturer instructions. Keep
source links, actual generation inputs, review dates and any adaptation limits
in provenance; a supplied example is not automatically biomechanical truth.
Do not bulk-import articles/images or silently replace existing validated guides.
This is an approved editorial/source workflow, not an implemented ingestion tool.

## Close neutral seated row — additive configuration, 2026-10-27

Add `seated-cable-row-close-neutral-v-handle` as a specific child of the new
`seated-cable-row` family: low cable, V-handle, close neutral bilateral grip.
The catalog now has 67 records. Preserve `seated-cable-row` and legacy `row`
as unspecified; no saved workout, plan or Progress identity is migrated.
The adapter maps the generic row into this family without adding grip qualifiers.
Existing upper-back/lats Primary and biceps/rear-delts Secondary roles remain
qualitative. Only the exact child resolves the selected Male pair and the
existing isolated V-handle thumbnail. No automatic conversion of generic rows.

## Additive compact ergonomic handle — 2026-10-25

The catalog adds `lat-pulldown-close-neutral-ergonomic-handle` as a separate
specific member of `lat-pulldown`: ergonomic attachment, neutral close grip,
lats Primary and biceps/upper-back Secondary. The library now has 66 records.
Generic `lat-pulldown`/`pulldown` and the old V-handle retain their identities;
no stored records are renamed. Its Male technique pair and attachment image
resolve locally by this exact ID only; other variants do not borrow them.
See EXERCISE_BIOMECHANICS and EXERCISE_ASSETS for scope and review evidence.

The Exercise Library is CRESUM Core's canonical, offline exercise metadata source. Its implementation lives in `lib/exercise-library.ts`; taxonomy IDs and display labels live in `lib/exercise-taxonomy.ts`.

## Canonical IDs

Catalog IDs are stable descriptive slugs. New templates store these IDs. The catalog owns the following compatibility aliases for existing templates and history:

| Legacy ID  | Canonical ID              |
| ---------- | ------------------------- |
| `bench`    | `barbell-bench-press`     |
| `incline`  | `incline-dumbbell-press`  |
| `row`      | `seated-cable-row`        |
| `pulldown` | `lat-pulldown`            |
| `press`    | `dumbbell-shoulder-press` |
| `lateral`  | `dumbbell-lateral-raise`  |
| `squat`    | `barbell-back-squat`      |
| `legpress` | `leg-press`               |
| `deadlift` | `barbell-deadlift`        |
| `curl`     | `dumbbell-biceps-curl`    |
| `triceps`  | `cable-triceps-pushdown`  |
| `calf`     | `standing-calf-raise`     |

The resolver accepts canonical and legacy IDs. Unknown IDs remain unavailable and are not silently converted to another exercise.

## Persistence and snapshots

Persistence remains schema version 1. Saved templates, active workouts, and history are not rewritten when the catalog loads. Template IDs are resolved only when a workout starts.

A workout exercise is a snapshot: starting or appending copies the canonical ID, current name, and primary-muscle display label into the existing workout shape. Later catalog or taxonomy edits cannot change saved workout names, completed sets, weight, repetitions, volume, or history.

Legacy and canonical `libraryId` values are normalized only for previous-performance matching. Historical records retain their original stored value.

## Taxonomies and filtering

Exercise records reference typed muscle, equipment, and movement-pattern IDs. Each record has at least one primary muscle, has no primary/secondary overlap, and uses only taxonomy values.

Filtering is pure and preserves curated catalog order. Search trims input and matches names case-insensitively. Muscle filters match primary or secondary muscles; equipment filters match the equipment list. Active search, muscle, and equipment criteria combine with AND.

## Artwork boundary

`imageKey` is a stable extensionless identifier, normally the exercise ID. It is not a path, URL, file name, or encoded asset. `components/ExerciseArtwork.tsx` owns the current placeholder and is the boundary for future local artwork resolution; catalog and Workout Engine contracts must not depend on image files.

## Approved family and variant direction (incremental)

The original 58 exercise records remain the compatibility baseline. The flat catalog now contains 61 records, including three additive Lat Pulldown variants. A family groups a stable shared movement identity; a variant identifies one mechanically meaningful configuration within that family. The additive type foundation and a conservative, partial catalog adapter exist in `lib/exercise-variant-model.ts` and `lib/exercise-catalog-adapter.ts`. Neither replaces the flat catalog or changes Core, History, or Progress identity behavior. Unmapped records remain available in the flat catalog.

The first exact-variant pack adds `lat-pulldown-wide-pronated-bar`, `lat-pulldown-close-neutral-v-handle`, and `lat-pulldown-reverse-grip` to the `lat-pulldown` family. The original `lat-pulldown` and legacy `pulldown` alias retain unspecified attachment and grip semantics. Each new ID has its own Progress identity. All three currently use the conservative catalog mapping of lats as Primary and biceps/upper-back as Secondary; this is not a measured muscle ranking. The reverse-grip variant does not assert an attachment or grip width. The three exact variants' mechanics and future image rejection criteria are specified in `EXERCISE_BIOMECHANICS.md`; production START/FINISH assets and their QA remain future work.

The approved conceptual dimensions are:

`Exercise / Exercise Family → Exercise Variant → Equipment → Attachment → Grip → Phase → Sex/model presentation → Visual mode`

This is architectural vocabulary, not an approved persistence shape, type definition, enum, or migration.

A distinct variant and corresponding asset are justified when machine/equipment geometry, attachment, grip or grip width, body position/support, laterality, movement path, range of motion, setup/contact geometry, or biomechanics materially change. Minor coaching cues that leave the actual configuration unchanged belong in technique metadata, not new variants. A family can gain variants without restructuring existing identities.

Equipment dimensions must not collapse mechanically different selectorized and plate-loaded machines, Smith machines, cable attachments or handles, assisted bodyweight, specialty bars, benches/support, or unilateral configurations into one ambiguous value where that distinction affects movement, assets, or training semantics. Barbell, dumbbell, cable, bodyweight, and other existing categories remain valid starting points. This direction does not prescribe a large final enum; model only distinctions with material meaning.

There is no generic visual definition of a lat pulldown or cable-row grip. Attachment, hand orientation, grip width, thumb/finger placement, wrist alignment, and machine geometry belong to the exact variant.

Existing specific IDs may later be linked to families as variants without changing their stored identity. Generic IDs such as `lat-pulldown` must not silently acquire one exact grip, attachment, machine, or position; they may remain legacy/unspecified variants. New exact configurations require new stable IDs. Do not rewrite historical snapshots or repurpose the 12 legacy aliases. Progress must not silently merge materially different variants into one strength or performance series. Asset filename slugs may differ from the existing hyphenated saved IDs; an explicit mapping can connect them without renaming IDs.

Canonical muscle IDs, exact variant-level Primary/Secondary mapping, future load calculation, and visual rendering are separate concerns. Grip, attachment, position, support, or laterality can change the mapping. Male and Female presentations share the same variant and muscle semantics. The future Anatomy/Muscle View visual treatment is specified in `DESIGN_SYSTEM.md`; production files and acceptance rules are specified in `EXERCISE_ASSETS.md`.

## Exercise asset pipeline boundary

Future production preserves this responsibility chain:

`Exercise Library → Exercise Variant → Biomechanics Specification → Visual Specification → Prompt Builder → Image Generation → Biomechanics/Visual QA → Asset Tracker → Approved Production Asset`

The library establishes stable identity; the exact variant removes mechanical ambiguity; reviewed biomechanics establishes movement truth; later visual and prompt stages consume those approved inputs rather than inventing them; generation creates drafts; QA gates approval; and tracking remains separate from catalog identity.

This documentation does not define the Visual Specification, Prompt Builder, generator, tracker data model, providers, automation, or integration. Those require a separate approved stage. Detailed production, naming, visual-mode, and QA rules live in `EXERCISE_ASSETS.md` and `DESIGN_SYSTEM.md`.

## Starter-program movement pack — implementation

The flat catalog adds four stable IDs (65 records total):

- `standing-cable-anti-rotation-press`: standing, chest-height lateral cable, two-handed press away from the torso; repeat facing the other direction. Cable choice is a CRESUM Gym adaptation of ACE's band/cable movement.
- `bodyweight-step-up`: controlled step onto a stable raised platform and return, performed with each lead leg. This unloaded beginner configuration is a CRESUM adaptation of ACE's dumbbell step-up; it does not silently accept another equipment variant.
- `dumbbell-floor-glute-bridge`: upper back on the floor, one supported dumbbell across the hips. HSS distinguishes this from bench-supported hip thrusts.
- `lying-barbell-triceps-extension`: supine on a flat bench, closed pronated bar grip, elbow extension; distinct from overhead cable extension.

The existing family adapter may leave these explicitly unmapped until its configuration model covers them. Sources and reviewed movement boundaries are recorded in `EXERCISE_BIOMECHANICS.md`. Placeholder artwork remains; no production image is approved. Per-side execution requires the matching logging contract before release; adding metadata alone is not readiness.

## Regional participation requirement — 2026-10-20

Future training-to-mask binding must review region/head emphasis for the exact
exercise setup. Parent Primary/Secondary roles cannot determine regional ratios;
the adapter's specific flag does not certify a known angle or machine path.
Preserve generic configurations, stable IDs, history and factual participation.
Evidence applicability and unresolved state belong separately from drawable masks.
No numerical coefficients are approved here. See the nine-ID chest pilot and
cross-body research queue in [MUSCLE_REGIONAL_MAPPING.md](MUSCLE_REGIONAL_MAPPING.md).
