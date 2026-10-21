# Anconeus visible-surface proposals

Selected appearance is visually approved from 147BE5D0: anatomical L/R inset
−1/0.5, inward 0/0.5, Y 0/−1 source px. Selected SVG/PNG/geometry and review
defaults preserve these states. Baseline remains draft; exact identity and load
group assignment remain provisional/unassigned respectively. Visual acceptance
does not authorize a load taxonomy change or expert anatomical validation.

Two small posterior-elbow patch candidates, independently traced on the
unchanged 1312 × 1199 source. Exact anatomical assignment and boundaries remain
provisional. No hidden capsule, tendons, proximal continuation or internal
compartment subdivision is fabricated. ECRB separation remains deferred where
the source does not make its boundaries clear.

Reference: https://pmc.ncbi.nlm.nih.gov/articles/PMC10395408/ describes anconeus
at the posterior elbow and proximal ulna. This guides orientation rather than
proving identity or copying external artwork into the character.

There is no anconeus ID in the current 17-group load taxonomy. Keep muscleGroupId
null and show orange candidate fill; do not silently map it onto forearms or
triceps, add a group or invent load coefficients. Prior accepted masks remain
unchanged. Anatomical left is screen left on the back view: inward positive is
left +X/right −X; vertical negative is up for both. Controls retain inset −3…+6
and X/Y −10…+10 source px, step 0.5. Large positive insets may fully hide a thin
patch; returning toward zero restores it. Opacity stays runtime-variable.

Rebuild:
`python scripts/build-anconeus-surface-study.py --options-file /tmp/anconeus-options.json`.
Review:
`python scripts/build-anconeus-review.py --options-file /tmp/anconeus-options.json --output /workspace/cresum-anconeus-review.html`.
