# Soft-edge presentation study — 2026-10-18

User requested slightly softened edges and a textured highlight like the supplied
references, assessing the preceding contour trial as close to visual acceptance.
This is presentation feedback, not an anatomical accuracy measurement.

These four white RGBA PNGs carry transparency in the alpha channel, on the same
1312 × 1199 canvas. They are derived from the smooth SVG paths rasterized at 4×:
smoothstep opacity rises inward over 2 source pixels. Downsampled alpha is capped
by the antialiased vector coverage, and full opacity remains in the interior. The source,
SVG geometry and original reference masks are unchanged. No outward glow or
blur across adjacent muscles is introduced.

Rebuild with `python scripts/build-soft-muscle-masks.py` (offline Pillow, numpy,
scipy). `presentation.json` records the input geometry hash, bounds and alpha checks.
The review can compare the existing fill, soft red tint and soft red opacity
gradient while preserving source texture. An internal gradient is decorative
shading only, not an estimate of within-muscle activation or a new load score.
The approved red palette remains; the supplied multicolor reference does not
automatically establish red/orange/yellow load categories. Shoulder assignment
and anatomical review remain unresolved. No production integration is included.
