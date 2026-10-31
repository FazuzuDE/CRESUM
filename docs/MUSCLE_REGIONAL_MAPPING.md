# Regional muscle mapping: evidence and integration requirements

Reviewed 2026-10-20. The user requires exercise-specific regional emphasis before
final training-to-mask binding. This is an initial evidence review and catalog
audit, not an exhaustive review of all 65 exercises or a validated scoring model.
The requirement is approved; regional taxonomy, coefficients and implementation
still require design and review.

## Evidence and limits

Pectoralis major has distinguishable clavicular and sternocostal regions; some
studies sample sternal and costal areas separately. Upper/lower chest describes
regions, not two isolated muscles. Display subdivisions must identify the
anatomical region approximated rather than use arbitrary horizontal cuts.

| Source and outcome                                                                                                                 | Finding                                                                                                                                                                   | Mapping implication                                                                                |
| ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [Rodríguez-Ridao et al., 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7579505/) — acute barbell EMG                              | Inclination changed regional signals and anterior-deltoid involvement. The upper-pectoral peak at 30° was not significantly greater than every comparison angle.          | Record angle/equipment; no universal optimal angle or upper-chest isolation rule.                  |
| [Chaves et al., 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7449336/) — eight-week trial, untrained men                         | Incline training produced greater thickness change at one of three chest sites; general strength changes were similar across groups.                                      | Regional adaptation is plausible; sampled thickness is not a whole-region loading percentage.      |
| [Coratella et al., 2020](https://pubmed.ncbi.nlm.nih.gov/31397215/) — acute EMG, ten bodybuilders                                  | Incline, flat, decline and one chest machine produced differing patterns. Sternocostal excitation was similar for decline versus flat in the tested concentric condition. | No automatic decline-over-flat lower-chest ranking; do not generalize one machine to all machines. |
| [Albarello et al., 2022](https://pubmed.ncbi.nlm.nih.gov/36334406/) — acute EMG/ultrasound                                         | Flat and 45° incline presses produced different regional excitation and immediate architectural changes.                                                                  | Immediate size changes are not longitudinal hypertrophy or individual stimulus measurements.       |
| [Maeo et al., 2023](https://pubmed.ncbi.nlm.nih.gov/35819335/) — elbow-extension training                                          | Overhead versus neutral-arm cable extension produced different triceps hypertrophy, particularly in the long head.                                                        | Shoulder position matters; transfer to other equipment remains indirect.                           |
| [Maeo et al., 2021](https://pubmed.ncbi.nlm.nih.gov/33009197/) — leg-curl training                                                 | Seated/prone differences occurred for biarticular hamstrings, but not the same difference for the monoarticular muscle.                                                   | Preserve hip position and individual-muscle distinctions.                                          |
| [Kinoshita et al., 2023](https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2023.1272106/full) — calf training | Standing produced greater gastrocnemius hypertrophy; soleus hypertrophy was similar between conditions.                                                                   | Knee position matters; seated-only soleus activation is an unsupported binary rule.                |

[Vigotsky et al., 2018](https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2017.00985/full)
explains why surface-EMG amplitude is not a direct muscle-force measurement or a
standalone predictor of growth. Distinguish excitation, mechanics and adaptation;
retain conflicting evidence. None of these sources establishes per-user load
fractions. Where only the indexed abstract was available, claims above are
limited to that abstract; unobserved methods/results are not assumed.

## Current implementation audit

- `lib/exercise-taxonomy.ts`: 17 stable parent groups.
- `lib/exercise-library.ts`: 65 exercises; nine have chest as Primary/Secondary.
  Those roles are participation labels, not regional coefficients.
- `lib/exercise-variant-model.ts`: optional setup qualifiers, no typed bench
  angle, regional evidence profile or stimulus model. The adapter's `specific`
  flag alone does not establish sufficient mechanical detail.
- `lib/exercise-technique/catalog.ts`: flat/incline scopes exist, but incline
  dumbbell press has no numeric angle. Machine geometry and cable angle vary.
- Combined geometry: 92 regions, with one whole-pectoral contour per side.
  Independently controlled clavicular/sternocostal display needs a separately
  reviewed internal subdivision while preserving the current exterior contours.
  Detailed masks are not automatically physiological scoring units.

## Chest pilot: all nine existing catalog identities

These are review dispositions, not executable mappings or numbers. Unresolved
means unknown, not zero involvement. Current Primary/Secondary roles remain.

| Existing ID              | Setup and evidence disposition                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `barbell-bench-press`    | Technique specifies flat/barbell. Relevant direct evidence exists; no quantitative regional profile is established.      |
| `incline-dumbbell-press` | Angle unspecified. Candidate clavicular emphasis needs angle and dumbbell-specific review; barbell transfer is indirect. |
| `dumbbell-bench-press`   | Technique specifies flat/dumbbells. No upper/lower ratio inferred from barbell findings.                                 |
| `machine-chest-press`    | Generic seated machine. Seat/handle/resistance path vary; regional profile unresolved.                                   |
| `cable-chest-fly`        | Pulley angle varies. Low-to-high, horizontal and high-to-low configurations require separate evidence review.            |
| `pec-deck-fly`           | Generic machine geometry/support; regional profile unresolved.                                                           |
| `push-up`                | Generic bodyweight identity. No regional profile reviewed here; elevation variants require explicit setup and evidence.  |
| `close-grip-bench-press` | Chest is Secondary. Exact grip/setup and regional evidence need review; preserve the existing role.                      |
| `assisted-dip-machine`   | Chest is Secondary. Torso/path/assistance setup need review; no automatic lower-chest coefficient.                       |

Decline press is a research comparator, not an existing catalog ID to invent or
substitute. Missing regional profiles must not suppress parent participation.

## Required rules before binding

1. Resolve materially relevant equipment/machine path, bench/body angle, support,
   grip, cable direction, range and laterality. Preserve generic IDs and historical
   snapshots when details were not captured.
2. Separate parent participation, anatomical region, evidence profile and mask
   identity. Multiple patches may depict one region; some regions are hidden or
   explicitly schematic projections.
3. Each proposed relation needs source, studied setup, outcome type, population,
   applicability limitations and review status. Identify direct/indirect transfer,
   unknown setup and conflicting evidence.
4. Use qualitative emphasis only when evidence and applicability are reviewed.
   Unknown is neither zero nor equal measured loading. Label any group-level
   fallback as group-level, without fabricating regional precision.
5. Review numerical stimulus weights, aggregation and color normalization
   separately. EMG percentages, effect sizes and growth percentages are not
   drop-in coefficients. Machine-stack kilograms are not comparable tissue load.
6. Keep one parent participation count per completed set and role. Do not count
   multiple regional masks as extra sets. Future regional scores need explicit
   aggregation semantics distinct from factual counts.
7. Apply the evidence process across the body before binding other families.
   These examples do not validate every catalog exercise, head or visible patch.

## Next deliverable

Prepare a chest pilot: reviewed clavicular/sternocostal display boundaries inside
the current exteriors, exact-configuration/evidence entries for the nine IDs and
explicit unresolved entries. Show regional semantics and internal subdivisions
before introducing a scoring model or changing production behavior. Then extend
research to shoulders, arms, back, thighs, glutes/adductors, calves and remaining
structures.

Implementation checks must cover exact-variant matching, unknown-setup fallback,
source/revision provenance, non-duplicated parent counts, stable IDs/history and
independent regional rendering with unchanged exterior geometry. This checkpoint
contains documentation only, with no new coefficients or runtime behavior.

## Incline dumbbell illustration context — 2026-10-31

The selected illustration depicts an approximately45-degree incline as one
example. The existing stable ID remains angle-unspecified and parent-level
chest Primary / front-delts and triceps Secondary. No regional production
binding is added by selecting artwork.

[Luczak et al., 2013](https://pubmed.ncbi.nlm.nih.gov/26464884/) directly studied
flat, 45-degree incline and shoulder presses with dumbbells in young women.
The indexed abstract reports phase-dependent clavicular pectoralis activity
and greater anterior-deltoid activity for incline than flat press. This adds
dumbbell-specific context to the review queue; it does not establish universal
regional dominance, load fractions, isolated upper-chest work or drawable masks.
The earlier nine-ID audit remains an unresolved implementation queue.
