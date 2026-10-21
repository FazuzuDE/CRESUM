# Native factual Muscle Map

`runtime-atlas.json` is a deterministic adapter of the committed review geometry,
not a retrace or new scientific mapping. Build with
`node scripts/build-anatomical-muscle-map.cjs`; verify with `npm run anatomy:check`.
CI runs this check through the existing quality command.

The unchanged `source.png` is bundled locally and shared by front/back SVG views.
The adapter preserves 90 non-chest regions and substitutes the four accepted
chest partitions for the two parent chest records, yielding 94 records. It retains
all 36 null group assignments, exact paths/transforms, original three luminance
clips, selected partition paths and source hashes. The original review geometry
is unchanged. Rebuild the adapter after an approved source-geometry update.

The component renders only assigned surface/projection records; unassigned
anatomy stays visible in the base source without a tint. Both chest regions use
the same current parent participation. The diagram does not show measured
activation, regional load fractions, intensity, recovery or biological growth.
The source remains schematic generated artwork; neither asset integrity nor
successful exports proves anatomical validity or native compositing quality.

Group tint uses one opacity per parent/view so overlapping subdivisions do not
sum into a higher signal. Native SVG keeps source and masks in original common
coordinates and scopes definition IDs per rendered map/view. Parent selection
continues to open the existing factual details. All 17 groups remain available
through the detail list; Upper Back, Rear Delts and Adductors currently have no
assigned visible region. Lower-back regions are projections beneath fascia.
