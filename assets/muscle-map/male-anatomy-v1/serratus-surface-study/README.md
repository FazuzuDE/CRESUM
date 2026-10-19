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
independent side/patch inset (−3…+6), inward X (−5…+5) and vertical Y (−10…+10)
in source px, at 0.5 px steps. Defaults are zero. In front view inward positive
means left negative X / right positive X; negative Y is up on both sides.
Runtime opacity remains independent of geometry, applied once to the group.

Rebuild geometry:
`python scripts/build-serratus-surface-study.py --options-file /tmp/serratus-options.json`.
Build the review fragment:
`python scripts/build-serratus-review.py --options-file /tmp/serratus-options.json --output /workspace/cresum-serratus-review.html`.
