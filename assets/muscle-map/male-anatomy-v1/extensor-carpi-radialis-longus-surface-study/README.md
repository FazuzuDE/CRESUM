# Extensor carpi radialis longus visible-surface proposals

Revision 2 follows the proximal diagonal source groove below the upper oblique
patch, moves the lateral edge inside the silhouette and shortens the distal
tips near the tendon transition. Both sides are traced independently; prior
revision-1 exports are archived byte-identically as superseded/unapproved.
Revision 2 remains draft boundary and structure review.

Selected revision-2 appearance is visually approved from E30982CF: anatomical
L/R inset −1/−2, inward 0/0, Y −2.5/−2 source px. Separate selected geometry,
SVG/PNG and review defaults retain these states. Baseline and archived files
remain drafts. Exact identity and combined forearm boundaries remain provisional.

At a sufficiently large positive inset the thin visible patch can disappear.
The builder preserves that empty erosion as an empty path instead of widening
the source contour or failing. Returning the inset toward zero restores it.

Two independently traced posterolateral forearm belly proposals on the unchanged
1312 × 1199 source. Exact ECRL identity and neighboring ECRB/brachioradialis
separation remain provisional on this stylized illustration. These candidates
show visible patches only, not full-muscle coverage or expert validation.

Contact/overlap with the previously selected extensor digitorum is recorded
in `fit-report.json`. Combined forearm boundary review remains pending;
these proposals do not modify the accepted selection to force separation.

Reference: https://www.ncbi.nlm.nih.gov/books/NBK534805/ describes ECRL, ECRB
and brachioradialis as the posterolateral mobile wad, with distinct origins and
insertions. It guides orientation, not source-specific proof. Hidden proximal
continuation, distal wrist tendons and ambiguous deep surfaces are excluded;
the neighboring muscles are not silently included as accepted ECRL anatomy.

Preserve the forearms parent and prior accepted studies, including selected ECU
revision 2. No exercise mapping, load coefficients or production renderer change.
Back-view anatomical left is screen left: positive inward X is left +X/right
−X, negative Y is up on both. Controls retain inset −3…+6, inward/vertical
−10…+10 source px, step 0.5. Zero defaults are unapproved. Opacity stays a
runtime per-muscle variable applied once to the common group.

Rebuild:
`python scripts/build-extensor-carpi-radialis-longus-surface-study.py --options-file /tmp/ecrl-options.json`.
Review:
`python scripts/build-extensor-carpi-radialis-longus-review.py --options-file /tmp/ecrl-options.json --output /workspace/cresum-extensor-carpi-radialis-longus-review.html`.
