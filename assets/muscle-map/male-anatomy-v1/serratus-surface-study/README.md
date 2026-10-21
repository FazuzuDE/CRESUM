# Serratus-region visible surface candidates

Six manually traced candidate patches, three per side, on the fixed source.
They preserve separately editable visible contours rather than painting hidden
connections beneath pectoral muscles. These are partial surface proposals, not
a complete serratus anterior muscle or confirmed rib attachments. The labels
upper/middle/lower refer only to the three visible patches, not anatomical
superior/intermediate/inferior subdivisions or rib numbers.

Assignment and boundaries are pending review. The generated illustration alone
does not establish muscle identity. All load-group IDs remain null; no serratus
entry exists in the current 17-group taxonomy. Orange denotes these unassigned
candidates in the review. The candidate-only union is not a training-load group
and is not integrated into the production atlas. Existing abdominal selections
and their separate review status remain unchanged.

Anatomical orientation reference:
https://www.ncbi.nlm.nih.gov/books/NBK531457/ — much of serratus anterior lies
under pectoral/scapular structures. Lower interdigitating regions near external
oblique are deferred rather than given invented continuous contours.

Each candidate retains the original 1312 × 1199 canvas. Review controls offer
independent side/patch inset (−3…+6), inward X (−10…+10) and vertical Y (−10…+10)
in source px, at 0.5 px steps. Defaults load the screenshot-derived selection when present; otherwise zero. In front view inward positive
means left negative X / right positive X; negative Y is up on both sides.
Runtime opacity remains independent of geometry, applied once to the group.

Rebuild geometry:
`python scripts/build-serratus-surface-study.py --options-file /tmp/serratus-options.json`.
Build the review fragment:
`python scripts/build-serratus-review.py --options-file /tmp/serratus-options.json --output /workspace/cresum-serratus-review.html`.

Screenshot checkpoint (image(20261020-132259), image(20261020-132252) and
image(20261020-132244)): values in anatomical
left / right order, source pixels. Upper: inset −1 / −1, inward +2.5 / +3.5,
Y 0 / 0. Middle: inset 0 / 0, inward +1.5 / +2.5, Y −1.5 / −0.5. Lower:
inset 1.5 / 1.5, inward −3.5 / −3.5, Y −1 / −1. Selection metadata and separate
selected SVG/PNG exports preserve these settings; baseline candidates remain
unchanged. Status is user-selected-parameters, with combined appearance and
anatomical identity still under review. All selected load-group IDs remain null.

## Combined review continuation — 2026-10-20

All 18 saved inset/X/Y values and every baseline/selected mask export remain
unchanged. Horizontal review shifts now span ±10 px, matching Y, with 0.5 px
steps. Start with all six patches for combined review; selecting a patch
restores its independent settings. This continuation does not approve the
selected appearance, infer a load group or add hidden/deeper surfaces.

## Screenshot selection update — 2026-10-20

The latest three screenshots retain upper/middle settings and revise both lower
patches to inset 1.5, inward −3.5 and Y −1 source px. Regenerate the lower selected
exports and combined union while preserving the baseline and upper/middle
selected masks byte-for-byte. All 18 values restore in the combined review.
Screenshot opacity 65% is preview-only. Appearance and identity remain pending;
no load group is assigned and the queue stays four blocks / 16 regions.

The selected set retains 6 mutual interior overlap pixels in both raw-float
and quantized PNG checks, with zero background pixels clipped. Keep these
contacts recorded for combined boundary review without altering the selection.

## Combined selected appearance accepted — 2026-10-20

The user explicitly accepted the combined six-patch selection. Status is now
visually-approved; retain all 18 screenshot-derived parameters and every
baseline/selected raster/vector mask byte-for-byte. The 6 mutual overlap pixels
and zero background clipping remain recorded for combined boundary review.
Anatomical identity is still provisional, group IDs null and opacity runtime-
variable. Next: four anterior/lateral deltoid regions with saved defaults.
Three blocks / 10 regions remain before combined front/back review.
