"""Build review-only inset variants from the current shoulder masks."""

from pathlib import Path
import argparse
import json
import numpy as np
from PIL import Image
from scipy import ndimage as nd
from scipy.interpolate import splprep, splev
import contourpy

base = Path(__file__).resolve().parent.parent / 'assets/muscle-map/male-anatomy-v1'
study = base / 'rear-shoulder-reference-study'
output = study / 'edge-tuning'
output.mkdir(exist_ok=True)
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--options-file', type=Path, default=output / 'options.json')
arguments = parser.parse_args()
original = json.loads((study / 'geometry.json').read_text())['regions']
options = []
selected_inset = 3.5
for radius in np.arange(0, 5.01, 0.5):
    regions = []
    for region in original:
        pixels = np.asarray(Image.open(study / (region['id'] + '.png')))
        inside = nd.distance_transform_edt(pixels > 127)
        # Smooth the pixel-grid contour before exporting a sharp vector edge;
        # this is subpixel contour antialiasing, not a presentation blur/halo.
        mask = nd.gaussian_filter((inside > radius).astype(float), sigma=0.85)
        loops = contourpy.contour_generator(z=mask, name='serial').lines(0.5)
        boundary = max(loops, key=len)
        fit, _ = splprep(boundary.T, s=len(boundary) * 0.02, per=True)
        points = np.asarray(splev(np.linspace(0, 1, 513), fit)).T
        path = 'M' + ' L'.join(f'{x:.2f} {y:.2f}' for x, y in points[:-1]) + ' Z'
        regions.append(dict(region, path=path))
        if radius == selected_inset:
            Image.fromarray((mask * 255).astype('uint8')).save(output / (region['id'] + '.png'))
    options.append({'radius': float(radius), 'regions': regions})
    if radius == selected_inset:
        (output / 'geometry.json').write_text(json.dumps({
            'status': 'visually-approved-anatomical-assignment-pending', 'canvas': [1312, 1199],
            'insetSourcePixels': selected_inset, 'regions': regions,
        }, ensure_ascii=False, indent=2) + '\n')
arguments.options_file.write_text(
    json.dumps(options, ensure_ascii=False, separators=(',', ':')))
print(f'Built 11 local edge-width options; approved inset {selected_inset} source pixels.')
