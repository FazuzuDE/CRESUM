# Biceps reference study

The user selected the assistant's cyan biceps guide for direct mask transfer on
2026-10-18. `reference.png` preserves that generated guide; `source.png` in the
parent directory remains the rendering base. The guide is not exact anatomical
segmentation. Both red-mask appearances were visually approved on 2026-10-18.

Both visible front biceps surfaces are extracted independently, including the
visible cyan stroke, then locally registered against grayscale upper-arm detail.
`registration.json` records hashes, per-side transforms and local correlations.
Left/right always means the character's anatomical side: left is on screen right.

`geometry.json`, SVGs and PNGs use the common 1312 × 1199 canvas. Initial inset is
0 px per side. Review offers −3 to +6 source pixels in 0.5-pixel steps: negative
expands and positive narrows. Each side has its own value; optional linked editing
copies the active value to both. These are geometric settings, not load scores.
The approved shoulder inset of 3.5 px is not applied to biceps automatically.

The user subsequently approved both anatomical sides at 1.5 px inset. Retain
the displayed right-side +3 source-pixel X translation toward the torso.
Its position control spans 0–10 px in 0.5 px steps. PNG/SVG/geometry exports
contain these selections; review options retain unshifted paths so the live
translation does not accumulate. This records visual acceptance of the study.

Rebuild with `python scripts/build-biceps-reference.py --options-file PATH`.
Existing offline Pillow/numpy/scipy/contourpy dependencies suffice. No production
renderer, exercise mappings or training calculations are changed.
