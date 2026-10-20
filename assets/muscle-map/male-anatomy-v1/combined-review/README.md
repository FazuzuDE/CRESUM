# Combined selected-mask boundary review

Review-only assembly on the unchanged 1312 × 1199 source, not production atlas
integration. `manifest.json` explicitly lists 33 geometry inputs and their 90
selected regions: 52 front, 38 back. It imports exact paths/transforms and the
three distinct clips used by existing exports; no contour is retraced, trimmed
or subtracted. Source geometry hashes and selected PNG hashes are retained.

The 27 selected-geometry studies and earlier accepted biceps, cyan triceps,
trapezius, lats and 3.5 px posterior-shoulder variant are included. Only the two
large lats regions are used. Shoulder identity remains unresolved. The two
selected chest reference contours retain boundary-review-pending status: the
previous clear-edge presentation decision does not establish their final contour
approval. Older whole-front-shoulder masks are excluded in favor of the selected
anterior/lateral deltoids; only the second gluteus-medius study is included.
Deferred inner hamstrings, lower-lats strips, superseded revisions, hidden
coverage and original broad atlas masks are excluded.

`geometry.json` records exact imported vector paths and clip references.
`report.json` measures delivered PNG interiors >127: 3864 unique overlap pixels
across 53 contacting pairs, 41 across studies. Pair totals can double-count
pixels; SVG contour fitting can differ from the PNG threshold. These contacts
include parts within one load group and are not automatically anatomical errors.
Neutral gaps still require visual review; there is no invented coverage score.

The combined view offers front/back, upper/lower/full-body crops, source, fill,
individual boundaries and a raster-derived intersection diagnostic. Red denotes
existing group assignment; orange denotes the 36 unassigned regions, not a new
score. Purple marks intersections. Overall preview opacity is applied once to
the composition; per-muscle load behavior remains a separate native concern.
No fixed intensity is baked into a mask.

Reproduce:
`python scripts/build-combined-muscle-review.py --output /workspace/cresum-combined-boundary-review.html`.
Check interactions and exact imports:
`node scripts/check-combined-muscle-review.cjs /workspace/cresum-combined-boundary-review.html`.

The embedded WebP preview is reused from the existing source review; validation
and diagnostic rendering use the original PNG. No source, exercise mapping,
load formula, app renderer or prior selected mask is modified. Combined boundary
approval, exact anatomy, unresolved taxonomy and production assembly remain open.
