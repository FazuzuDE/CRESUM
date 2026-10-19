# Triceps: full-body guide versus cyan outline

The user requested using IMG_8203.jpeg to prepare and compare triceps masks with
the assistant's preceding cyan guide. Both original references are preserved.
The unchanged parent `source.png` remains the only rendering base.

`trace-anchors.json` is an explicit manual interpretation of the red guide's
visible outer envelopes. Its intersecting internal divisions and black leader
lines are not automatically segmented or assigned to individual muscle heads.
The cyan comparison is extracted from its two closed colored contours. Both
variants started as drafts and are not anatomically validated. The cyan variant
was subsequently visually approved with the parameters below.

Per-side local grayscale registration excludes colored and dark annotation
pixels. The full guide's left fit has approximately 0.994 normalized correlation;
its right fit is lower, approximately 0.881. That right transfer remains
approximate and needs visual correction, not acceptance based on the metric.
The cyan reference fits at approximately 0.994 on both sides. Hashes, transforms
and explicit quality flags are in `registration.json`.

PNG/SVG exports and `geometry.json` share 1312 × 1199 source coordinates. Initial
insets and offsets are 0 px. Review includes independent insets −3…+6 px and
inward horizontal offsets 0…10 px in half-pixel steps. Rear-view anatomical left
is screen left; inward is positive X for left and negative X for right. Each
variant retains its own values during comparison. Existing approved masks and
production renderer/data remain unchanged.

Rebuild with `python scripts/build-triceps-reference.py --options-file PATH`.

## Approved selection — 2026-10-18

The user's screenshot selects **Моя бирюзовая обводка** (cyan), with both
insets at 1 source pixel, left inward offset 1 pixel (positive X), right offset 0. The screenshot's 65% opacity is preview-only and is not approved geometry.
`geometry.json` and `triceps-{left,right}-approved` PNG/SVG
exports record this exact selection. The original zero-inset comparison files
remain available. The full-body red guide remains unapproved. This is visual
acceptance only; production integration remains separate.

Opacity is a per-muscle runtime variable supplied by the training-load display.
Mask alpha describes shape/edge coverage only; it does not bake in load or
presentation intensity. The load-to-opacity mapping is separate from this study.
