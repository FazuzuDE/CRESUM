# Abdominal surface study — draft

Screenshot settings received on 2026-10-19 are saved in `selection.json` and
separate selected PNG/SVG/geometry exports. Their status is
`user-selected-parameters`, pending review of the combined appearance. Baseline
annotations and zero-adjustment masks remain unchanged. Values below are
inset / inward X / vertical Y in source pixels, anatomical sides:

| Part                | Left            | Right             |
| ------------------- | --------------- | ----------------- |
| Rectus upper        | 0 / −0.5 / +2.5 | 1 / +1.5 / +3     |
| Rectus middle-upper | 0.5 / 0 / +1.5  | 0 / +1.5 / +1     |
| Rectus middle-lower | 1 / +1.5 / 0    | 1 / +3 / 0        |
| Rectus lower        | 0.5 / 0 / −0.5  | 0.5 / +1.5 / −0.5 |
| External oblique    | 1 / −1.5 / +3.5 | 1 / 0 / +3        |

The review builder loads the saved selection by default, retaining independent
editable settings. Positive Y means downward on both sides. No screenshot
opacity percentage is baked into the selection or masks.

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
inset and inward shift in 0.5 source-pixel steps. The review restores the selected values above. Positive
inset contracts; negative expands. Positive inward shifts left to negative X
and right to positive X in this front view. The combined preview applies opacity
once so overlapping contours do not form darker bands. Small initial contacts
are reported in `fit-report.json` and remain part of boundary review.

Opacity is a per-muscle runtime variable. No preview percentage is saved as
geometry. The source-body silhouette clips masks, and fill adds no stroke or
presentation blur. Original SVG/PNG canvases are never independently cropped.

Rebuild: `python scripts/build-abs-surface-study.py --options-file /tmp/abs-options.json`.

The versioned `review-template.html` preserves the review controls and fixed
source preview. Build the conversation fragment with
`python scripts/build-abs-review.py --options-file /tmp/abs-options.json --output /workspace/cresum-abs-position-review.html`.
Each region also has independent left/right vertical translation, −10 through
+10 source px at 0.5 px steps. Negative Y moves up and positive Y moves down on
both sides; the sign never mirrors with anatomical side. `shiftY` starts at zero
and survives segment, side, display-mode and zoom switches in the open review.
It composes with inward X translation without modifying the inset path. Current
baseline geometry remains unchanged and unapproved; selected offsets above are
stored separately pending combined appearance review.

## Combined review continuation — 2026-10-20

All 30 saved inset/X/Y values and all mask exports remain unchanged. Horizontal
review shifts now span ±10 source px, matching Y, at 0.5 px steps. Start with
all ten surfaces for combined appearance review; selecting a part restores its
independent settings. This review does not approve the selected appearance.
Existing selected overlap/clipping counts stay recorded in selection-report.json.
