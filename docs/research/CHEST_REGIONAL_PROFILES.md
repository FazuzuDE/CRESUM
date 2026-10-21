# Chest regional profiles — first evidence disposition

Date: 2026-10-21. Based on merged PR #66 (`439c9b1`). This completes an initial
configuration/evidence disposition for all nine existing chest-related catalog
identities. It does not establish nine validated regional load ratios. Profiles
are research data, not imported by the application or approved for production.

## Result

Both clavicular and coarse sternocostal display regions exist per side. Their
selected appearance is accepted; this does not validate physiological mapping.
The first review supports configuration-dependent regional behavior, while
phase effects, differing protocols and missing machine details prevent a single
universal upper/lower weighting. No current exercise gets a numerical regional
contribution or a differentiated production highlight from this checkpoint.

Use [chest-regional-profiles.json](chest-regional-profiles.json) as the structured
review register. `regionalContribution: null` means not determined, not zero or
equal loading. The two Secondary chest roles remain Secondary.

## Source register

| ID  | Original source and access                                                                                                    | Relevant finding and limit                                                                                                                                                                                                                                                                   |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | [Rodríguez-Ridao et al., 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7579505/) — full text retrieved during initial review | Five barbell inclinations at a specified relative load changed regional excitation. A peak at one angle does not prove superiority over every angle or transfer to dumbbells. Acute EMG, not force/growth fractions.                                                                         |
| R2  | [Coratella et al., 2020](https://pubmed.ncbi.nlm.nih.gov/31397215/) — abstract retrieved during initial review                | Flat/45° incline/decline barbell and one chest machine showed regional and phase-dependent differences. Findings concern the tested setups, not every chest-press machine.                                                                                                                   |
| R3  | [Luczak et al., 2013](https://pubmed.ncbi.nlm.nih.gov/26464884/) — indexed primary abstract; full-text retrieval blocked      | Twenty-four collegiate-aged women performed dumbbell flat, incline and shoulder presses. Clavicular excitation favored incline during eccentric action but flat during concentric action. Do not compress this into an unqualified incline advantage or generalize the sample to every user. |
| R4  | [Saeterbakken et al., 2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5504579/) — full text retrieved during this workflow     | Twelve competitive bench athletes performed 6RM barbell variations. Chest signals did not differ significantly across tested bench positions/grips. This is conflicting/contextual evidence, not proof of equivalence.                                                                       |
| R5  | [Muyor et al., 2023](https://doi.org/10.5114/jhk/161468) — publisher full text retrieved                                      | Twenty experienced adults compared two flat-bench grip widths and two grips on a seated machine. Neutral-machine clavicular excitation exceeded one barbell comparator. A very narrow barbell condition is not the catalog's shoulder-width close-grip technique.                            |
| R6  | [Chaves et al., 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7449336/) — full text retrieved during initial review          | Eight-week trial in untrained men: incline training differed at one of three measured chest thickness sites. Longitudinal adaptation supports studying regional effects, but not transferring thickness changes into per-set coefficients.                                                   |
| R7  | [Cogley et al., 2005](https://pubmed.ncbi.nlm.nih.gov/16095413/) — indexed primary abstract                                   | Push-up hand placement affected recorded pectoralis/triceps EMG. The abstract does not establish the two-region distribution required by this pilot.                                                                                                                                         |
| R8  | [Vigotsky et al., 2018](https://doi.org/10.3389/fphys.2017.00985) — methodological interpretation                             | EMG amplitude alone cannot establish muscle force or predict hypertrophy. Keep excitation, regional adaptation, estimated stimulus and displayed color distinct.                                                                                                                             |

Primary-source searches covered barbell/dumbbell pressing, machine press, fly,
push-up and dip configurations. Failure to find a suitable regional study in
this bounded review is not proof that no such evidence exists. No source below
is represented as a validation of a generated SVG's anatomical boundary.

## All nine identities

| Catalog ID / retained chest role     | Known configuration                                                         | Evidence disposition                                                                                                                                                         | Gate before differentiated regional display                                                                                        |
| ------------------------------------ | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `barbell-bench-press` / Primary      | Technique specifies flat barbell bench, grip slightly wider than shoulders. | R1/R2/R6 support studying regional effects versus inclined conditions; R4 limits a universal ranking. Candidate comparative sternocostal emphasis, not isolation or a ratio. | Review applicability of grip, relative effort, ROM and phase aggregation. No fixed lower-region boost from the catalog name alone. |
| `incline-dumbbell-press` / Primary   | Two dumbbells on an incline; numeric angle absent.                          | R3 is equipment-relevant but phase-dependent. R1/R2 are indirect barbell evidence. A universal clavicular-emphasis profile is unresolved.                                    | Capture/review angle and define how phases contribute; review population/protocol transfer.                                        |
| `dumbbell-bench-press` / Primary     | Flat bench and two dumbbells.                                               | R3 supplies phase-specific evidence; it does not establish a complete upper/lower load split.                                                                                | Specify reviewed setup and evidence aggregation across both phases; do not copy barbell weights.                                   |
| `machine-chest-press` / Primary      | Supported seated press; variable handle geometry.                           | R2 and R5 use particular machines/grips and produce comparator-dependent results. Generic machine regional emphasis unresolved.                                              | Identify machine path, backrest/seat, grip orientation/width and ROM; compare exact setup to source.                               |
| `cable-chest-fly` / Primary          | Standing fly; pulley angle explicitly variable.                             | No sufficiently applicable two-region mapping accepted in this review. Low-to-high/level/high-to-low are configuration candidates, not validated coefficients.               | Specify pulley direction/height, torso, arm path and ROM, then review suitable regional evidence.                                  |
| `pec-deck-fly` / Primary             | Seated fly; forearm-pad and handle versions differ.                         | No sufficiently applicable regional split accepted. Whole-pectoral measurements cannot establish regional weighting.                                                         | Identify machine/contact geometry, seat, humeral path and ROM plus regional evidence.                                              |
| `push-up` / Primary                  | Floor push-up, hands around shoulder width per technique.                   | R7 supports setup sensitivity, not a clavicular/sternocostal ratio. Generic activation does not establish regional distribution.                                             | Preserve floor setup; independently review elevation/hand/path variants before any new regional claim.                             |
| `close-grip-bench-press` / Secondary | Technique specifies shoulder-width grip, supported bench.                   | R4/R5 are relevant comparisons with different width definitions. R5's 50%-biacromial condition is not this catalog technique.                                                | Match actual bench angle, grip definition and ROM; retain chest Secondary and unresolved regional contribution.                    |
| `assisted-dip-machine` / Secondary   | Counterweighted dip, upright torso per technique.                           | No applicable assisted-machine two-region split accepted. Unassisted forward-leaning dips must not silently substitute for this configuration.                               | Match assistance mechanism, torso, handles and ROM; obtain regional evidence. Counterweight is assistance, not lifted tissue load. |

These are scientific applicability judgments by CRESUM, not the authors'
endorsement of the app. A comparative emphasis statement always retains its
comparator and protocol; it is not a permanent ranking within a person's muscle.

## Binding contract proposed for the next implementation

Keep the 17 existing parent-group IDs and factual set counts. Connect regional
identity to mask IDs independently: `clavicular` maps to the selected left/right
clavicular masks and `sternocostal` to the selected left/right sternocostal masks.
This is a display-identity association, not evidence of exercise activation.

Resolve exercise identity through existing aliases, then check the relevant
configuration against an evidence profile. An unknown configuration must return
an unresolved regional result and keep the existing parent participation.
Qualitative statements remain explanatory until a separately reviewed model
defines their quantitative meaning. Do not turn ordinal categories into hidden
opacity multipliers, split each completed set into duplicate parent sets, infer
unlogged unilateral work, or relabel historic generic exercises.

The initial implementation should expose evidence/unknown-setup state before
physiological scoring. Existing logging has no reliable bench-angle/machine-path
snapshot; a future configuration contract must address capture and historical
fallback. Retaining group-level participation is not a claim of equal regional
loading. Numerical stimulus, normalization and renderer rollout remain separate.

## Review checks

The register must cover exactly the nine current chest-related catalog IDs and
their real Primary/Secondary roles. Every source reference resolves within its
source register; every display target exists in the accepted selected geometry.
All regional contributions remain null, runtime assignment disabled, and no app
imports are introduced. Baseline and accepted assets remain unchanged.

Next: review this applicability matrix and design the configuration/evidence
lookup contract. Extend source review where a suitable regional profile remains
unresolved; do not treat this initial review as final validation of the catalog.
