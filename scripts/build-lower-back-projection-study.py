"""Build a separate, explicitly schematic lumbar projection; preserve surface studies."""
from pathlib import Path
import argparse
import base64
import hashlib
import json
import contourpy
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd
from scipy.interpolate import PchipInterpolator, splprep, splev

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--options-file', type=Path, required=True)
args = parser.parse_args()
base = Path(__file__).resolve().parent.parent/'assets/muscle-map/male-anatomy-v1'
study = base/'lower-back-projection-study'
data = json.loads((study/'annotations.json').read_text())
assert hashlib.sha256((base/'source.png').read_bytes()).hexdigest() == data['sourceSha256']
silhouette = np.asarray(Image.open(base/'hamstrings-surface-study/source-silhouette.png')) > 127
body_url = 'data:image/png;base64,'+base64.b64encode((base/'hamstrings-surface-study/source-silhouette.png').read_bytes()).decode()
defs = f'<defs><mask id="body" maskUnits="userSpaceOnUse" x="0" y="0" width="1312" height="1199"><image href="{body_url}" width="1312" height="1199"/></mask></defs>'
geometry = {k: v for k, v in data.items() if k != 'regions'}
geometry['opacityMode'] = 'per-muscle-runtime-variable'
geometry['regions'] = []
options, rasters = [], []
for region in data['regions']:
    left = np.array(region['edgeGuides']['left'], float)
    right = np.array(region['edgeGuides']['right'], float)
    ys = np.linspace(left[0, 1], left[-1, 1], 400)
    lx = PchipInterpolator(left[:, 1], left[:, 0])(ys)
    rx = PchipInterpolator(right[:, 1], right[:, 0])(ys)
    assert np.all(lx <= rx+1e-8)
    boundary = np.vstack([np.column_stack([lx, ys]), np.column_stack([rx, ys])[::-1]])
    canvas = Image.new('L', (1312*3, 1199*3))
    ImageDraw.Draw(canvas).polygon([tuple(p*3) for p in boundary], fill=255)
    inside = np.asarray(canvas.resize((1312, 1199), Image.Resampling.LANCZOS)) > 127
    signed = nd.gaussian_filter(nd.distance_transform_edt(inside)-nd.distance_transform_edt(~inside), 1.0)
    variants = []
    common = {k: v for k, v in region.items() if k != 'edgeGuides'}
    for radius in np.arange(-3, 6.01, .5):
        pixels = nd.gaussian_filter((signed > radius).astype(float), .65)*silhouette
        loops = contourpy.contour_generator(z=pixels).lines(.5)
        assert len(loops) == 1
        loop = loops[0]
        fitted, _ = splprep(loop.T, s=len(loop)*.04, per=True)
        points = np.asarray(splev(np.linspace(0, 1, 257), fitted)).T
        path = 'M'+' L'.join(f'{x:.2f} {y:.2f}' for x, y in points[:-1])+' Z'
        variants.append({'radius': float(radius), 'path': path})
        if radius == 0:
            geometry['regions'].append(common | {'path': path, 'status': data['status']})
            rasters.append(pixels)
            Image.fromarray(np.round(pixels*255).astype('uint8')).save(study/(region['id']+'.png'))
            (study/(region['id']+'.svg')).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1312 1199">{defs}<g fill="currentColor" mask="url(#body)"><path id="{region["id"]}" d="{path}"/></g></svg>\n')
    options.append(common | {'variants': variants})
stack = np.round(np.array(rasters)*255).astype('uint8')
union = stack.max(0)
assert not np.any(union[:, 936:944] > 127)
assert not np.any(union[510:] > 127)
Image.fromarray(union).save(study/'projection-union.png')
paths = ''.join(f'<path id="{r["id"]}" d="{r["path"]}"/>' for r in geometry['regions'])
(study/'projection-union.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1312 1199">{defs}<g fill="currentColor" mask="url(#body)">{paths}</g></svg>\n')
(study/'geometry.json').write_text(json.dumps(geometry, ensure_ascii=False, indent=2)+'\n')
neighbors = []
for folder, name in [('trapezius-study', 'trapezius-left-visible'), ('trapezius-study', 'trapezius-right-visible'), ('lats-reference-study', 'latissimus-dorsi-left-reference'), ('lats-reference-study', 'latissimus-dorsi-right-reference'), ('glutes-reference-study', 'gluteus-maximus-left-selected'), ('glutes-reference-study', 'gluteus-maximus-right-selected')]:
    raster = np.asarray(Image.open(base/folder/(name+'.png'))) > 127
    neighbors.append({'id': name, 'overlapPixels': int(((union > 127) & raster).sum())})
report = {'status': data['status'], 'representation': data['representation'], 'sourceSha256': data['sourceSha256'], 'independentRegions': 2, 'mutualOverlapPixels': int(((stack > 127).sum(0) > 1).sum()), 'backgroundPixels': int(((union > 127) & ~silhouette).sum()), 'centralNeutralStrip': [936, 944], 'endsAboveY': 510, 'neighborContacts': neighbors, 'anatomicalValidation': 'pending', 'visualApproval': 'pending', 'includedInCombined90': False, 'opacityBakedIntoMasks': False}
(study/'fit-report.json').write_text(json.dumps(report, indent=2)+'\n')
args.options_file.write_text(json.dumps(options, ensure_ascii=False, separators=(',', ':')))
print(json.dumps(report))
