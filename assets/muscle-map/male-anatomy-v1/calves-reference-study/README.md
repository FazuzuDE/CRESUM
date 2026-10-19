# Calves — four gastrocnemius-head reference drafts

The user requested converting the assistant's four cyan outlines into separate
editable masks. `reference.png` preserves the generated guide. Render against
the unchanged parent `source.png`, not the guide's regenerated pixels.

Four closed cyan interiors are extracted. Their colored strokes touch near
the inter-head grooves, so include observed stroke pixels but partition those
pixels by nearest interior rather than merging each calf into one mask. No
new anatomical dividing line is inferred. Medial/lateral proposals follow
the interiors' anatomical positions and remain pending boundary/head review.

Local grayscale fitting is shared by both heads of each leg, preserving their
relative geometry. Correlations are approximately 0.997 left and 0.996 right.
`registration.json` records source/reference hashes, per-leg transforms and
stroke policy. These metrics verify local alignment, not anatomy.

Four PNG/SVG regions and `geometry.json` retain the common 1312 × 1199 canvas,
independent anatomical side and `structureId`, under the existing `calves`
catalog group. Baseline masks have zero interior overlaps. `calves-union` combines
the four surfaces. Soleus, Achilles tendon and deep/uncertain surfaces are not
added to this study. Do not invent a soleus mask beneath gastrocnemius.

Review offers −3…+6 source-pixel insets and −5…+5 inward shifts at 0.5 px steps,
separately for every head and side. Back anatomical left is screen left; positive
inward shift is +X for left and −X for right. Opacity is runtime-controlled;
the review percentage is not a fixed mask property. No existing approved mask,
production renderer, exercise mapping or stored training data is changed.

Rebuild with `python scripts/build-calves-reference.py --options-file PATH`.

## User-selected parameters

`selection.json` records IMG_8214/IMG_8215 settings, in anatomical left/right
order: medial insets 2 / 2 px and inward shifts +1.5 / −0.5 px; lateral insets
2 / 3 px and inward shifts +0.5 / −1.5 px. Back-view right negates the inward
shift to obtain source X translation. Selected PNG/SVG/geometry and union exports
preserve these four independent selections. The user accepted the combined
appearance on 2026-10-18; anatomical expert validation remains separate.
Preview saturation is omitted. Clip only background spill to the source silhouette
and apply runtime intensity to the composed group once.
