# Brachioradialis visible-surface review

Revision 2 retraces each side independently at 6× source scale, lowers the
proximal belly below pale elbow tissue, follows the neighboring-muscle groove
more closely and shortens the distal tip before the long tendon. Reduced
conversion smoothing preserves these local boundaries. Superseded revision 1
is archived in revision-1/ and is not approved. Revision 2 remains a candidate.

Two independent front-view candidates on the unchanged source. Trace only the
visible radial forearm belly; uncertain proximal continuation, distal tendon
and neighboring wrist flexors/extensors are excluded. Anatomy and boundaries
remain under review. The generated source cannot establish precise identity.

The existing forearms parent ID is retained as an intended taxonomy identity;
the masks do not change exercise mappings, training coefficients or production
rendering. These candidates are one muscle, not the entire forearm group.

Each side has inset (−3…+6), inward X (−5…+5) and vertical Y (−10…+10)
in source pixels, step 0.5. Inset positive contracts; inward positive maps
front left to negative X and right to positive X; negative Y is up on both.
Defaults restore selection.json when present, otherwise zero pending review.
Opacity is a runtime input applied once to the common group, retaining source
shading with multiply. All SVG/PNG exports retain the 1312 × 1199 canvas.

Reference: https://www.ncbi.nlm.nih.gov/books/NBK526110/ describes the
anterolateral fusiform belly and narrowing distal tendon; this is orientation
guidance, not a transfer of source geometry or expert validation of this trace.

Rebuild masks:
`python scripts/build-brachioradialis-surface-study.py --options-file /tmp/brachioradialis-options.json`.
Build review:
`python scripts/build-brachioradialis-review.py --options-file /tmp/brachioradialis-options.json --output /workspace/cresum-brachioradialis-review.html`.

Revision-2 screenshot checkpoint (FAEC7F8B): anatomical L/R inset 0.5/−1,
inward −2/−2 and Y +5/+5.5 source px. The front X transforms are +2/−2,
with both masks moved down. Separate selected SVG/PNG/geometry record these
values, status user-selected-parameters. Combined appearance and assignment
remain under review. Baseline and archived contours are preserved.
