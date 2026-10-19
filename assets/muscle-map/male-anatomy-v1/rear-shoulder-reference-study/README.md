# Returned posterior-shoulder contours — 2026-10-18

Draft pending visual and anatomical boundary review. `reference.jpeg` is the
actual user-returned annotated file (IMG_8200.jpeg), preserved without edits.
Two closed cyan interiors are extracted independently and registered to the
unchanged approved `../source.png` canvas of 1312 × 1199.

The reference is 1085 × 992. Local grayscale shoulder/upper-thorax fitting
excludes colored annotations and estimates independent axis scales and
translation. Input hashes, dimensions, transform, local residual and conversion
deviation are recorded in `registration.json`. Local fit quality is not a
measurement of anatomical accuracy or a whole-body registration guarantee.

These contours enclose the visible posterior shoulder caps. The distinction
between posterior and lateral deltoid portions has not been confirmed. Keep
`muscleGroupId: null`, the intended target `rear-delts`, and an explicit
unassigned boundary-review status. Do not replace catalog rear/side groups or
their production masks with these surfaces. The old atlas remains available
only as a comparison; it is not anatomical ground truth.

Reproduce with the existing offline Pillow/numpy/scipy/contourpy toolchain:

```sh
python scripts/extract-muscle-reference.py assets/muscle-map/male-anatomy-v1/rear-shoulder-reference-study/reference.jpeg --study rear-shoulder-reference-study
```

The JPEG's cyan cores are selected by chroma and closed; each interior expands
one reference pixel toward the stroke center before resampling and SVG fitting.
Review uses source-texture-preserving red tint, ordinary antialiasing and no
added presentation blur or outline. Both sides can be isolated and viewed at
detail/phone scale. No original image, accepted chest/traps/lats reference,
exercise taxonomy, training calculation, saved data or app renderer is changed.
