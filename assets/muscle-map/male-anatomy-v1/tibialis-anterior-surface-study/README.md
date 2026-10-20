# Tibialis anterior surface study

User-selected revision-2 variant saved on 2026-10-19: inset 1.5 px on both sides;
inward shift −0.5 px left and +1.5 px right. `selection.json` and selected
geometry/exports preserve this separately from the zero-adjustment baseline.
The selection is recorded as `user-selected-boundary-review`; no expert
anatomical validation or production integration is inferred. Both group IDs
remain null. The screenshot's 65% opacity is not baked into geometry.

Revision 2 retraces each side against enlarged source grooves, widens the
previously underfilled middle bellies, repositions the proximal tips and follows
the distal taper more gradually. `revision-1/` preserves the previous baseline
for comparison. Baseline contours remain drafts; selected adjustments are stored
separately as described above.
Signed-distance and contour regularization reduce tracing-grid irregularity;
no presentation blur or extra fill stroke is introduced.

Two independently traced anterior-shin muscle-belly candidates on the unchanged
1312 × 1199 source. `annotations.json` preserves per-side source coordinates and
source hash. PNG and SVG exports retain that full canvas. These are draft
surface boundaries, not expert anatomical validation or accepted production
assets. Adjacent toe extensors, fibular muscles and the distal tendon are not
intended to be included.

Anatomical orientation reference:
https://www.ncbi.nlm.nih.gov/books/NBK513304/ — tibialis anterior has a proximal
belly lateral to the tibia and a distal tendon; this reference does not validate
the generated mannequin's individual contours.

The current 17-group taxonomy has no tibialis-anterior ID. Both group IDs remain
null; do not map the anterior shin onto posterior `calves` or invent exercise
coefficients. No production taxonomy, exercise mapping or load formula changes.

The review restores the saved inset and shift values. Inset −3 through +6 source px and
inward horizontal shift −10 through +10 px are independently adjustable per side,
in 0.5 px steps. In this front view anatomical left is screen right, so positive
inward shift maps left to negative X and right to positive X. The source-body
silhouette clips shifted masks. Opacity remains a per-muscle runtime variable;
the UI saturation control is only for review. Fill adds no outline or blur.

Rebuild: `python scripts/build-tibialis-anterior-study.py --options-file /tmp/tibialis-options.json`.

## Combined review continuation — 2026-10-20

Restore all four saved inset/X values and keep `user-selected-boundary-review`;
this is not a new visual approval. Vertical controls default to zero because no
prior Y values were supplied; X/Y span ±10 px at 0.5 px steps. Record zero Y
explicitly in selected geometry without changing any masks, source or revision-1
archive. Two independent selected regions remain unassigned, with null groups.
Selected mutual overlap and background clipping are both zero. Contact with
adjacent fibularis remains for combined review, as recorded in that study.

Build review: `python scripts/build-tibialis-review.py --options-file PATH
--output /workspace/cresum-tibialis-review.html`. The single bilateral muscle
has independent side controls without a redundant muscle selector.
