"""Trace four cyan calf-head interiors, partition touching strokes and register each leg."""
from pathlib import Path
import argparse
import base64
import hashlib
import json
import contourpy
import numpy as np
from PIL import Image
from scipy import ndimage as nd
from scipy.interpolate import splprep, splev
from scipy.optimize import minimize

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--options-file', type=Path, required=True)
args = parser.parse_args()
base = Path(__file__).resolve().parent.parent/'assets/muscle-map/male-anatomy-v1'
study = base/'calves-reference-study'
selection_file = study/'selection.json'
selection = json.loads(selection_file.read_text()) if selection_file.exists() else None
source_file, reference_file = base/'source.png', study/'reference.png'
source_hash = hashlib.sha256(source_file.read_bytes()).hexdigest()
reference_hash = hashlib.sha256(reference_file.read_bytes()).hexdigest()
assert source_hash == '39c66852a6e3ae4a93fac1b0ca29ede1bc17d15520f6d0106d0d135a5d8a7e4a'
assert reference_hash == '19d94033c4e24f1b9b9573eca6facceab60ceeb6d0ae090645d6c608a6c8302f'
source = np.asarray(Image.open(source_file).convert('RGB'), float)
reference = np.asarray(Image.open(reference_file).convert('RGB'), float)
assert source.shape == reference.shape == (1199, 1312, 3)
r, g, b = reference.transpose(2, 0, 1)
roi = np.zeros((1199, 1312), bool); roi[750:980, 780:1100] = True
core = nd.binary_closing((g-r > 25) & (b-r > 20) & (g > 60) & roi)
labels, n = nd.label(nd.binary_fill_holes(core) & ~core)
seeds = []
seed_labels = np.zeros_like(labels)
for i in range(1, n+1):
    y, x = np.where(labels == i)
    if len(x) > 500:
        seeds.append((i, float(x.mean()), len(x)))
        seed_labels[labels == i] = i
assert len(seeds) == 4, 'Expected four independently closed calf-head interiors'
# Cyan strokes touch at the central groove. Include their visible width while
# assigning shared line pixels to the nearest interior, not merging the heads.
_, nearest = nd.distance_transform_edt(seed_labels == 0, return_indices=True)
owners = seed_labels[tuple(nearest)]
visible = (g-r > 15) & (b-r > 12) & (g > 45) & roi
available = (seed_labels > 0) | visible
src_gray, ref_gray = nd.gaussian_filter(source.mean(2), 1), nd.gaussian_filter(reference.mean(2), 1)
chromatic = nd.binary_dilation(reference.max(2)-reference.min(2) > 14, iterations=4)
body_labels, _ = nd.label(~np.all(source > 248, axis=2))
sizes = np.bincount(body_labels[:, 656:].ravel()); sizes[0] = 0
silhouette = nd.binary_fill_holes(body_labels == sizes.argmax())
transforms = {}
report = {'sourceSha256': source_hash, 'referenceSha256': reference_hash,
          'status': 'draft-boundary-and-head-assignment-review',
          'strokePolicy': 'visible-stroke-included-nearest-interior-partition-at-contacts', 'legs': {}, 'regions': []}
for side, x0, x1 in [('left', 790, 905), ('right', 970, 1090)]:
    yy, xx = np.mgrid[775:965:2, x0:x1:2]
    valid = ~chromatic[yy, xx] & (ref_gray[yy, xx] < 240)
    x, y = xx[valid], yy[valid]
    values = ref_gray[y, x]; values = (values-values.mean())/values.std()
    cx, cy = (x0+x1)/2, 870
    def objective(parameters):
        sx, sy, tx, ty = parameters
        sampled = nd.map_coordinates(src_gray, [cy+sy*(y-cy)+ty, cx+sx*(x-cx)+tx], order=1)
        sampled = (sampled-sampled.mean())/sampled.std()
        return np.mean((sampled-values)**2)
    fit = minimize(objective, [1, 1, 0, 0], method='Powell',
                   bounds=[(.97, 1.03), (.97, 1.03), (-8, 8), (-8, 8)], options={'maxiter': 120})
    assert fit.success and fit.fun < .08, f'{side} calf registration needs review: {fit.fun}'
    sx, sy, tx, ty = map(float, fit.x)
    tx += (1-sx)*cx; ty += (1-sy)*cy
    transforms[side] = (sx, sy, tx, ty)
    report['legs'][side] = {'transform': dict(zip(['scaleX', 'scaleY', 'translateX', 'translateY'], [sx, sy, tx, ty])),
                            'normalizedImageCorrelation': float(1-fit.fun/2)}
geometry = {'canvas': [1312, 1199], 'status': report['status'], 'muscleGroupId': 'calves',
            'opacityMode': 'per-muscle-runtime-variable', 'regions': []}
options, rasters = [], []
selected_regions, selected_rasters = [], []
clipped_background = 0
for index, (component, cx, area) in enumerate(sorted(seeds, key=lambda item: item[1])):
    side = 'left' if index < 2 else 'right'
    head = 'lateral' if index in (0, 3) else 'medial'
    name = f'gastrocnemius-{head}-{side}'
    mask = (available & (owners == component)).astype(float)
    sx, sy, tx, ty = transforms[side]
    raster = nd.affine_transform(mask, [[1/sy, 0], [0, 1/sx]], offset=[-ty/sy, -tx/sx], output_shape=(1199, 1312), order=1)
    inside = raster > .5
    signed = nd.distance_transform_edt(inside)-nd.distance_transform_edt(~inside)
    variants = []
    for radius in np.arange(-3, 6.01, .5):
        pixels = nd.gaussian_filter((signed > radius).astype(float), .65)*silhouette
        boundary = max(contourpy.contour_generator(z=pixels, name='serial').lines(.5), key=len)
        spline, _ = splprep(boundary.T, s=len(boundary)*.015, per=True)
        points = np.asarray(splev(np.linspace(0, 1, 257), spline)).T
        path = 'M'+' L'.join(f'{x:.2f} {y:.2f}' for x, y in points[:-1])+' Z'
        variants.append({'radius': float(radius), 'path': path})
        if selection and radius == selection['regions'][name]['inset']:
            state = selection['regions'][name]
            dx = state['shift']*(1 if side == 'left' else -1)
            shifted = nd.shift(pixels, (0, dx), order=1, mode='constant', cval=0)
            clipped_background += int(np.count_nonzero((shifted > .5) & ~silhouette))
            shifted *= silhouette
            selected_rasters.append(shifted)
            selected_regions.append({'id': name, 'side': side, 'view': 'back', 'structureId': f'gastrocnemius-{head}',
                'muscleGroupId': 'calves', 'path': path, 'transform': f'translate({dx} 0)',
                'insetSourcePixels': state['inset'], 'inwardShiftSourcePixels': state['shift'], 'status': selection['status']})
            Image.fromarray(np.round(shifted*255).astype('uint8')).save(study/(name+'-selected.png'))
        if radius == 0:
            rasters.append(pixels)
            region = {'id': name, 'side': side, 'view': 'back', 'structureId': f'gastrocnemius-{head}',
                      'muscleGroupId': 'calves', 'label': 'Медиальная головка' if head == 'medial' else 'Латеральная головка',
                      'path': path, 'status': report['status']}
            geometry['regions'].append(region)
            Image.fromarray(np.round(pixels*255).astype('uint8')).save(study/(name+'.png'))
            (study/(name+'.svg')).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1312 1199"><path id="{name}" d="{path}" fill="currentColor"/></svg>\n')
    options.append({k: v for k, v in region.items() if k != 'path'} | {'variants': variants})
    report['regions'].append({'id': name, 'referenceCenterX': cx, 'interiorPixels': area})
overlap = int(np.count_nonzero((np.asarray(rasters) > .5).sum(0) > 1))
assert overlap == 0, f'Baseline head masks overlap at {overlap} pixels'
report['baselineOverlapPixels'] = overlap
Image.fromarray(np.round(np.max(rasters, axis=0)*255).astype('uint8')).save(study/'calves-union.png')
Image.fromarray((silhouette*255).astype('uint8')).save(study/'source-silhouette.png')
body_url = 'data:image/png;base64,'+base64.b64encode((study/'source-silhouette.png').read_bytes()).decode()
defs = f'<defs><mask id="body" maskUnits="userSpaceOnUse" x="0" y="0" width="1312" height="1199"><image href="{body_url}" width="1312" height="1199"/></mask></defs>'
paths = ''.join(f'<path id="{r["id"]}" d="{r["path"]}"/>' for r in geometry['regions'])
(study/'calves-union.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1312 1199">{defs}<g id="calves" fill="currentColor" mask="url(#body)">{paths}</g></svg>\n')
(study/'geometry.json').write_text(json.dumps(geometry, ensure_ascii=False, indent=2)+'\n')
(study/'registration.json').write_text(json.dumps(report, indent=2)+'\n')
args.options_file.write_text(json.dumps(options, ensure_ascii=False, separators=(',', ':')))
if selection:
    assert len(selected_regions) == 4
    chosen = {k: v for k, v in geometry.items() if k != 'regions'}
    chosen.update({'status': selection['status'], 'regions': selected_regions})
    (study/'selected-geometry.json').write_text(json.dumps(chosen, ensure_ascii=False, indent=2)+'\n')
    selected_paths = []
    for region in selected_regions:
        selected_path = f'<path id="{region["id"]}" d="{region["path"]}" transform="{region["transform"]}"/>'
        selected_paths.append(selected_path)
        (study/(region['id']+'-selected.svg')).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1312 1199">{defs}<g fill="currentColor" mask="url(#body)">{selected_path}</g></svg>\n')
    (study/'calves-selected-union.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1312 1199">{defs}<g id="calves" fill="currentColor" mask="url(#body)">{"".join(selected_paths)}</g></svg>\n')
    stack = np.asarray(selected_rasters)
    Image.fromarray(np.round(np.max(stack, axis=0)*255).astype('uint8')).save(study/'calves-selected-union.png')
    (study/'selection-report.json').write_text(json.dumps({'selectedRegions': 4,
        'interiorOverlapPixels': int(np.count_nonzero((stack > .5).sum(0) > 1)),
        'backgroundPixelsClipped': clipped_background, 'opacityBakedIntoMasks': False}, indent=2)+'\n')
print(json.dumps(report, indent=2))
