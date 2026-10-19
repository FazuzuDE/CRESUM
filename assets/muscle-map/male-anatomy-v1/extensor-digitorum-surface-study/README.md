# Extensor digitorum posterior surface proposals

Revision 2 retraces the central visible posterior belly independently on each
arm. Revision 1 overreached into the adjacent medial strip and is retained in
`revision-1/` as superseded, unapproved geometry. The new proximal edge follows
the diagonal groove below the elbow; the distal end follows the central taper
and stops above the wrist retinaculum. Boundaries and exact identity still need
visual/anatomical review. Independent inset/X/Y controls remain available.

Two separately traced back-view forearm belly proposals. Exact structure identity
and boundaries remain provisional on the stylized source; these are not complete
extensor-compartment masks. Hidden proximal continuation, long distal tendons,
individual finger compartments and neighboring extensor bellies are excluded.

Reference: https://www.ncbi.nlm.nih.gov/books/NBK534805/ describes extensor
digitorum as a superficial posterior forearm muscle. It guides orientation, not
expert validation of this illustration or exact visible boundaries.

Preserve forearms parent, unchanged source/canvas 1312 × 1199 and prior approved
forearm selections. Posterior silhouette clipping uses the back figure only.
In the back view anatomical left is screen left: inward +X on left and −X on
right. Vertical negative is up on both sides. Controls: inset −3…+6, inward
−10…+10, vertical −10…+10 source px, step 0.5, zero defaults until selected.
Runtime opacity is applied once to the common group with multiply shading.
No exercise mappings, load coefficients or production rendering change.

Rebuild:
`python scripts/build-extensor-digitorum-surface-study.py --options-file /tmp/ed-options.json`.
Review:
`python scripts/build-extensor-digitorum-review.py --options-file /tmp/ed-options.json --output /workspace/cresum-extensor-digitorum-review.html`.
