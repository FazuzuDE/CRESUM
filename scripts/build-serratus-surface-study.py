"""Build six visible serratus-region candidates with independent side and segment identities."""
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
study = base/'serratus-surface-study'
data = json.loads((study/'annotations.json').read_text())
assert hashlib.sha256((base/'source.png').read_bytes()).hexdigest() == data['sourceSha256']
source = np.asarray(Image.open(base/'source.png').convert('RGB'))
components, _ = nd.label(~np.all(source > 248, axis=2))
sizes = np.bincount(components[:, :656].ravel()); sizes[0] = 0
silhouette = nd.binary_fill_holes(components == sizes.argmax())
geometry = {'status': data['status'], 'revision': data.get('revision', 1), 'canvas': data['canvas'], 'opacityMode': 'per-muscle-runtime-variable', 'regions': []}
options = []
rasters = []
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
        p = np.asarray(splev(np.linspace(0, 1, 129), fitted)).T
        path = 'M'+' L'.join(f'{x:.2f} {y:.2f}' for x, y in p[:-1])+' Z'
        variants.append({'radius': float(radius), 'path': path})
        if radius == 0:
            rasters.append(pixels)
            export = {k: v for k, v in region.items() if k != 'points'}
            export.update({'view': 'front', 'path': path, 'status': data['status']})
            geometry['regions'].append(export)
            Image.fromarray(np.round(pixels*255).astype('uint8')).save(study/(region['id']+'.png'))
            (study/(region['id']+'.svg')).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1312 1199"><path id="{region["id"]}" d="{path}" fill="currentColor"/></svg>\n')
    options.append({k: v for k, v in region.items() if k != 'points'} | {'variants': variants})
assert len(geometry['regions']) == 6
Image.fromarray((silhouette*255).astype('uint8')).save(study/'source-silhouette.png')
Image.fromarray(np.round(np.max(rasters,axis=0)*255).astype('uint8')).save(study/'visible-candidates-union.png')
body_url = 'data:image/png;base64,'+base64.b64encode((study/'source-silhouette.png').read_bytes()).decode()
defs = f'<defs><mask id="body" maskUnits="userSpaceOnUse" x="0" y="0" width="1312" height="1199"><image href="{body_url}" width="1312" height="1199"/></mask></defs>'
paths = ''.join(f'<path id="{r["id"]}" d="{r["path"]}"/>' for r in geometry['regions'])
(study/'visible-candidates-union.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1312 1199">{defs}<g id="serratus-candidates" fill="currentColor" mask="url(#body)">{paths}</g></svg>\n')
geometry['muscleGroupId']=None
(study/'geometry.json').write_text(json.dumps(geometry, ensure_ascii=False, indent=2)+'\n')
(study/'fit-report.json').write_text(json.dumps({'sourceSha256':data['sourceSha256'],
    'status':data['status'],'anatomicalValidation':'pending', 'assignedRegions':0,'independentRegions':6,
    'registration':'identity-manual-source-coordinates',
    'baselineOverlapPixels':int(np.count_nonzero((np.asarray(rasters)>.5).sum(0)>1)),
    'opacityBakedIntoMasks':False},indent=2)+'\n')
args.options_file.write_text(json.dumps(options, ensure_ascii=False, separators=(',', ':')))
print('Built six unassigned visible serratus-region candidates; established masks unchanged.')
