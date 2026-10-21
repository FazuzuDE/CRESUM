# Soleus partial visible-surface candidates

Revision 3: four independent distal posterior-leg strip candidates: medial and lateral
visible windows on each side. These names describe exposed windows of one
soleus muscle, not separate anatomical heads. Identity, precise boundaries and
muscle/aponeurosis transition remain provisional on this stylized source.
Exclude accepted gastrocnemius, central Achilles tendon, retinacula, foot and
hidden coverage. No full-muscle coverage is claimed.

Orientation reference only; no artwork copied:
https://www.ncbi.nlm.nih.gov/books/NBK537340/

Draft boundary/structure review, null load-group IDs and orange candidate fill.
Back anatomical left is screen left; inward left +X/right −X, positive Y down.
Independent per-window/per-side inset and X/Y controls use 0.5 source-pixel steps
and ±10 px shifts; opacity is runtime-variable. Baseline candidates have zero
mutual interior overlap and zero overlap with accepted gastrocnemius.

Build: `python scripts/build-soleus-surface-study.py --options-file /tmp/soleus-options.json`.
Review: `python scripts/build-soleus-review.py --options-file /tmp/soleus-options.json --output /workspace/cresum-soleus-review.html`.
Check: `node scripts/check-soleus-review.cjs /workspace/cresum-soleus-review.html`.

No taxonomy, exercise mappings, load coefficients or production changes.

## Revision-2 boundary review

Upper shoulders and longitudinal borders are retraced against enlarged source
grooves. Medial edges stay inside the source silhouette; lower tapers are
shortened conservatively near the uncertain muscle/aponeurosis transition.
Revision 1 is archived byte-for-byte in `revision-1/`; neither revision is
visually approved. The fit report records baseline background clipping and
accepted-gastrocnemius contact. Prior accepted masks stay unchanged.

## Revision-3 source-groove retrace

The earlier narrow patches started midway down the visible bands. Revision 3
traces the exposed longitudinal windows between source grooves, with independent
left/right edge guides and monotone cubic interpolation. The generated `points`
outline is retained for compatibility; `edgeGuides` are authoritative for v3.
Lateral windows extend upward alongside the gastrocnemius margins, while medial
windows follow the exposed lower-side bands. Exact distal muscle/aponeurosis
transition remains provisional.

In y=890…1045, the soleus-only clip is recovered row by row for each calf from
the dark source edge. This prevents the ground-shadow connection from filling
inter-leg background. It does not edit any earlier study's silhouette or mask.
Revision 2 is archived byte-for-byte in `revision-2/`; baseline v3 stays draft. Selected approval is recorded below.

## Selected appearance — 2026-10-20

User approved image(9).png lateral and image(10).png medial settings.
Anatomical L/R inset / inward / Y in source pixels:

| Window  | Left         | Right          |
| ------- | ------------ | -------------- |
| Lateral | −1 / −1 / −5 | +0.5 / −3 / −6 |
| Medial  | −1 / +3 / −1 | −1 / +0.5 / +1 |

Separate selected exports and all twelve restored review defaults retain these
values. Baseline v3, archives v1/v2 and earlier masks remain unchanged. The
selected set has no mutual interior overlap, 52 background pixels clipped and
42 interior pixels of contact with accepted gastrocnemius, recorded for combined
review. Exact identity and combined calf boundaries remain provisional; null
group IDs and runtime opacity are retained. The 80% screenshot preview is not
a mask property or load value.
