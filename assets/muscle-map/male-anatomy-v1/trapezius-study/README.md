# Trapezius surface study — 2026-10-18

Visually accepted by the user on 2026-10-18; expert anatomical review remains
pending. This study is not anatomical ground truth. The user requested
the next muscle after selecting the clear-edge red presentation. This study
traces the visible trapezius on the unchanged posterior source, independently on
both sides. It extends the initial short geometric proposal toward the visible
lower tip and leaves a central neutral strip over the spinal/aponeurotic region.
It does not divide the muscle into independently scored upper/middle/lower parts.

`annotations.json` stores manually inspected image-coordinate boundary points.
Two PNG masks, two SVGs and `geometry.json` share the original 1312 × 1199 canvas.
Posterior image-left is anatomical left. Both regions retain the existing
`traps` group ID. The source and previous atlas/studies remain unchanged.

Reproduce using offline Pillow, numpy, scipy and contourpy:

```sh
python scripts/trace-muscle-surface-study.py --study trapezius-study
```

The same exporter keeps its original chest/shoulder behavior by default. Its
raster-to-vector drift check verifies conversion only, not anatomical precision.
Review the upper neck attachment, lateral scapular transition and lower tip on
the illustration. Generated fiber detail and pale connective-tissue boundaries
are ambiguous; appearance and contour approval are separate from expert review.

Presentation follows the user's current choice: smooth SVG fill, uniform red
with preserved source texture, no stroke and no additional inner/outer blur.
Keep this separate from production until the complete atlas is reviewed and
its integration is authorized.
