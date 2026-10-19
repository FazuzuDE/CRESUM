# Muscle-mask review checkpoint — 2026-10-19

This checkpoint belongs to draft PR #66 (`feature/muscle-mask-atlas`). The
character appearance is approved. Individual mask approvals below concern
visual appearance, not expert anatomical validation or production integration.
Production rendering, exercise mappings, training calculations and stored
workouts remain unchanged.

Next continuation: `abs-surface-study/` contains ten unapproved abdominal
surface regions, with zero initial adjustments: four visual rectus segments
per side plus bilateral external oblique. These remain drafts under `abs`;
they are not part of the accepted-mask selections below.

The later IMG_8224–IMG_8228 parameter set is saved in that study's
`selection.json` and selected exports, including vertical offsets. Its combined
appearance remains under review; the preview starts from those saved values.

All measurements use original-source pixels and anatomical left/right. Insets
are positive for contraction and negative for expansion. Inward shifts are
positive toward the body center: front left maps to negative X, front right to
positive X; posterior left maps to positive X, posterior right to negative X.
Opacity is independently supplied at runtime; screenshot percentages are not
accepted geometry or fixed load values.

| Study / part                  | Visual status                                               | Left inset / inward shift | Right inset / inward shift |
| ----------------------------- | ----------------------------------------------------------- | ------------------------- | -------------------------- |
| Posterior shoulder surface    | Approved appearance; anatomical assignment pending          | 3.5 / 0                   | 3.5 / 0                    |
| Biceps                        | Approved                                                    | 1.5 / 0                   | 1.5 / 3                    |
| Triceps, cyan guide           | Approved                                                    | 1 / 1                     | 1 / 0                      |
| Quadriceps, rectus femoris    | Approved                                                    | 0 / −3                    | −1.5 / 1.5                 |
| Quadriceps, vastus lateralis  | Approved                                                    | −2 / −1                   | −2 / 2                     |
| Quadriceps, vastus medialis   | Approved                                                    | −1.5 / −2.5               | −0.5 / −2                  |
| Hamstrings, biceps femoris    | Parameters selected; combined appearance still under review | −1.5 / 1.5                | −2 / 1                     |
| Hamstrings, semitendinosus    | Parameters selected; combined appearance still under review | −3 / −0.5                 | −3 / −3                    |
| Gastrocnemius, medial head    | Approved                                                    | 2 / 1.5                   | 2 / −0.5                   |
| Gastrocnemius, lateral head   | Approved                                                    | 2 / 0.5                   | 3 / −1.5                   |
| Gluteus maximus               | Approved                                                    | 2 / 0                     | 2.5 / −1                   |
| Gluteus medius, revision 2    | Approved                                                    | 1 / 0                     | 1.5 / −2                   |
| Tibialis anterior, revision 2 | Parameters selected; unassigned to load taxonomy            | 1.5 / −0.5                | 1.5 / 1.5                  |

The biceps builder stores the right-side offset as +3 X in the front view;
this is equivalent to +3 inward in the table. Triceps stores posterior X
translations +1 / 0. Study metadata retains the actual per-study conventions.

Each study contains full-canvas SVG/PNG geometry, provenance or annotations,
and a reproducible Python builder in `scripts/`. Selected exports are distinct
from baseline drafts wherever both exist. Rejected quadriceps, hamstrings and
shin versions remain available for comparison. The first medius proposal stays
unapproved in `glutes-reference-study/`; accepted medius exports are exclusively
in `gluteus-medius-surface-v2/`. Deferred inner hamstring strips remain archived
and excluded. Soleus has no accepted mask in this checkpoint.

Tibialis anterior has no group in the current 17-group taxonomy: both selected
load-group IDs remain null. Posterior shoulder anatomical group assignment is
still unresolved. Keep these limitations explicit rather than mapping either
surface to an unrelated group.

For the existing earlier chest/trapezius/lats work, consult each study and the
dated entries in `docs/DECISIONS.md`. Do not treat the baseline atlas as the
aggregate of all accepted refinements: production assembly remains separate.
