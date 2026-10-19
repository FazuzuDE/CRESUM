# Abdominal surface study — draft

Ten independent visible surface proposals: four rectus abdominis segments per
side and bilateral external oblique. Rectus segments are visual parts of the
same paired anatomical muscle, not eight independent muscles or separate load
estimates. All regions retain the existing `abs` parent and source coordinates.
No exercise mapping, production renderer or scoring coefficient changes.

`annotations.json` stores manually interpreted contours on the unchanged
1312 × 1199 source. The generated character is not an anatomical ground truth.
Boundaries remain drafts; this continuation authorizes preparation, not visual
approval. The navel, central linea alba, pelvic insert and intended tendinous
gaps remain neutral. Internal oblique and transversus abdominis are not drawn
over superficial muscles. Upper serratus slips are outside this proposal.

Anatomical orientation reference:
https://www.ncbi.nlm.nih.gov/books/NBK551649/ — rectus abdominis is divided by
tendinous intersections, and external oblique is superficial to the deeper flat
abdominal muscles. This source does not validate the mannequin's contours.

The preview exposes each segment or oblique pair, separate anatomical sides,
inset and inward shift in 0.5 source-pixel steps. Values start at zero. Positive
inset contracts; negative expands. Positive inward shifts left to negative X
and right to positive X in this front view. The combined preview applies opacity
once so overlapping contours do not form darker bands. Small initial contacts
are reported in `fit-report.json` and remain part of boundary review.

Opacity is a per-muscle runtime variable. No preview percentage is saved as
geometry. The source-body silhouette clips masks, and fill adds no stroke or
presentation blur. Original SVG/PNG canvases are never independently cropped.

Rebuild: `python scripts/build-abs-surface-study.py --options-file /tmp/abs-options.json`.
