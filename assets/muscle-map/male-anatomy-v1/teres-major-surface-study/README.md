# Teres major visible-surface candidates

Two lower oblique scapular patches, independently traced as proposed exposed
teres major surfaces. Superior edges follow the oblique groove below the
small triangular teres-minor-region patch, medial edges follow the border
with infraspinatus and inferior edges follow the latissimus-side groove.
Hidden coverage, tendons and neighboring patches are excluded. Exact identity
on this stylized source is provisional; boundaries await visual review.

Reference: https://www.ncbi.nlm.nih.gov/books/NBK580487/ guides orientation
only; external artwork is not copied. Keep muscleGroupId null and orange
candidate fill. Do not change accepted masks, taxonomy or load coefficients.

Back anatomical left is screen left. Inward positive means left +X/right −X.
Y negative is up on both sides. Independent inset −3…+6 and inward/Y −10…+10
controls use 0.5 source px steps; opacity remains per-muscle runtime-variable.
Fit report records 76 interior pixels of contact with selected infraspinatus;
combined scapular boundaries remain under review. Accepted masks are unchanged.

Rebuild: `python scripts/build-teres-major-surface-study.py --options-file /tmp/teres-major-options.json`.
Review: `python scripts/build-teres-major-review.py --options-file /tmp/teres-major-options.json --output /workspace/cresum-teres-major-review.html`.
