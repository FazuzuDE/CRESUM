# Lats contours from the user-returned Gemini image — 2026-10-18

Visually accepted by the user on 2026-10-18; expert anatomical review and
production integration remain pending. `reference.png` is the annotated image supplied
by the user, not a newly generated source. Preserve its provenance in
`registration.json`. The unchanged approved original remains `../source.png`.

The reference has four closed cyan regions. Extract all four independently:

- The two large regions are candidate left/right latissimus dorsi masks using
  the existing `lats` ID. Only these are highlighted in the review.
- The two smaller inferior regions remain independent, unassigned masks with
  `muscleGroupId: null`. They are excluded from the lats preview and calculations.
  Their file names describe position, not a verified anatomical identity.

The returned image is 1024 × 948 rather than the source's 1312 × 1199. Fit local
axis scales and translation using grayscale posterior-thorax detail, excluding
cyan pixels. The source and registered reference were compared visually.
The normalized image correlation is about 0.962: registration is approximate,
not pixel identity. Do not reuse this local transformation for another view.

The cyan line has a broad blurred halo. Color extraction selects its saturated
core, expands each enclosed interior by two reference pixels toward the stroke
center, resamples to the source canvas and exports smooth closed SVG contours.
Line thickness, generative changes and local alignment limit transfer precision.
The subpixel raster/vector deviation in the report measures conversion only,
not registration error or anatomical accuracy.

Reproduce with the existing offline Pillow/numpy/scipy/contourpy toolchain:

```sh
python scripts/extract-muscle-reference.py assets/muscle-map/male-anatomy-v1/lats-reference-study/reference.png --study lats-reference-study
```

The default chest/shoulder extraction profile is retained. The earlier manual
`../lats-study/` remains a comparison candidate. Both left/right masks use the
original source coordinates and preserve fiber texture under a uniform red tint,
with no added presentation blur or outline. No atlas renderer, exercise mapping,
training calculation or saved data is changed. The two inferior regions remain
unassigned and excluded from the accepted lats appearance.
