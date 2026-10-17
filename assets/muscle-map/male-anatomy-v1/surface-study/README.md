# Chest and shoulder surface study — 2026-10-17

Status: draft for image alignment review. This study does not replace the atlas
or production map. Source image, pose, canvas and anatomy are unchanged.

The user approved a small raster-first study after rejecting the coarse vector
contours. The aim is better correspondence with visible illustration boundaries,
not automatic anatomical segmentation or clinical accuracy.

## What is different

- Independently annotate both visible pectoralis major surfaces as whole regions.
  Do not fabricate a clavicular/sternocostal separator on this illustration.
- Independently annotate the whole visible shoulder surface. These two masks are
  deliberately **unassigned**: the anterior/lateral deltoid separator is not
  established well enough to map them to `front-delts` or `side-delts`.
- Keep anatomical right/left naming. Right appears on the viewer's left in front.
- Preserve source shading by multiplying a red tint within the mask. Outline
  mode is only for boundary review; the tinted view has no outline.

## Files and reproducibility

`annotations.json` contains manually inspected image-coordinate boundary points,
not points inferred by an AI segmentation model. Four grayscale PNGs are the
soft raster masks. Four SVGs and `geometry.json` are derived vector contours.
Every mask uses the original 1312 × 1199 canvas.

Run from the repository root:

```sh
python scripts/trace-muscle-surface-study.py
```

The offline script requires Pillow, numpy, scipy and contourpy; these are asset
preparation tools, not application dependencies. It checks the unchanged source
hash, fills the manual annotations at 4× resolution, softly smooths the raster
boundary, extracts its 50% contour, and fits a closed curve. It rejects vector
drift of 0.8 source pixels or more in either direction. `fit-report.json` records
the measured vector-to-raster deviation. This bound verifies conversion fidelity
only: it does **not** measure anatomical or source-boundary accuracy.

Do not use these whole-shoulder masks to combine or change the application's
17-group taxonomy. Existing atlas masks remain available as the previous draft.
Review upper/lateral pectoral borders and the shoulder insertion carefully:
fiber shading, tendon surfaces and generated anatomy make some edges ambiguous.
Approve source alignment at enlarged and phone scale before promotion.
