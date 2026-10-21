"""Derive inward-feathered alpha masks without changing reference contours.

Offline Pillow/numpy/scipy asset preparation, not application runtime code.
"""

from pathlib import Path
import hashlib
import json
import re

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import distance_transform_edt


directory = Path(__file__).resolve().parent.parent / "assets/muscle-map/male-anatomy-v1"
study = directory / "reference-study"
output = study / "soft"
output.mkdir(exist_ok=True)
expected = "39c66852a6e3ae4a93fac1b0ca29ede1bc17d15520f6d0106d0d135a5d8a7e4a"
assert hashlib.sha256((directory / "source.png").read_bytes()).hexdigest() == expected
geometry = json.loads((study / "geometry.json").read_text())
report = {
    "status": "presentation-study-not-muscle-load-distribution",
    "sourceSha256": expected,
    "featherSourcePixels": 2,
    "method": "4x vector rasterization, inward distance smoothstep, antialias capped by vector coverage",
    "geometrySha256": hashlib.sha256((study / "geometry.json").read_bytes()).hexdigest(),
    "preview": {
        "blend": "multiply", "defaultOpacity": 0.65,
        "gradient": {"center": [0.5, 0.43], "radius": 0.72, "opacityStops": [[0, 1], [0.65, 0.95], [1, 0.60]]},
    },
    "regions": [],
}
for region in geometry["regions"]:
    # Rasterize the smooth SVG, not the thresholded low-resolution reference.
    # Work in a local 4x crop to keep the feather smooth at fractional pixels.
    segments = re.findall(r"[MC][^MCZ]+", region["path"])
    points = []
    for segment in segments:
        values = np.asarray([float(value) for value in re.findall(r"-?\d+(?:\.\d+)?", segment)])
        if segment[0] == "M":
            assert len(values) == 2
            previous = values
            points.append(previous)
        else:
            assert len(values) == 6
            b, c, d = values.reshape(3, 2)
            a = previous
            for u in np.linspace(0, 1, 12, endpoint=False):
                points.append((1-u)**3*a + 3*(1-u)**2*u*b + 3*(1-u)*u*u*c + u**3*d)
            previous = d
    points = np.asarray(points)
    x0, y0 = np.floor(points.min(0) - 2).astype(int)
    x1, y1 = np.ceil(points.max(0) + 2).astype(int)
    scale = 4
    high = Image.new("L", ((x1-x0)*scale, (y1-y0)*scale))
    ImageDraw.Draw(high).polygon([tuple(point) for point in np.round((points-[x0,y0])*scale).astype(int)], fill=255)
    inside = np.asarray(high) > 127
    distance = distance_transform_edt(inside)
    t = np.clip((distance - 0.5) / (report["featherSourcePixels"]*scale), 0, 1)
    high_alpha = np.round((t * t * (3 - 2 * t)) * 255).astype("uint8")
    assert np.all(high_alpha[~inside] == 0)
    assert np.all(high_alpha[distance >= 8.5] == 255)
    size = (x1-x0, y1-y0)
    coverage = np.asarray(high.resize(size, Image.Resampling.LANCZOS))
    alpha = np.asarray(Image.fromarray(high_alpha).resize(size, Image.Resampling.LANCZOS))
    alpha = np.minimum(alpha, coverage)
    assert np.all(alpha[coverage == 0] == 0)
    assert np.any((alpha > 0) & (alpha < 255))
    rgba = np.full((1199, 1312, 4), 255, dtype="uint8")
    rgba[:, :, 3] = 0
    rgba[y0:y1, x0:x1, 3] = alpha
    Image.fromarray(rgba).save(output / (region["id"] + ".png"))
    y, x = np.where(coverage > 0)
    report["regions"].append({
        "id": region["id"],
        "bounds": [int(x.min()+x0), int(y.min()+y0), int(x.max() + 1 - x.min()), int(y.max() + 1 - y.min())],
        "featheredPixels": int(np.count_nonzero((alpha > 0) & (alpha < 255))),
        "nonzeroPixelsOutsideMask": int(np.count_nonzero(alpha[coverage == 0])),
    })
(output / "presentation.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report, indent=2))
