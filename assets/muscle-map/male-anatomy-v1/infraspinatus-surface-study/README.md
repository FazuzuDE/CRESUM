# Infraspinatus visible-surface candidates

Two independently traced posterior scapular patches, proposed as the exposed
infraspinatus. Follow the superior deltoid-side groove, the medial trapezius
border and the inferior oblique groove toward the adjacent teres region.
Hidden coverage under deltoid/trapezius and neighboring oblique patches are
excluded. The stylized source does not validate exact anatomical identity.

Reference: https://www.ncbi.nlm.nih.gov/books/NBK513255/ guides orientation
only; external artwork is not copied. Boundary/identity review is pending,
with null muscleGroupId and orange candidate fill. No existing accepted
geometry, taxonomy, exercise coefficients or production renderer is changed.

Back-view anatomical left is screen left; inward positive is left +X/right
−X. Y negative is up on both sides. Independent inset −3…+6 and inward/Y
−10…+10 controls use 0.5 source-pixel steps. Opacity is a runtime variable.

Rebuild: `python scripts/build-infraspinatus-surface-study.py --options-file /tmp/infraspinatus-options.json`.
Review: `python scripts/build-infraspinatus-review.py --options-file /tmp/infraspinatus-options.json --output /workspace/cresum-infraspinatus-review.html`.

Fit report records contact with accepted trapezius for combined review.
User approval of brachialis does not approve these new candidates.

Selected appearance is visually approved from IMG_8242: anatomical L/R inset
−1/0.5, inward +2.5/−1.5, Y +1/+1 source px. Separate selected exports and
review defaults retain these settings. Baseline stays draft; exact identity
and combined scapular boundaries remain provisional, group IDs null.
