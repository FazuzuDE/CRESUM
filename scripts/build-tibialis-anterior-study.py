"""Build independent anterior-shin surface drafts without a guessed load-group mapping."""
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
study = base/'tibialis-anterior-surface-study'
selection_file = study/'selection.json'
selection = json.loads(selection_file.read_text()) if selection_file.exists() else None
data = json.loads((study/'annotations.json').read_text())
assert hashlib.sha256((base/'source.png').read_bytes()).hexdigest() == data['sourceSha256']
source = np.asarray(Image.open(base/'source.png').convert('RGB'))
components, _ = nd.label(~np.all(source > 248, axis=2))
sizes = np.bincount(components[:, :656].ravel()); sizes[0] = 0
silhouette = nd.binary_fill_holes(components == sizes.argmax())
geometry = {'status': data['status'], 'revision': data.get('revision', 1), 'canvas': data['canvas'], 'opacityMode': 'per-muscle-runtime-variable', 'regions': []}
options = []
rasters = []
selected_regions, selected_rasters = [], []
clipped_background = 0
for region in data['regions']:
    name, side = region['id'], region['side']
    points = np.asarray(region['points'], float)
    spline, _ = splprep(points.T, s=0, per=True)
    boundary = np.asarray(splev(np.linspace(0, 1, 800), spline)).T
    canvas = Image.new('L', (1312*3, 1199*3))
    ImageDraw.Draw(canvas).polygon([tuple(p*3) for p in boundary], fill=255)
    raster = np.asarray(canvas.resize((1312, 1199), Image.Resampling.LANCZOS), float)/255
    inside = raster > .5
    signed = nd.distance_transform_edt(inside)-nd.distance_transform_edt(~inside)
    signed = nd.gaussian_filter(signed, data.get('signedDistanceSmoothing', 0))
    variants = []
    for radius in np.arange(-3, 6.01, .5):
        pixels = nd.gaussian_filter((signed > radius).astype(float), .65)*silhouette
        loop = max(contourpy.contour_generator(z=pixels, name='serial').lines(.5), key=len)
        fitted, _ = splprep(loop.T, s=len(loop)*data.get('contourSplineSmoothing', .015), per=True)
        p = np.asarray(splev(np.linspace(0, 1, 257), fitted)).T
        path = 'M'+' L'.join(f'{x:.2f} {y:.2f}' for x, y in p[:-1])+' Z'
        variants.append({'radius': float(radius), 'path': path})
        if selection and name in selection['regions'] and radius == selection['regions'][name]['inset']:
            state = selection['regions'][name]
            dx = state['shift']*(-1 if side == 'left' else 1)
            dy = state.get('shiftY', 0)
            shifted = nd.shift(pixels, (dy, dx), order=1, mode='constant', cval=0)
            clipped_background += int(np.count_nonzero((shifted > .5) & ~silhouette))
            shifted *= silhouette
            selected_rasters.append(shifted)
            selected_regions.append({'id': name, 'side': side, 'view': 'front', 'structureId': 'tibialis-anterior',
                'muscleGroupId': None, 'path': path, 'transform': f'translate({dx} {dy})',
                'insetSourcePixels': state['inset'], 'inwardShiftSourcePixels': state['shift'], 'verticalShiftSourcePixels': dy, 'status': selection['status']})
            Image.fromarray(np.round(shifted*255).astype('uint8')).save(study/(name+'-selected.png'))
        if radius == 0:
            rasters.append(pixels)
            export = {k: v for k, v in region.items() if k != 'points'}
            export.update({'view': 'front', 'path': path, 'status': data['status']})
            geometry['regions'].append(export)
            Image.fromarray(np.round(pixels*255).astype('uint8')).save(study/(region['id']+'.png'))
            (study/(region['id']+'.svg')).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1312 1199"><path id="{region["id"]}" d="{path}" fill="currentColor"/></svg>\n')
    options.append({k: v for k, v in region.items() if k != 'points'} | {'variants': variants})
assert len(geometry['regions']) == 2
assert all(r['muscleGroupId'] is None for r in geometry['regions'])
Image.fromarray((silhouette*255).astype('uint8')).save(study/'source-silhouette.png')
(study/'geometry.json').write_text(json.dumps(geometry, ensure_ascii=False, indent=2)+'\n')
(study/'fit-report.json').write_text(json.dumps({'sourceSha256': data['sourceSha256'],
    'registration': 'identity-manual-source-coordinates', 'anatomicalValidation': 'pending',
    'status': data['status'], 'assignedRegions': 0, 'candidateRegions': 2,
    'revision': data.get('revision', 1), 'tendonAndToeExtensorsExcluded': True}, indent=2)+'\n')
args.options_file.write_text(json.dumps(options, ensure_ascii=False, separators=(',', ':')))
print('Built two independent anterior-shin draft masks; load mapping remains unassigned.')

body_url = 'data:image/png;base64,'+base64.b64encode((study/'source-silhouette.png').read_bytes()).decode()
defs = f'<defs><mask id="body" maskUnits="userSpaceOnUse" x="0" y="0" width="1312" height="1199"><image href="{body_url}" width="1312" height="1199"/></mask></defs>'
if selection:
    assert len(selected_regions) == 2
    chosen = {k: v for k, v in geometry.items() if k != 'regions'}
    chosen.update({'status': selection['status'], 'regions': selected_regions})
    (study/'selected-geometry.json').write_text(json.dumps(chosen, ensure_ascii=False, indent=2)+'\n')
    selected_paths = []
    for region in selected_regions:
        selected_path = f'<path id="{region["id"]}" d="{region["path"]}" transform="{region["transform"]}"/>'
        selected_paths.append(selected_path)
        (study/(region['id']+'-selected.svg')).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1312 1199">{defs}<g fill="currentColor" mask="url(#body)">{selected_path}</g></svg>\n')
    (study/'tibialis-selected-union.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1312 1199">{defs}<g id="tibialis-anterior" fill="currentColor" mask="url(#body)">{"".join(selected_paths)}</g></svg>\n')
    stack = np.asarray(selected_rasters)
    Image.fromarray(np.round(np.max(stack, axis=0)*255).astype('uint8')).save(study/'tibialis-selected-union.png')
    (study/'selection-report.json').write_text(json.dumps({'selectedRegions': 2,
        'interiorOverlapPixels': int(np.count_nonzero((stack > .5).sum(0) > 1)),
        'backgroundPixelsClipped': clipped_background, 'opacityBakedIntoMasks': False}, indent=2)+'\n')
