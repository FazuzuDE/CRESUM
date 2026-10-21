# Latissimus dorsi surface study — 2026-10-18

Draft pending visual review. Independently annotated posterior left/right
visible muscle surfaces on the unchanged 1312 × 1199 approved source. Preserve
the existing `lats` group ID; no exercise mapping, scoring or renderer changes.
Source-image boundaries are manually interpreted, not automated segmentation.

The upper edge follows the visible transition below the scapular muscles; the
medial edge follows the accepted trapezius and the pale lumbar/aponeurotic
transition. Do not paint a hidden humeral insertion, the central pale lumbar
region, or adjacent lateral abdominal muscles. The illustration's ambiguity
limits precision. No expert anatomical acceptance is claimed.

Reference context: [Willard et al., The thoracolumbar fascia: anatomy, function
and clinical considerations](https://pmc.ncbi.nlm.nih.gov/articles/PMC3512278/)
and [Bogduk and Macintosh, The applied anatomy of the thoracolumbar
fascia](https://pubmed.ncbi.nlm.nih.gov/6729580/). These explain the muscular and
aponeurotic relationship; their diagrams and geometry were not copied. They do
not verify the source illustration or the manually selected pixel boundaries.

Reproduce with the existing offline Pillow/numpy/scipy/contourpy toolchain:

```sh
python scripts/trace-muscle-surface-study.py --study lats-study
```

PNG masks, SVG contours and geometry share the original canvas. The conversion
report measures raster/vector drift only. Preview uses uniform red, retained
source texture, ordinary antialiasing and no added feather, blur or stroke.
The enlarged/phone-scale reviewer compares these candidates with the prior
draft and can show the accepted trapezius to inspect neighboring boundaries.
