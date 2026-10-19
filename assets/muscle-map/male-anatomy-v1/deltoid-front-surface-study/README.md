# Anterior and lateral deltoid surface review

Four independently traced front-view proposals on the unchanged 1312 × 1199
source: anatomical left/right anterior and lateral deltoid surfaces. The visible
fiber separators guide the draft, but the generated source cannot confirm exact
head boundaries. Both geometry and head assignment remain under review.

The existing front-delts and side-delts IDs are intended parent identities only;
this study does not modify exercise mapping, scores or production rendering.
Previously accepted posterior-shoulder surface exports remain unchanged, with
their unresolved anatomical assignment preserved. No hidden surface is painted.

Each side/head has independent source-pixel inset (−3…+6), inward X (−5…+5)
and vertical Y (−10…+10), at 0.5 px steps. Positive inset contracts; inward
positive maps front left to negative X and right to positive X. Negative Y
is up on both sides. Defaults are zero pending review. Runtime opacity is
applied once to the common mask group, retaining source texture with multiply.
No percentage is baked into geometry. Outline mode is for review only.

Anatomical reference: https://pmc.ncbi.nlm.nih.gov/articles/PMC3042752/.
The finer intramuscular segments described there are not identifiable here and
are not invented on the illustration.

Rebuild masks:
`python scripts/build-deltoid-front-surface-study.py --options-file /tmp/deltoid-options.json`.
Build review:
`python scripts/build-deltoid-front-review.py --options-file /tmp/deltoid-options.json --output /workspace/cresum-deltoid-front-review.html`.
