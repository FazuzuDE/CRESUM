# Gluteal side-cap candidates, revision 2

Selected revision-2 masks visually approved on 2026-10-18: left inset 1 source
px, inward shift 0 px; right inset 1.5 px, inward shift −2 px. `selection.json`
and `*-selected.*` preserve this approval under the existing `glutes` parent.
Selected geometry supersedes candidate status for those two exports only.
The screenshot's 85% saturation is not retained as geometry.

Two independent manually traced visible surface candidates on the unchanged
1312 × 1199 source. `annotations.json` preserves per-side source coordinates;
the builder derives PNG/SVG masks and inset variants. The superior contour now
follows the visible top of the gluteal side cap rather than extending onto the
lower back. Each side is traced independently.

The intended structure is gluteus medius, but anatomical assignment and contours
were originally unapproved. Baseline group IDs remain null; the accepted selected
exports use `glutes` without changing production exercise mappings. The source
illustration alone does not establish anatomical accuracy.
The previous rejected study and approved gluteus maximus selection are preserved.

Review starts at zero inset and shift for this new revision, with independent
0.5 px controls per side. The earlier rejected candidate's 0.5 px inset / 4.5 px
shift is not carried forward. Source shading remains visible; runtime load
controls opacity independently from geometry.

Rebuild: `python scripts/build-gluteus-medius-study.py --options-file /tmp/medius-options.json`.
