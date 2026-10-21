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
−10…+10 px inward shifts, in 0.5-source-pixel steps. Back-view anatomical left is
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

## Combined review continuation — 2026-10-20

Restore the eight saved inset/inward values without changing the four selected
mask exports or pending appearance status. Vertical controls start at zero
(no prior Y settings were supplied); X/Y shifts span ±10 source px at 0.5 px
steps. The builder supports independent Y and records zero Y explicitly in
selected geometry, preserving all existing contours and transforms.
The versioned review builder/template includes only the four selected regions;
the two deferred inner strips stay outside its selector, geometry and union.

Selected overlap remains 670 raw-float interior pixels (772 quantized PNG
pixels), with zero background clipping. Keep these contacts for combined
boundary review. Render the union, then apply runtime intensity once.
Build review with `python scripts/build-hamstrings-review.py --options-file PATH
--output /workspace/cresum-hamstrings-review.html`.

## Selected appearance accepted — 2026-10-20

The user explicitly accepted four posterior-thigh regions using the latest
screenshots. image(20261020-134749).png selects biceps femoris anatomical L/R
inset −2/−2.5, inward +1.5/+1, Y +4/0. image(20261020-134825).png selects
semitendinosus inset −3/−3, inward −0.5/−3, Y +2/+1 source px. Save all twelve
values and visual approval; regenerate selected PNG/SVG/geometry and union.
All baseline/revision-1 contours and the two deferred inner strips stay unchanged.
Selected overlap is now 773 raw-float / 875 quantized PNG interior pixels,
with zero background clipping. Retain these contacts for combined boundary
review. The hamstrings parent stays unchanged; exact anatomical validation is
separate, and 65% screenshot opacity is preview-only. Next: tibialis anterior,
the final two-region block before combined front/back review.
