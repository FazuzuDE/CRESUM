# Extracted reference contours — 2026-10-18

Status: separate draft for comparison, not promoted to production or accepted
anatomical geometry. The user asked to try the provided annotated image despite
its generative origin. We extract the actual colored pixel contours rather than
claiming the original tool had SVG paths.

Input: `470A9FF3-18E1-4AD4-BB5C-33A8B200664B.png`, 574 × 1024, SHA-256
`191896696983f32fbfbda7e2b4f7ad5be61f01651d955f50f9d62ba53aa4db7b`.
The original uploaded reference is retained with the conversation; supply it as
the script argument. It is not a replacement for this atlas's source image.

## Method

1. Extract teal pixels only from the main figure's chest/shoulder rectangle,
   excluding the enlarged inset, text and dashed red deltoid subdivision.
2. Close small stroke gaps and identify four enclosed surfaces. Expand their
   interiors one reference pixel to approximate the colored stroke's center.
3. Align grayscale thorax detail to the unchanged 1312 × 1199 source, excluding
   chromatic annotation pixels. Record independent X/Y scales and translation.
   This transform is reviewed for the thorax only; do not reuse it for the rest
   of this generated figure.
4. Transfer masks, smooth by 0.9 source pixels, extract closed raster boundaries
   and fit SVG curves with conversion drift below 0.8 source pixels.

Four PNG masks, four SVGs, `geometry.json` and `registration.json` share the
original atlas coordinates. The two shoulder surfaces stay **unassigned** to
front/side-deltoid groups. No internal muscle split or new score is introduced.
The previous `surface-study/` and all 17 atlas masks remain unchanged.

## Reproduce

```sh
python scripts/extract-muscle-reference.py /path/to/470A9FF3-18E1-4AD4-BB5C-33A8B200664B.png
```

Requires offline Pillow, numpy, scipy and contourpy, with no app dependencies.
The script checks both input hashes, four unique regions, image-alignment
convergence, vector/raster deviation, background spill and pairwise overlap.
Conversion and registration metrics are not anatomical accuracy scores.

The thick low-resolution reference stroke limits boundary precision. Smoothing
does not recover missing detail. The reference may contain generated anatomical
changes; transferred outlines still need visual approval on the unchanged
original, particularly at upper pectoral borders and shoulder insertions.
