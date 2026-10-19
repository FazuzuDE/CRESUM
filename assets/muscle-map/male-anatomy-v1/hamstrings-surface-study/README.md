# Posterior thighs — independent visible-surface drafts

The user requested maximum appropriate anatomical separation, retaining stable
parent groups. This study manually annotates the unchanged source directly at
1312 × 1199, using enlarged original thighs rather than the broad cyan outline
as final segmentation. It proposes independent visible biceps femoris and
semitendinosus surfaces on each side: four draft masks under `hamstrings`.

The generated illustration does not clearly establish the exposed boundaries of
semimembranosus versus the adjacent medial strip. Two additional inner regions
are preserved as `medial-unassigned`, with `muscleGroupId: null` and an intended
semimembranosus target only. They are excluded from the hamstrings union and
default group preview. Orange isolated review does not imply load assignment.
No separate hidden short biceps head or covered deep surface is fabricated.
All anatomical assignments and boundaries remain drafts, not accepted anatomy.

`annotations.json` stores source-coordinate landmarks; PNG/SVG/geometry retain
six independently editable regions. `hamstrings-union` contains only the four
assigned proposals. Baseline masks have zero overlapping interior pixels.
Source hashes and checks are in `fit-report.json`. Zero overlap measures geometry,
not anatomical validity. Existing approved masks and app renderer are unchanged.

Review exposes individual structures/sides, independent −3…+6 px insets and
−5…+5 px inward shifts, in 0.5-source-pixel steps. Back-view anatomical left is
screen left: positive inward shift means +X on left and −X on right. Runtime
load intensity remains separate; the opacity slider is preview-only.

Rebuild with `python scripts/build-hamstrings-surface-study.py --options-file PATH`.

## Revision 2 — closer source tracing

The user rejected the first boundary proposal and requested a more accurate
retry. Preserve it in `previous-annotations.json` / `previous-geometry.json`.
Revision 2 independently follows 5× original thigh crops: the dark lateral and
intermuscular grooves, curved gluteal crease and longer distal surface taper.
The previous semitendinosus mask's arbitrary mid-thigh termination is removed.
Fine distal tendon boundaries remain visually ambiguous in the generated source;
the revised regions remain review proposals, not exact anatomical segmentation.
The two medial strips retain unassigned status and remain excluded from the union.

## User-selected four-mask set

The user deferred the inner regions and supplied IMG_8212/IMG_8213 settings.
`selection.json` records all four inset/shift pairs; `selected-geometry.json`
and `*-selected` exports contain only biceps femoris and semitendinosus, two
sides each. Deferred medial candidates remain archived in the baseline study
and are removed from the active selection and review selector.

In anatomical left/right order: biceps insets −1.5 / −2 px, inward shifts
+1.5 / +1 px; semitendinosus insets −3 / −3 px, inward shifts −0.5 / −3 px.
On the back view, positive inward shift is +X for left and −X for right.
Selected surfaces overlap in 670 interior pixels; render their union before
applying intensity once. No saturation value is stored in the selection.
These are user-selected parameters pending review of the combined result.
