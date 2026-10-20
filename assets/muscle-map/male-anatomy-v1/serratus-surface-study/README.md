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

Screenshot checkpoint (IMG_8229, IMG_8230 and 34AC2D9B): values in anatomical
left / right order, source pixels. Upper: inset −1 / −1, inward +2.5 / +3.5,
Y 0 / 0. Middle: inset 0 / 0, inward +1.5 / +2.5, Y −1.5 / −0.5. Lower:
inset 1 / 1, inward −3 / −2.5, Y −1 / 0. Selection metadata and separate
selected SVG/PNG exports preserve these settings; baseline candidates remain
unchanged. Status is user-selected-parameters, with combined appearance and
anatomical identity still under review. All selected load-group IDs remain null.

## Combined review continuation — 2026-10-20

All 18 saved inset/X/Y values and every baseline/selected mask export remain
unchanged. Horizontal review shifts now span ±10 px, matching Y, with 0.5 px
steps. Start with all six patches for combined review; selecting a patch
restores its independent settings. This continuation does not approve the
selected appearance, infer a load group or add hidden/deeper surfaces.
