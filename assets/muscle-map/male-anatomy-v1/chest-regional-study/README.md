# Chest regional display pilot

Status: **draft-regional-boundary-review**, not visually or anatomically approved.
The user approved preparing this pilot after the regional-evidence review.
Four regions represent bilateral clavicular and coarse sternocostal display
areas inside the exact existing whole-pectoral exterior paths.

The quadratic dividers are manually chosen artwork-guided approximations. The
generated source does not expose a trustworthy anatomical head boundary.
[Fung et al.](https://pubmed.ncbi.nlm.nih.gov/19291757/) describes distinct
clavicular/sternal architecture;
[Haładaj et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC6466946/) documents
variation. Neither validates these pixel coordinates. Inferior fibers remain
aggregated in the coarse lower display region; no separate abdominal head or
internal sternal subdivisions are asserted.

`annotations.json` owns the three quadratic guide points per side. `geometry.json`
retains the exact parent path plus a complementary clipping path for each region.
Each SVG uses that unchanged exterior. PNGs partition original parent alpha by
pixel-center ownership: zero mutual overlap and exact summed union. Geometry QA
does not establish anatomical accuracy. SVG boundary antialiasing differs from
pixel-center PNG ownership; their edge pixels are not claimed byte-identical.
Production compositing at a shared edge still needs separate review.

The review allows independent preview opacity per region and independent divider
height per anatomical side, ±10 source pixels at 0.5-pixel steps. Positive Y is
down. Front anatomical left is screen right. Both opacity defaults are 65%,
preview-only. Moving a divider changes both complementary clips together; the
exterior never moves. Review controls are local; accept a screenshot before
persisting changed divider settings. Exports represent the saved zero-shift draft.

The original 92-region composition, reference masks and source remain unchanged.
This draft is excluded from its manifest. The `chest` parent ID remains; exercise
mapping is explicitly null. No physiological percentage or coefficient is derived
from region area, preview opacity, EMG or muscle-growth measurements.

Reproduce:

```sh
python scripts/build-chest-regional-review.py --output /workspace/cresum-regional-chest-review.html
node scripts/check-chest-regional-review.cjs /workspace/cresum-regional-chest-review.html
```

The builder uses the repository's existing Python image dependencies. The checker
uses existing jsdom and the runtime's sharp installation. See
[regional evidence and all nine chest-related catalog identities](../../../../docs/MUSCLE_REGIONAL_MAPPING.md).

## Selected appearance accepted — 2026-10-21

The selected schematic appearance is visually approved from
image(20261021-110734).png and explicit yes: anatomical left −5 px, right −4 px.
`selection.json` owns these shifts. The builder now defaults to separate
`-selected.svg/.png`, `selected-geometry.json` and `selection-report.json`, and
restores both review values. It preserves all original baseline exports.
The original draft description above remains historical; selected appearance
acceptance does not establish anatomical validation or exercise coefficients.
Both 65% values remain preview-only. The current 92-region manifest is unchanged.
