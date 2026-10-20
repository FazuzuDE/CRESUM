# Teres minor visible-surface candidates

Two independently traced small triangular patches under the posterior deltoid,
between the proposed infraspinatus and teres major surfaces. Exact identity on
the stylized character remains provisional. Hidden coverage, tendons and
neighboring accepted surfaces are excluded. No unsupported head split is added.

Reference: https://www.ncbi.nlm.nih.gov/books/NBK513324/ guides orientation
only; external artwork is not copied. Candidate contours require visual review.
Keep null muscleGroupId and orange fill without changing training taxonomy,
exercise mappings, load coefficients or production rendering.

Back anatomical left is screen left. Positive inward means left +X/right −X;
negative Y is up on both sides. Independent inset −3…+6 and inward/Y −10…+10
controls use 0.5 source px steps. Strong contraction can hide these small
patches; returning toward zero restores them. Opacity stays runtime-variable.
Fit report records contact with selected neighboring scapular masks for review.

Rebuild: `python scripts/build-teres-minor-surface-study.py --options-file /tmp/teres-minor-options.json`.
Review: `python scripts/build-teres-minor-review.py --options-file /tmp/teres-minor-options.json --output /workspace/cresum-teres-minor-review.html`.

Selected appearance is visually approved from 8F7FA941: anatomical L/R inset
−0.5/0, inward +1/−1, Y −0.5/−0.5 source px. Selected SVG/PNG/geometry and
review defaults retain these values. Baseline remains draft; exact identity,
combined scapular boundaries and load assignment remain provisional.
