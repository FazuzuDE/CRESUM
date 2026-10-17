"""Offline image-coordinate annotation -> raster masks -> fitted SVG study.

Requires Python with Pillow, numpy, scipy and contourpy. No app dependency.
Does not infer anatomy, mutate source.png or replace the 17-group atlas.
"""

from pathlib import Path
import hashlib
import json

import contourpy
import numpy as np
from PIL import Image, ImageDraw
from scipy.interpolate import splprep, splev
from scipy.ndimage import gaussian_filter
from scipy.spatial import cKDTree


root = Path(__file__).resolve().parent.parent
directory = root / "assets/muscle-map/male-anatomy-v1"
study = directory / "surface-study"
data = json.loads((study / "annotations.json").read_text())
assert hashlib.sha256((directory / "source.png").read_bytes()).hexdigest() == data["sourceSha256"]
width, height = data["canvas"]
scale = 4
output = []
report = []
for region in data["regions"]:
    # The manual source-image annotation is filled first. Raster remains the
    # measured reference for vector fitting, not an SVG rendered back to PNG.
    mask = Image.new("L", (width * scale, height * scale))
    ImageDraw.Draw(mask).polygon(
        [(round(x * scale), round(y * scale)) for x, y in region["points"]], fill=255
    )
    pixels = gaussian_filter(np.asarray(mask, dtype=np.float32) / 255, sigma=2)
    raster = Image.fromarray(np.round(pixels * 255).astype(np.uint8))
    raster.resize((width, height), Image.Resampling.LANCZOS).save(study / (region["id"] + ".png"))
    loops = contourpy.contour_generator(z=pixels, name="serial").lines(0.5)
    assert len(loops) == 1, "Expected one connected surface"
    boundary = loops[0] / scale
    # Fit a periodic spline with a small smoothing budget, then check geometric
    # deviation in BOTH directions. This metric says nothing about anatomy.
    fit, _ = splprep(boundary.T, s=len(boundary) * 0.008, per=True)
    t = np.linspace(0, 1, 129)
    p = np.asarray(splev(t, fit)).T
    v = np.asarray(splev(t, fit, der=1)).T / 128
    commands = [f"M{p[0, 0]:.3f} {p[0, 1]:.3f}"]
    dense = []
    for i in range(128):
        a, b = p[i], p[i + 1]
        c, d = a + v[i] / 3, b - v[i + 1] / 3
        commands.append(f"C{c[0]:.3f} {c[1]:.3f} {d[0]:.3f} {d[1]:.3f} {b[0]:.3f} {b[1]:.3f}")
        for u in np.linspace(0, 1, 12, endpoint=False):
            dense.append((1-u)**3*a + 3*(1-u)**2*u*c + 3*(1-u)*u*u*d + u**3*b)
    dense = np.asarray(dense)
    deviation = max(cKDTree(boundary).query(dense)[0].max(), cKDTree(dense).query(boundary)[0].max())
    assert deviation < 0.8, f"Vector drift: {region['id']} {deviation}"
    svg_path = " ".join(commands) + " Z"
    output.append({k: value for k, value in region.items() if k != "points"} | {"path": svg_path})
    report.append({"id": region["id"], "maxRasterBoundaryDeviationPx": round(float(deviation), 3)})
    (study / (region["id"] + ".svg")).write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}">'
        f'<path id="{region["id"]}" fill="currentColor" d="{svg_path}"/></svg>\n'
    )
(study / "geometry.json").write_text(json.dumps({"canvas": data["canvas"], "regions": output}, ensure_ascii=False, indent=2) + "\n")
(study / "fit-report.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report, indent=2))
