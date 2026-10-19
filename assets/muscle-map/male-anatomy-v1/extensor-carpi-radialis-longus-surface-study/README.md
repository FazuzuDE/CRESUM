# Extensor carpi radialis longus visible-surface proposals

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
