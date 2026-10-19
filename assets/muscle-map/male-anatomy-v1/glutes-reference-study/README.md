# Gluteal outline study

Four independent source-aligned review masks: bilateral gluteus maximus and
bilateral candidate visible gluteus medius. The user visually approved the
selected maximus masks on 2026-10-18: left inset 2 px, inward shift 0 px; right
inset 2.5 px, inward shift −1 px. `selection.json`, `selected-geometry.json` and
`*-selected.*` preserve that approval separately from baseline draft exports.
Medius boundaries were rejected as unclear and require refinement; they remain
unassigned and excluded. The screenshot's medius settings are not approved.
No gluteus minimus or hidden muscle boundaries are inferred.

`reference.png` is the generated cyan/orange outline guide. The builder locks its
hash and the unchanged 1312 × 1199 `../source.png` hash in `registration.json`.
It extracts closed interiors including visible stroke width, partitions touching
same-color lines by nearest interior, and registers grayscale source detail per
side. Each side shares a transform between its maximus and medius candidate.
The original source, rather than the annotated guide, remains the display base.

`geometry.json` preserves individual IDs, sides and draft status. The maximus
regions use the existing `glutes` parent. Medius candidates have null group IDs
and are excluded from `glutes-union.*`; their intended parent is recorded without
changing exercise mappings or load calculations. PNG and SVG exports retain the
full source canvas. The union is clipped to the posterior body silhouette.

The review UI offers independent inset (−3 through +6 source px) and inward
horizontal shift (−5 through +5 px) per side in 0.5 px steps. Negative inset
expands; positive inset contracts. Positive inward shift moves anatomical left
rightward and anatomical right leftward in this posterior view. Values start at
zero in the baseline study; selected exports use the approved values above.
Expanded masks may overlap neighbors
and require visual review.

Opacity is a per-muscle runtime variable. No saturation value is baked into
geometry. Fill uses one multiply compositing group without an added outline or
presentation blur; outline mode exists only for review.

Rebuild: `python scripts/build-glutes-reference.py --options-file /tmp/glutes-options.json`.
