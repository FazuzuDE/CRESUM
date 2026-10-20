# Sternocleidomastoid visible-surface candidates

Two independent exposed anterior-neck oblique-band candidates on the fixed
source. Partial surface coverage only: exact identity and lower head separation
remain provisional. The source does not reliably support separate sternal and
clavicular head masks; defer that split. Exclude central throat, adjacent
neck-triangle surfaces and hidden cranial/sternal/clavicular attachments.

Orientation reference only, no artwork copied:
https://www.ncbi.nlm.nih.gov/books/NBK532881/

Draft-boundary-and-structure-review, null muscleGroupId and orange candidate
fill. Opacity is a per-muscle runtime variable. Independent 0.5 source-pixel
inset and X/Y controls retain ±10 px shift ranges. Front anatomical left is
screen right; inward left −X/right +X, positive Y down.

Build: `python scripts/build-sternocleidomastoid-surface-study.py --options-file /tmp/scm-options.json`.
Review: `python scripts/build-sternocleidomastoid-review.py --options-file /tmp/scm-options.json --output /workspace/cresum-sternocleidomastoid-review.html`.

No training taxonomy, exercise mappings, coefficients or production changes.
