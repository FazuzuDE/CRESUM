# Soleus partial visible-surface candidates

Revision 2: four independent distal posterior-leg strip candidates: medial and lateral
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
