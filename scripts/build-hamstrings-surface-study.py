"""Build independent posterior-thigh drafts; unresolved strips stay outside load group."""
from pathlib import Path
import argparse
import hashlib
import json
import base64
import contourpy
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd
from scipy.interpolate import splprep, splev

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--options-file', type=Path, required=True)
args = parser.parse_args()
base = Path(__file__).resolve().parent.parent/'assets/muscle-map/male-anatomy-v1'
study = base/'hamstrings-surface-study'
data = json.loads((study/'annotations.json').read_text())
selection_file = study/'selection.json'
selection = json.loads(selection_file.read_text()) if selection_file.exists() else None
assert hashlib.sha256((base/'source.png').read_bytes()).hexdigest() == data['sourceSha256']
source = np.asarray(Image.open(base/'source.png').convert('RGB'))
components, _ = nd.label(~np.all(source > 248, axis=2))
sizes = np.bincount(components[:, 656:].ravel()); sizes[0] = 0
silhouette = nd.binary_fill_holes(components == sizes.argmax())
geometry = {'status': data['status'], 'revision': data.get('revision', 1), 'canvas': data['canvas'], 'opacityMode': 'per-muscle-runtime-variable', 'regions': []}
options = []
rasters = []
selected_regions = []
selected_rasters = []
outside_pixels = 0
for region in data['regions']:
    points = np.asarray(region['points'], float)
    spline, _ = splprep(points.T, s=0, per=True)
    boundary = np.asarray(splev(np.linspace(0, 1, 800), spline)).T
    canvas = Image.new('L', (1312*3, 1199*3))
    ImageDraw.Draw(canvas).polygon([tuple(p*3) for p in boundary], fill=255)
    raster = np.asarray(canvas.resize((1312, 1199), Image.Resampling.LANCZOS), float)/255
    inside = raster > .5
    signed = nd.distance_transform_edt(inside)-nd.distance_transform_edt(~inside)
    variants = []
    for radius in np.arange(-3, 6.01, .5):
        pixels = nd.gaussian_filter((signed > radius).astype(float), .65)*silhouette
        loop = max(contourpy.contour_generator(z=pixels, name='serial').lines(.5), key=len)
        fitted, _ = splprep(loop.T, s=len(loop)*.015, per=True)
        p = np.asarray(splev(np.linspace(0, 1, 257), fitted)).T
        path = 'M'+' L'.join(f'{x:.2f} {y:.2f}' for x, y in p[:-1])+' Z'
        variants.append({'radius': float(radius), 'path': path})
        if selection and region['id'] in selection['regions'] and radius == selection['regions'][region['id']]['inset']:
            state = selection['regions'][region['id']]
            dx = state['shift']*(1 if region['side'] == 'left' else -1)
            dy = state.get('shiftY', 0)
            shifted = nd.shift(pixels, (dy, dx), order=1, mode='constant', cval=0)
            outside_pixels += int(np.count_nonzero((shifted > .5) & ~silhouette))
            shifted *= silhouette
            selected_rasters.append(shifted)
            chosen = {k: v for k, v in region.items() if k != 'points'}
            chosen.update({'view': 'back', 'path': path, 'transform': f'translate({dx} {dy})',
                'insetSourcePixels': state['inset'], 'inwardShiftSourcePixels': state['shift'], 'verticalShiftSourcePixels': dy, 'status': selection['status']})
            selected_regions.append(chosen)
            Image.fromarray(np.round(shifted*255).astype('uint8')).save(study/(region['id']+'-selected.png'))
        if radius == 0:
            rasters.append(pixels)
            export = {k: v for k, v in region.items() if k != 'points'}
            export.update({'view': 'back', 'path': path, 'status': data['status']})
            geometry['regions'].append(export)
            Image.fromarray(np.round(pixels*255).astype('uint8')).save(study/(region['id']+'.png'))
            (study/(region['id']+'.svg')).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1312 1199"><path id="{region["id"]}" d="{path}" fill="currentColor"/></svg>\n')
    options.append({k: v for k, v in region.items() if k != 'points'} | {'variants': variants})
assigned = [i for i, r in enumerate(data['regions']) if r['muscleGroupId'] == 'hamstrings']
assert len(assigned) == 4 and len(data['regions']) == 6
overlap = int(np.count_nonzero((np.asarray(rasters) > .5).sum(0) > 1))
assert overlap == 0, f'Baseline surfaces overlap at {overlap} pixels'
union = np.max(np.asarray(rasters)[assigned], axis=0)
Image.fromarray(np.round(union*255).astype('uint8')).save(study/'hamstrings-union.png')
Image.fromarray((silhouette*255).astype('uint8')).save(study/'source-silhouette.png')
silhouette_url = 'data:image/png;base64,'+base64.b64encode((study/'source-silhouette.png').read_bytes()).decode()
defs = f'<defs><mask id="body" maskUnits="userSpaceOnUse" x="0" y="0" width="1312" height="1199"><image href="{silhouette_url}" width="1312" height="1199"/></mask></defs>'
paths = ''.join(f'<path id="{r["id"]}" d="{r["path"]}"/>' for r in geometry['regions'] if r['muscleGroupId'] == 'hamstrings')
(study/'hamstrings-union.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1312 1199">{defs}<g id="hamstrings" fill="currentColor" mask="url(#body)">{paths}</g></svg>\n')
(study/'geometry.json').write_text(json.dumps(geometry, ensure_ascii=False, indent=2)+'\n')
(study/'fit-report.json').write_text(json.dumps({'sourceSha256': data['sourceSha256'], 'independentRegions': 6,
    'revision': data.get('revision', 1), 'assignedDraftRegions': 4, 'unassignedExcludedRegions': 2, 'defaultOverlapPixels': overlap,
    'registration': 'identity-manual-source-coordinates', 'anatomicalValidation': 'pending'}, indent=2)+'\n')
args.options_file.write_text(json.dumps(options, ensure_ascii=False, separators=(',', ':')))
if selection:
    assert len(selected_regions) == 4 and all(r['muscleGroupId'] == 'hamstrings' for r in selected_regions)
    selected_geometry = {k: v for k, v in geometry.items() if k != 'regions'}
    selected_geometry.update({'status': selection['status'], 'regions': selected_regions, 'excludedRegions': selection['excludedRegions']})
    (study/'selected-geometry.json').write_text(json.dumps(selected_geometry, ensure_ascii=False, indent=2)+'\n')
    selected_paths = []
    for region in selected_regions:
        path = f'<path id="{region["id"]}" d="{region["path"]}" transform="{region["transform"]}"/>'
        selected_paths.append(path)
        (study/(region['id']+'-selected.svg')).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1312 1199">{defs}<g fill="currentColor" mask="url(#body)">{path}</g></svg>\n')
    (study/'hamstrings-selected-union.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1312 1199">{defs}<g id="hamstrings" fill="currentColor" mask="url(#body)">{"".join(selected_paths)}</g></svg>\n')
    stack = np.asarray(selected_rasters)
    Image.fromarray(np.round(np.max(stack, axis=0)*255).astype('uint8')).save(study/'hamstrings-selected-union.png')
    report = {'selectedRegions': 4, 'excludedMedialRegions': 2, 'interiorOverlapPixels': int(np.count_nonzero((stack > .5).sum(0) > 1)),
              'backgroundPixelsClipped': outside_pixels, 'opacityBakedIntoMasks': False}
    (study/'selection-report.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps(report))
print('Built four hamstring draft masks and two unassigned comparison strips; default overlap:', overlap)
