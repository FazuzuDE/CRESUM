# Quadriceps: six independently editable surface drafts

The user approved preparing three visible structures per anatomical side on
2026-10-18: rectus femoris, vastus lateralis and vastus medialis. The existing
atlas already held six draft paths. This study refines those source-landmark
proposals directly against the unchanged 1312 × 1199 source, rather than
pretending the generated cyan outline contains internal segmentation.

`annotations.json` contains editable source-coordinate landmarks for all six
surfaces. PNG/SVG/geometry exports are independent, with a common canvas and
parent `muscleGroupId: quadriceps`. `quadriceps-union` combines all six. Baseline
masks have zero overlapping interior pixels. This verifies geometry, not anatomy.
Masks remain drafts awaiting visual and anatomical boundary review. The deep
vastus intermedius receives no invented superficial mask.

Keep one existing quadriceps load group and current exercise mappings. Structural
IDs are visual components, not six new training groups or per-head load scores.
Opacity remains a runtime variable. Review's opacity slider is presentation only.
No production renderer, historical records or approved masks are replaced.

Review isolates any structure and side, with independent per-region insets
−3…+6 px and horizontal inward shifts −5…+5 px, in 0.5-source-pixel steps.
Front anatomical left is screen right; positive inward shift is negative X on
left and positive X on right. Edited regions may need overlap review again.

Rebuild with `python scripts/build-quadriceps-surface-study.py --options-file PATH`.

## Revision 2 — source contours retraced

The user rejected the first study boundaries as inaccurate. Previous annotations
and geometry are retained as `previous-annotations.json` and
`previous-geometry.json`, explicitly not approved. Revision 2 follows separately
enlarged source thighs, brings the rectus/vasti boundaries closer to the visible
grooves, ends rectus before its pale distal tendon and excludes the proximal
outer hip band. Both sides are independently annotated. Current boundaries
remain review drafts; zero overlap is not evidence of anatomical correctness.

## User-selected per-region parameters

`selection.json` records all six inset/inward-shift pairs read from IMG_8206,
IMG_8207 and IMG_8208. These are user-selected values for review of the combined
result. The user visually accepted that combined result on 2026-10-18;
anatomical expert validation remains separate. `selected-geometry.json` and
`*-selected` PNG/SVG exports contain the chosen paths and horizontal transforms.
Negative inward shifts move outward. The front-view anatomical-left transform
negates this signed shift; anatomical right uses it directly.

The enlarged selected regions overlap in 585 interior pixels. Compose the
quadriceps union before applying runtime intensity once, preventing darker
overlap stripes. Keep the six regions individually editable. Mask opacity
contains edge coverage only; source silhouette clipping prevents background tint.
