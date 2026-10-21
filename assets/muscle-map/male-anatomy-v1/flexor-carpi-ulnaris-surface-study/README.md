# Flexor carpi ulnaris surface proposals

Continuation after visual acceptance of the selected FCR surfaces. Two medial
front-forearm patches are proposed as visible FCU bellies. Boundaries and exact
muscle identity remain provisional on this stylized source. The humeral and
ulnar proximal heads cannot be reliably separated here, so each side retains
one visible belly rather than invented head boundaries. Hidden continuation,
long distal tendon and wrist attachments are excluded.

Reference: https://www.ncbi.nlm.nih.gov/books/NBK526051/ describes FCU as the
most medial superficial anterior-forearm muscle with two proximal heads. This
guides orientation; it does not validate exact identification on the illustration.

Preserve forearms parent IDs, unchanged source/canvas 1312 × 1199, independent
anatomical sides and runtime opacity. Accepted brachioradialis and FCR selected
exports remain unchanged. No exercise mappings or production renderer change.

Controls retain inset −3…+6, inward X −5…+5 and vertical Y −10…+10 source px,
step 0.5. Positive inset contracts. Front left inward maps to negative X, right
to positive X; negative Y is up on both. Defaults restore selection.json when
present, otherwise zero. Apply opacity once to the common group.

Rebuild masks:
`python scripts/build-flexor-carpi-ulnaris-surface-study.py --options-file /tmp/fcu-options.json`.
Build review:
`python scripts/build-flexor-carpi-ulnaris-review.py --options-file /tmp/fcu-options.json --output /workspace/cresum-flexor-carpi-ulnaris-review.html`.

Approved screenshot checkpoint (image.png, 2026-10-19): anatomical L/R inset
1/0, inward +3/+3, Y 0/−1 source px. Separate selected exports and selection
metadata carry visually-approved status. Baseline candidates remain drafts and
exact anatomical identity stays provisional. Screenshot opacity 75% is ignored
as geometry; runtime load continues to control intensity.
