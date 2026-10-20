# Sartorius visible-surface candidates

Revision 2 follows enlarged source/outline audits of both sides. Retrace the
proximal origin and longitudinal grooves, remove the distal bulge/early pointed
cutoff and follow the visible narrow medial strips further toward the knee.
The endpoint is a visible-surface review limit, not an anatomical insertion.
Exact identity and the belly/tendon transition on this stylized character
remain provisional; hidden continuation and attachment are excluded. Adjacent
quadriceps and medial patches are excluded. `revision-1/` preserves the first
unapproved annotations and exports byte-identically for comparison.

Reference: https://www.ncbi.nlm.nih.gov/books/NBK532889/ guides orientation
only; external artwork is not copied. Keep muscleGroupId null and orange
candidate fill. Sartorius does not become a new scored training group or an
automatic quadriceps/adductor mapping. Prior accepted masks remain unchanged.

Front anatomical left is screen right. Inward positive means left −X/right +X;
negative Y is up on both sides. Independent inset −3…+6 and inward/Y −10…+10
controls use 0.5 source px steps. Opacity remains a per-muscle runtime variable.
Fit report records 98 interior pixels of contact with selected quadriceps;
combined thigh boundary review remains pending.

Rebuild: `python scripts/build-sartorius-surface-study.py --options-file /tmp/sartorius-options.json`.
Review: `python scripts/build-sartorius-review.py --options-file /tmp/sartorius-options.json --output /workspace/cresum-sartorius-review.html`.
