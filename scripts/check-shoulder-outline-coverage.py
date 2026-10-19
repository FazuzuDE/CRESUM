"""Check that the transferred shoulder masks cover the reference's cyan line.

Uses observed colored pixels, not the extractor's interior-filling algorithm.
Includes the stroke over the original body, without tinting the white backdrop.
Allows 1.5 source pixels for sampling, antialiasing and SVG conversion.
"""

from pathlib import Path
import json

import numpy as np
from PIL import Image
from scipy import ndimage as nd

study = Path(__file__).resolve().parent.parent / "assets/muscle-map/male-anatomy-v1/rear-shoulder-reference-study"
reference = np.asarray(Image.open(study / "reference.jpeg").convert("RGB"), dtype=float)
r, g, b = reference.transpose(2, 0, 1)
stroke = (g - r > 25) & (b - r > 17) & (g > 45)
components, _ = nd.label(stroke)
sizes = np.bincount(components.ravel())
sizes[0] = 0
main_components = np.argsort(sizes)[-2:]
assert np.all(sizes[main_components] > 100), "Missing visible shoulder outlines"
ys, xs = np.where(np.isin(components, main_components))
source = np.asarray(Image.open(study.parent / "source.png").convert("RGB"))
silhouette = nd.binary_fill_holes(~np.all(source > 248, axis=2))
report = json.loads((study / "registration.json").read_text())
transform = report["transform"]
filled = np.maximum.reduce([
    np.asarray(Image.open(study / (region["id"] + ".png"))) > 127
    for region in report["regions"]
])
coordinates = [
    ys * transform["scaleY"] + transform["translateY"],
    xs * transform["scaleX"] + transform["translateX"],
]
# Check actual opaque tissue rather than isolated near-white antialias speckles
# outside the character. Containment still uses the wider visible silhouette.
over_body = nd.map_coordinates(source.mean(2), coordinates, order=1) < 235
assert not np.any(filled & ~silhouette), "Mask spills outside the original body silhouette"
distance = nd.distance_transform_edt(~filled)
gap = nd.map_coordinates(distance, coordinates, order=1)[over_body]
maximum = float(gap.max())
assert maximum <= 1.5, f"Visible outline lies outside fill by up to {maximum:.2f} source pixels"
print(f"PASS: cyan outline covered within antialias tolerance; maximum gap {maximum:.3f}px")
