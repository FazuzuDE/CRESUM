# Brachialis lateral visible-surface proposals

Two independent front-view exposed upper-arm patches beside biceps. Exact
identity and boundaries remain provisional on the stylized source. The hidden
surface underneath biceps, deep head and distal tendon are excluded; source
visibility does not support a superficial/deep-head split here.

Reference: https://www.ncbi.nlm.nih.gov/books/NBK551630/ describes brachialis
deep to biceps in the anterior distal arm, and its superficial/deep head
anatomy. The reference guides orientation, not source-specific validation or
copying external artwork into the character.

Keep muscleGroupId null and orange candidate fill until load-group assignment
is decided. No automatic biceps/forearms mapping, new taxonomy or exercise
coefficients are introduced. Preserve the accepted biceps and prior selections.
Contact with accepted biceps is recorded in fit-report for combined review.

Front-view anatomical left is screen right: inward positive is left −X/right
+X. Negative Y is up for both. Independent controls retain inset −3…+6,
inward/vertical −10…+10 source px, step 0.5. A large positive inset may hide
the thin visible patch; returning toward zero restores it. Opacity remains a
runtime per-muscle variable. The review opens enlarged on anatomical left.

Rebuild:
`python scripts/build-brachialis-surface-study.py --options-file /tmp/brachialis-options.json`.
Review:
`python scripts/build-brachialis-review.py --options-file /tmp/brachialis-options.json --output /workspace/cresum-brachialis-review.html`.
