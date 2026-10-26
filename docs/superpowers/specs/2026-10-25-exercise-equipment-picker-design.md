# Exercise equipment picker and attachment blocks

Status: product/UX approved by the user on 2026-10-25; implementation details
below are proposed engineering decisions. No application code ships with this
documentation. Base inspected: develop at ad26fce8f6f02f67f1a8a2585eead348b1efafd0.

## Intent

Help a gym user identify the necessary handle and prepare several attachment
configurations at the same station without cluttering the exercise screen.
The motivating example is two sets each on short, medium and wide handles,
presented as one card with six explicitly ordered sets.

## Approved behavior

- The equipment image/name/grip row beneath START/FINISH opens a bottom sheet.
  It lists compatible reviewed configurations with images and a selected check.
  Selection closes it; dismissal changes nothing. Remove the separate always
  visible short/medium/wide chips. Do not add search for a short list.
- Browsing configurations updates the current unsaved draft, never already-added
  blocks or completed sets. Preserve each draft's weight/reps/set count.
- Add the configured sets to their attachment block. Repeated additions to the
  same variant append sets to that existing block in this first version; a
  repeated A-B-A sequence and supersets are not introduced by this decision.
- One station card displays the ordered blocks, attachment image/name/grip,
  editable individual set rows and an explicit change-attachment cue.
- The final Add to workout action persists the entire prepared group atomically.
  Cancel or a failed save retains existing plans, active sessions and History.
- Choice policy is contextual: required attachment; optional accessory with
  **Without additional accessories** baseline; or not applicable with
  **Additional accessories not required**. Primary equipment is independent.
  Describe integral handles; no empty or single-choice picker.

## Approaches

1. **Selected attachment row + bottom sheet, ordered blocks** — selected by the
   user's approval of the revised preview. It keeps the full equipment identity
   visible, avoids repeated controls and makes the upcoming sequence readable.
2. Permanent short/medium/wide chips — superseded by the revised preview; they
   duplicate selection and do not scale to different attachment shapes.
3. A selector in every set row — not selected for the first version; useful for
   constant alternation, but adds repeated controls to this requested sequence.

## Exact identity, mechanics and images

Add `lat-pulldown-close-neutral-ergonomic-handle` as a new stable exact variant
under `lat-pulldown`; this ID is an engineering proposal. Do not repurpose
`lat-pulldown`, its legacy alias, or `lat-pulldown-close-neutral-v-handle`.
Describe the compact black ergonomic handle, opposed neutral palms, close hand
spacing and reviewed hand contact. Initial qualitative catalog mapping remains
lats Primary, biceps/upper-back Secondary, subject to the existing exact-variant
review. It is not a measured recruitment ranking.

The existing START and FINISH illustrations and separate 3D handle view are
source candidates for this exact variant. Review the pair together under
EXERCISE_ASSETS: contact, hands/wrists, seated setup and feet, coherent machine,
cable/pulley, lifted plates/selector and unchanged identity/camera. Export
separate offline local assets only after that gate; no remote image service.
User acceptance of the preview is not fabricated tracker/provenance approval.
Retain an explicit reviewed manifest mapping exact variant/model/phase to local
assets; never use compact-handle artwork for another configuration. Missing
artwork retains an honest placeholder, including a Female presentation without
an approved Female asset. A missing thumbnail does not imply an accessory is
unnecessary.

Pinned source inventory (SHA-256; do not substitute an earlier candidate):

- Reference pack: `cresum-neutral-grip-reference-pack-v1.zip`, Library
  `libfile_63d99a91d42481919b1587a33910d5bd`, version 2. Its recorded START is
  approved; its FINISH is a candidate. Complete pair QA before production.
- START inside pack: `approved/start-close-neutral-v1.png`,
  `6e45e7bd5bb46cdb9bd255ed1a3f7af20650f4501294685e77ad03519493e9b8`.
- FINISH inside pack: `candidates/finish-close-neutral-v1.png`,
  `928ed313dcb62f9ee244440044849138ae69729e4dba39c9ec2f1be266e30780`.
- Thumbnail candidate: in the pack's nested
  `source/cresum-spatial-guide-draft-v1.zip`, at
  `cresum-spatial-guide-draft/handle-3d-study/output/quarter.png`,
  `e31478e5b6912d60cd9ce76bea6849554fee870743f75a169ad30b64e40e5e73`;
  this is the saved approximate 3D geometry, not measured CAD. Preserve this
  separate candidate alongside source provenance before export/thumbnail review.

The source pack is a production input, not a runtime/CI dependency. The reviewed
exports and their source hashes must be committed with the application manifest.

Initial production choices can include existing reviewed specific V-handle and
wide-pronated-bar configurations, clearly named as such, using placeholders
where their artwork is absent. Do not call a wide bar a wide ergonomic handle.
Medium/wide ergonomic prototype rows are not selectable production choices
until their exact form, orientation, technique and muscle metadata are reviewed.

Width alone does not authorize different primary muscles, regional coefficients
or activation percentages. Store evidence scope separately from qualitative
roles; preserve existing Muscle Map participation calculations. Research examined
EMG, chiefly in male samples, not long-term hypertrophy or our exact hardware:
[Andersen 2014](https://pubmed.ncbi.nlm.nih.gov/24662157/),
[Buonsenso 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12452428/).

## Proposed data boundary

Keep existing flat exact-variant exercise snapshots as the source of logged
sets. Add optional `exerciseGroup: { id, familyId, name }` to planned and active/
completed exercise entries; absence preserves legacy behavior. Group only an
explicitly created contiguous sequence, with one family and consistent frozen
group identity/name. Never infer grouping from family alone or merge history.
Each member retains its own canonical library ID and existing set IDs.

Add optional `plannedSets: { id, weight?, reps? }[]` to PlannedExercise for
individual presets. When present its length must equal `sets`; it supplies the
individual weight/reps. Existing `weight` remains the legacy default only when
plannedSets is absent. Preserve target/program provenance; planned rows are not
completed rows and do not contribute to volume. Existing unique exercise-ID
rules remain: one block per exact variant in a group. IDs identify rows; names
are display snapshots and never matching keys. Keep the existing 1–20 set limit
per exact variant block; grouping does not multiply it.

An omitted row weight/repetition means unspecified, materialized using the
existing target/default rules and never a fabricated zero. Supplied values must
pass the existing numeric constraints. Weight-free plan sharing omits both
default and individual weights. Validate reviewed family membership on new
writes; reading a historically valid snapshot with now-unavailable catalog
entries must preserve it rather than discard saved sets.

A pure compatibility registry owns contextual field labels, required/optional/
not-applicable policy and eligible canonical variants. Offered choices must
resolve to a real reviewed catalog configuration. An optional `none` choice
resolves to an explicitly supported base configuration, never to an unknown or
mandatory-handle configuration. Do not introduce arbitrary accessory combinations
or assume all family members share the same contact geometry.

For an exercise without reviewed compatibility-policy metadata, preserve its
existing primary-equipment information and omit the new picker. Do not infer
not-applicable or insert a `none` option. This lets policy coverage expand safely.

Configuration entry points are the saved-plan editor and the existing Add
Exercise flow when composing or adding to a workout. Standalone Library details
remain informational until the user invokes an existing add/configure action.
Active sessions display the group and allow normal weight/reps/completion edits;
they do not replace an existing block's variant or reinterpret completed rows.
New groups can be appended through Add Exercise as one atomic operation.
If a selected exact variant already occurs outside the draft's group, reject
the addition before mutation with an actionable already-added message. Do not
move, absorb or silently merge that occurrence. Existing legacy duplicate
session occurrences stay readable and retain their behavior.

Starting a plan materializes exact-variant children once; the UI projects them
as one station card. Completion, timers, set edits, move/remove and current
exercise navigation continue to address the exact child and set. Moving a
station moves its whole contiguous group; removing one block never removes
another block's completed rows. Previous performance and strength/estimated 1RM
stay variant-specific; total volume and factual participation count each set once.

Local validation, recovery, backup/import, template duplication/personal-copy
editing, published-plan transfer and cloud History mapping must preserve these
fields. Old records load unchanged. Update versioned wire contracts where strict
validators require it; never silently drop group/preset information. Old-client
imports must reject an unsupported version clearly rather than corrupt a plan.
No deployed remote migration is authorized by this documentation step.

## Presentation and states

Use React Native + Expo + TypeScript and existing theme/sheet primitives; no new
dependency is planned. Keep all new messages, catalog/technique labels and spoken
labels in EN/RU/DE/FR. Preserve white artwork backgrounds and existing light UI.
Selection has a textual/semantic state as well as its checkmark. Support back,
screen-reader dismissal/focus restoration, reduced motion and 44-point targets.
Check 320/390-point widths and enlarged text. A long list can scroll in the
native sheet without hiding its title/close action.

Empty/unreviewed choices do not become false fallbacks. Unknown saved variant
information remains visible as unavailable; do not replace it with another
attachment or discard completed sets. Failed persistence retains the editable
draft and retry action. Offline Core includes all accepted assets/metadata.

## Delivery boundaries and acceptance

Deliver small increments: exact compact variant and image integration; reusable
picker/compatibility policy; grouped prescriptions and all supported roundtrips;
session/History presentation; localized regression and phone review.
Do not claim the complete grouped workflow after only adding images.

Automated acceptance must show cancel/save isolation, per-variant draft retention,
two-plus-two-plus-two = six sets, set defaults without overwriting edited rows,
one station card, correct transition cues/timer, restart/backup/transfer retention,
unchanged legacy history and separate strength records. Physical native review
is still required; Expo exports and web checks alone do not close it.

## Non-goals and builder discretion

No new machine inventory, measured handle dimensions, fabricated muscle-load
coefficients, 3D runtime, Female image generation, simultaneous multi-accessory
combinations, supersets, account requirement or rewrite of the workout engine.
The builder may select focused file decomposition, native sheet behavior and
optimized local image format/size within the approved identity and QA rules.
