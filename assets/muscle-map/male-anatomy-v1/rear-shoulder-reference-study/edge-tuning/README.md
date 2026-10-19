# Shoulder edge tuning — review candidate

The user rejected the automatic full-outer-stroke fill as too wide. This
separate candidate narrows the current stroke-inclusive masks by 3 original
source pixels, using the Euclidean distance to their boundary. A 0.85-pixel
Gaussian prepares subpixel contour antialiasing before the closed SVG paths are
derived; it is not an outward glow or a presentation blur.

The review offers 0–5 source-pixel insets in half-pixel steps so the appropriate
width can be selected against the unchanged source. These are presentation
review settings, not anatomy or training-load values. The 3-pixel default is a
candidate, not a user-approved final contour. The full-stroke exports in the
parent directory and the earlier narrow comparison remain available.

The two PNGs and `geometry.json` share the source's 1312 × 1199 coordinates.
Both regions retain their unassigned posterior-shoulder status and intended
`rear-delts` target; this trial does not resolve rear/lateral separation or
change any accepted chest/traps/lats mask, app renderer or calculation.

Rebuild with `python scripts/build-shoulder-edge-options.py`; use
`--options-file PATH` to place the review-only slider dataset outside the asset
directory. It uses the existing offline Pillow/numpy/scipy/contourpy toolchain.
