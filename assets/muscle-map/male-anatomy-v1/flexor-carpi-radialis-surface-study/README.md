# Flexor carpi radialis surface proposals

Two independently traced front-view forearm patches, proposed as visible flexor
carpi radialis bellies. Both the boundaries and exact anatomical identity remain
under review; this stylized source does not resolve every superficial flexor.
The pale elbow aponeurosis, neighboring bellies, hidden continuation and long
distal tendons are excluded. These are partial surface proposals, not full
origin-to-insertion depictions.

Reference: https://pmc.ncbi.nlm.nih.gov/articles/PMC9464466/ describes FCR as a
superficial anterior-forearm muscle running inferiorly and laterally from its
proximal origin. This guides orientation, not a claim of exact registration.

Retain the existing forearms parent, independent anatomical left/right masks,
unchanged 1312 × 1199 source and canvas, common-group runtime opacity and
multiply shading. Accepted brachioradialis selected masks remain unchanged.
No new exercise coefficients or production renderer integration are implied.

Controls: inset −3…+6, inward X −5…+5, Y −10…+10 source px, step 0.5.
Positive inset contracts; front inward positive maps left to negative X and
right to positive X. Negative Y moves up on both sides. Initial values are zero;
future selection.json values restore separately for each side.

Rebuild masks:
`python scripts/build-flexor-carpi-radialis-surface-study.py --options-file /tmp/fcr-options.json`.
Build review:
`python scripts/build-flexor-carpi-radialis-review.py --options-file /tmp/fcr-options.json --output /workspace/cresum-flexor-carpi-radialis-review.html`.
