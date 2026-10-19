"""Extract four teal outlines from a fixed user reference, then register
them to the unchanged CRESUM source. Offline Pillow/numpy/scipy/contourpy only.
This is color extraction and image alignment, NOT anatomical segmentation.
"""

from pathlib import Path
import argparse
import hashlib
import json

import contourpy
import numpy as np
from PIL import Image
from scipy import ndimage as nd
from scipy.interpolate import splprep, splev
from scipy.optimize import minimize
from scipy.spatial import cKDTree

directory = Path(__file__).resolve().parent.parent / "assets/muscle-map/male-anatomy-v1"
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("reference", type=Path, help="Original annotated PNG supplied by the user")
parser.add_argument("--study", choices=["reference-study", "lats-reference-study"], default="reference-study")
arguments = parser.parse_args()
reference_file = arguments.reference
is_lats = arguments.study == "lats-reference-study"
output = directory / arguments.study
output.mkdir(exist_ok=True)
source_hash = "39c66852a6e3ae4a93fac1b0ca29ede1bc17d15520f6d0106d0d135a5d8a7e4a"
reference_hash = (
    "56650403b73acb74549de2b7db94c97c29a2e246127093fab94e64356088cd83" if is_lats else
    "191896696983f32fbfbda7e2b4f7ad5be61f01651d955f50f9d62ba53aa4db7b"
)
for file, expected in [(directory / "source.png", source_hash), (reference_file, reference_hash)]:
    assert hashlib.sha256(file.read_bytes()).hexdigest() == expected, "Input changed; review extraction settings"
reference = np.asarray(Image.open(reference_file).convert("RGB"), dtype=float)
source = np.asarray(Image.open(directory / "source.png").convert("RGB"), dtype=float)
assert reference.shape == ((948, 1024, 3) if is_lats else (1024, 574, 3))
assert source.shape == (1199, 1312, 3)
r, g, b = reference.transpose(2, 0, 1)
# The lats reference has a broad blurred cyan halo. Select the saturated line
# core so that halo pixels do not erode the enclosed muscle surfaces.
teal = ((g - r > 60) & (b - r > 40) & (g > 45)) if is_lats else ((g - r > 15) & (b - r > 10) & (g > 45))
roi = np.zeros(teal.shape, bool)
if is_lats:
    roi[210:390, 620:850] = True  # Posterior outline block only.
else:
    roi[190:320, 150:455] = True  # Main figure only; ignore inset and labels.
line = nd.binary_closing(teal & roi, iterations=1)
label, count = nd.label(nd.binary_fill_holes(line) & ~line)
regions = []
for i in range(1, count + 1):
    y, x = np.where(label == i)
    if len(x) > (200 if is_lats else 1000):
        regions.append((i, float(x.mean()), int(y.min()), len(x)))
assert len(regions) == 4, "Expected exactly four closed colored-outline interiors"

# Exclude chromatic lines (including dashed red marks) and antialiased edges.
# Fit scale/translation against grayscale thorax pixels, not outline locations.
ref_gray = nd.gaussian_filter(reference.mean(2), 1)
src_gray = nd.gaussian_filter(source.mean(2), 1)
yy, xx = np.mgrid[245:345:2, 665:805:2] if is_lats else np.mgrid[200:330:2, 166:443:2]
chromatic = nd.binary_dilation(reference.max(2) - reference.min(2) > 14, iterations=4)
valid = ~chromatic[yy, xx] & (ref_gray[yy, xx] < 243)
x, y = xx[valid], yy[valid]
values = ref_gray[y, x]
values = (values - values.mean()) / values.std()


def objective(parameters):
    sx, sy, tx, ty = parameters
    sampled = nd.map_coordinates(src_gray, [sy * y + ty, sx * x + tx], order=1)
    sampled = (sampled - sampled.mean()) / sampled.std()
    return np.mean((sampled - values) ** 2)


result = minimize(
    objective, [1.28, 1.265, 0, 0] if is_lats else [1.13, 1.16, 25, -35], method="Powell",
    bounds=([(1.20, 1.35), (1.20, 1.34), (-40, 40), (-40, 40)] if is_lats else
            [(1.02, 1.30), (1.02, 1.30), (-20, 60), (-70, 5)]),
    options={"xtol": 0.00001, "ftol": 0.000001, "maxiter": 150},
)
# The resized/regenerated lats input was inspected beside the original after
# fitting. Its local normalized correlation is about 0.962, not pixel identity.
# Retain a separate, explicit tolerance and quality flag for this input.
assert result.success and result.fun < (0.10 if is_lats else 0.03), "Thorax alignment failed; inspect source/reference"
sx, sy, tx, ty = result.x
report = {
    "status": "draft-reference-contours-not-anatomical-ground-truth",
    "sourceSha256": source_hash, "referenceSha256": reference_hash,
    "referenceSize": [1024, 948] if is_lats else [574, 1024], "sourceSize": [1312, 1199],
    "transform": dict(zip(["scaleX", "scaleY", "translateX", "translateY"], map(float, result.x))),
    "normalizedImageResidual": float(result.fun),
    "registrationScope": "grayscale posterior thorax only; not validated for whole-body transfer" if is_lats else "grayscale thorax only; not validated for whole-body transfer",
    "regions": [],
}
if is_lats:
    report.update({
        "registrationQuality": "approximate-local-fit-visually-reviewed-not-pixel-identical",
        "normalizedImageCorrelation": float(1 - result.fun / 2),
        "lineExtraction": {"greenMinusRedMin": 60, "blueMinusRedMin": 40, "interiorExpansionPx": 2},
        "selection": "two large regions assigned to lats; two lower regions preserved unassigned and excluded",
    })
geometry = {"canvas": [1312, 1199], "regions": []}
masks = []
for i, cx, top, area in regions:
    if is_lats:
        kind = "latissimus-dorsi" if area > 2000 else "unassigned-lower-region"
        side = "left" if cx < 735 else "right"
        group_id = "lats" if kind == "latissimus-dorsi" else None
        assignment = "lats" if group_id else "unassigned-excluded-from-lats"
    else:
        kind = "deltoid" if top < 210 else "pectoralis-major"
        side = "right" if cx < 304 else "left"
        group_id = "chest" if kind == "pectoralis-major" else None
        assignment = "chest" if group_id else "unassigned-whole-visible-shoulder"
    name = f"{kind}-{side}-reference"
    # Expand toward the stroke center: one reference pixel for chest, two for
    # the lats input's thicker saturated cyan core.
    mask = nd.binary_dilation(label == i, iterations=2 if is_lats else 1).astype(float)
    raster = nd.affine_transform(
        mask, matrix=[[1 / sy, 0], [0, 1 / sx]], offset=[-ty / sy, -tx / sx],
        output_shape=(1199, 1312), order=1,
    )
    raster = nd.gaussian_filter(raster, sigma=0.9)
    masks.append(raster > 0.5)
    Image.fromarray(np.round(raster * 255).astype("uint8")).save(output / (name + ".png"))
    loops = contourpy.contour_generator(z=raster, name="serial").lines(0.5)
    assert len(loops) == 1
    boundary = loops[0]
    fit, _ = splprep(boundary.T, s=len(boundary) * 0.02, per=True)
    t = np.linspace(0, 1, 129)
    points = np.asarray(splev(t, fit)).T
    tangents = np.asarray(splev(t, fit, der=1)).T / 128
    commands = [f"M{points[0, 0]:.3f} {points[0, 1]:.3f}"]
    dense = []
    for j in range(128):
        a, d = points[j], points[j + 1]
        b, c = a + tangents[j] / 3, d - tangents[j + 1] / 3
        commands.append(f"C{b[0]:.3f} {b[1]:.3f} {c[0]:.3f} {c[1]:.3f} {d[0]:.3f} {d[1]:.3f}")
        for u in np.linspace(0, 1, 12, endpoint=False):
            dense.append((1-u)**3*a + 3*(1-u)**2*u*b + 3*(1-u)*u*u*c + u**3*d)
    dense = np.asarray(dense)
    deviation = max(cKDTree(boundary).query(dense)[0].max(), cKDTree(dense).query(boundary)[0].max())
    assert deviation < 0.8, "Vector conversion drift"
    path = " ".join(commands) + " Z"
    geometry["regions"].append({
        "id": name, "side": side, "view": "back" if is_lats else "front", "kind": kind,
        "muscleGroupId": group_id,
        "assignment": assignment,
        "path": path,
    })
    report["regions"].append({"id": name, "referenceInteriorPixels": area, "maxVectorRasterDeviationPx": round(float(deviation), 3)})
    (output / (name + ".svg")).write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1312 1199"><path id="{name}" fill="currentColor" d="{path}"/></svg>\n'
    )
assert len({region["id"] for region in geometry["regions"]}) == 4
for i in range(4):
    assert not np.any(masks[i] & np.all(source > 248, axis=2)), "Background spill"
    for j in range(i):
        assert not np.any(masks[i] & masks[j]), "Overlapping extracted masks"
(output / "geometry.json").write_text(json.dumps(geometry, ensure_ascii=False, indent=2) + "\n")
(output / "registration.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report, indent=2))
