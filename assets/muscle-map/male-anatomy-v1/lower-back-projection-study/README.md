# Lower-back projection study — review only

The user identified the missing lumbar training-load representation and approved
preparing independent left/right areas before integration. This is an explicitly
schematic projection beneath the thoracolumbar fascia on the unchanged source,
not a visible-surface trace or a confirmed individual-muscle segmentation.
The fascia is not relabeled as muscle; longissimus, iliocostalis, multifidus and
quadratus lumborum are not given invented separate contours. Projection extents
are design choices requiring review, not anatomy inferred from illustration
texture or transferred from the papers below.

Two full-canvas masks retain the existing `lower-back` parent without changing
exercise mappings or adding load coefficients. Independent monotone edge guides
control each side. The central source strip x=936…943 stays neutral and the
projection ends before y=510, leaving the lower sacral region unpainted. Baseline
mutual overlap and source-background pixels are zero. Baseline contacts with the
accepted bilateral lats, trapezius and gluteus maximus are zero. These checks
measure geometry only; they do not establish anatomical correctness.

Status: `draft-regional-projection-review`. Zero inset/X/Y values are initial
review defaults, not selected or accepted geometry. Insets −3…+6 and X/Y shifts
±10 source px use 0.5 px steps. Back-view left is screen left; inward positive
is left +X/right −X and positive Y is down. Preview opacity stays independent.
An 18% neighboring-mask context is a review aid, not a training-load value.

The separate reviewer embeds the exact eight accepted trapezius/lats/gluteal
paths, transforms and clips from the 90-region composition. Context can be hidden.
The existing combined manifest, geometry, report and all prior masks stay
byte-identical. The new projection is not inserted into that composition or
production. Boundaries and representation await visual approval.

Rebuild: `python scripts/build-lower-back-projection-study.py --options-file PATH`.
Review: `python scripts/build-lower-back-review.py --options-file PATH
--output /workspace/cresum-lower-back-projection-review.html`.
Check: `node scripts/check-lower-back-review.cjs
/workspace/cresum-lower-back-projection-review.html`.

Anatomical context, not source-specific shape validation:

- https://pubmed.ncbi.nlm.nih.gov/18087664/ — fascia/aponeurosis covering erector spinae.
- https://pubmed.ncbi.nlm.nih.gov/22582887/ — paraspinal fascial compartment and its lateral relationship.

The untouched 1312 × 1199 source SHA-256 is stored in annotations/report and
checked by the builder. No new source muscle texture, anatomy illustration,
exercise semantics, scoring or native renderer is generated.
