# Extensor carpi ulnaris visible-surface proposals

Revision 2 follows the source's diagonal medial-belly groove more closely.
The first masks crossed this groove into the adjacent patch. Retraced inner
edges are narrower, outer edges follow the source silhouette with a small
antialiasing margin, and distal ends stop earlier near the tendon transition.
Both sides have independent source landmarks at roughly 5 px intervals.
`revision-1/` preserves the superseded, unapproved exports byte-for-byte.
Revision 2 remains draft boundary and structure review.

Screenshot 4297D98E selects anatomical L/R inset 0/0, inward +3/0 and
Y −0.5/0 source px. Separate selected SVG/PNG/geometry and review defaults
retain these values with user-selected-parameters status, awaiting explicit
visual approval. Baseline and archived files are unchanged.

Two independent medial posterior forearm belly candidates, traced separately
on the unchanged 1312 × 1199 source. Exact identity and boundaries remain
provisional on this stylized illustration. These are visible-surface proposals,
not full-muscle coverage or expert anatomical validation.

Reference: https://www.ncbi.nlm.nih.gov/books/NBK539760/ describes ECU as the
most medial superficial posterior extensor, adjacent to extensor digiti minimi
and extensor digitorum. The proximal anconeus and distal wrist tendon are
excluded. Humeral/ulnar heads cannot be distinguished on this source, so their
separation is deferred. References guide identification; contours follow the
original character, without copying external artwork.

Retain the forearms parent. Previously approved extensor digitorum and front
forearm masks remain unchanged. No exercise mapping or load coefficients change.
Back-view anatomical left is screen left: positive inward X is left +X, right
−X; negative Y is up for both. Review ranges: inset −3…+6, inward and vertical
−10…+10 source px, step 0.5. Initial adjustments are zero, not approved settings.
Opacity is a per-muscle runtime variable applied once to the common group.

Rebuild:
`python scripts/build-extensor-carpi-ulnaris-surface-study.py --options-file /tmp/ecu-options.json`.
Review:
`python scripts/build-extensor-carpi-ulnaris-review.py --options-file /tmp/ecu-options.json --output /workspace/cresum-extensor-carpi-ulnaris-review.html`.
