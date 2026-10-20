# Sartorius visible-surface candidates

Two independent oblique anterior-thigh bands, proposed as exposed sartorius.
Trace the visible proximal and longitudinal grooves on the fixed source.
Stop where the distal medial continuation becomes unclear; do not infer full
coverage toward the knee, tendon or attachment. Exact identity on this stylized
character is provisional. Adjacent quadriceps and medial patches are excluded.

Reference: https://www.ncbi.nlm.nih.gov/books/NBK532889/ guides orientation
only; external artwork is not copied. Keep muscleGroupId null and orange
candidate fill. Sartorius does not become a new scored training group or an
automatic quadriceps/adductor mapping. Prior accepted masks remain unchanged.

Front anatomical left is screen right. Inward positive means left −X/right +X;
negative Y is up on both sides. Independent inset −3…+6 and inward/Y −10…+10
controls use 0.5 source px steps. Opacity remains a per-muscle runtime variable.
Fit report records 41 interior pixels of contact with selected quadriceps;
combined thigh boundary review remains pending.

Rebuild: `python scripts/build-sartorius-surface-study.py --options-file /tmp/sartorius-options.json`.
Review: `python scripts/build-sartorius-review.py --options-file /tmp/sartorius-options.json --output /workspace/cresum-sartorius-review.html`.
