"""Trace the selected cyan biceps guide and build independent pixel edge options."""
from pathlib import Path
import argparse
import hashlib
import json
import numpy as np
from PIL import Image
from scipy import ndimage as nd
from scipy.optimize import minimize
from scipy.interpolate import splprep, splev
import contourpy

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--options-file', type=Path, required=True)
args = parser.parse_args()
base = Path(__file__).resolve().parent.parent / 'assets/muscle-map/male-anatomy-v1'
study = base / 'biceps-reference-study'
source_file = base / 'source.png'
reference_file = study / 'reference.png'
source_hash = hashlib.sha256(source_file.read_bytes()).hexdigest()
assert source_hash == '39c66852a6e3ae4a93fac1b0ca29ede1bc17d15520f6d0106d0d135a5d8a7e4a'
source = np.asarray(Image.open(source_file).convert('RGB'), dtype=float)
reference = np.asarray(Image.open(reference_file).convert('RGB'), dtype=float)
assert source.shape == reference.shape == (1199, 1312, 3)
r, g, b = reference.transpose(2, 0, 1)
cyan = (g-r > 30) & (b-r > 25) & (g > 80)
cyan[450:] = False
cyan[:, 650:] = False
labels, count = nd.label(nd.binary_fill_holes(nd.binary_closing(cyan, iterations=1)))
components = [i for i in range(1, count+1) if np.count_nonzero(labels == i) > 2000]
assert len(components) == 2, 'Expected exactly two separate closed biceps outlines'
src_gray = nd.gaussian_filter(source.mean(2), 1)
ref_gray = nd.gaussian_filter(reference.mean(2), 1)
chromatic = nd.binary_dilation(reference.max(2)-reference.min(2) > 14, iterations=4)
silhouette_labels, _ = nd.label(~np.all(source > 248, axis=2))
sizes = np.bincount(silhouette_labels[:, :650].ravel())
sizes[0] = 0
silhouette = nd.binary_fill_holes(silhouette_labels == sizes.argmax())
options = [{'radius': float(radius), 'regions': []} for radius in np.arange(-3, 6.01, .5)]
selected_insets = {'left': 1.5, 'right': 1.5}
selected_offsets = {'left': 0, 'right': 3}
selected_regions = []
report = {'sourceSha256': source_hash, 'referenceSha256': hashlib.sha256(reference_file.read_bytes()).hexdigest(),
          'status': 'draft-visual-review', 'boundaryPolicy': 'visible-outer-stroke-with-adjustable-signed-inset', 'regions': []}
for component in components:
    binary = labels == component
    ys, xs = np.where(binary)
    cx, cy = float(xs.mean()), float(ys.mean())
    side = 'right' if cx < 350 else 'left'
    yy, xx = np.mgrid[ys.min()-15:ys.max()+16:2, xs.min()-15:xs.max()+16:2]
    valid = ~chromatic[yy, xx] & (ref_gray[yy, xx] < 240)
    x, y = xx[valid], yy[valid]
    values = ref_gray[y, x]
    values = (values-values.mean())/values.std()
    def objective(parameters):
        sx, sy, tx, ty = parameters
        sampled = nd.map_coordinates(src_gray, [cy+sy*(y-cy)+ty, cx+sx*(x-cx)+tx], order=1)
        sampled = (sampled-sampled.mean())/sampled.std()
        return np.mean((sampled-values)**2)
    fit = minimize(objective, [1, 1, 0, 0], method='Powell',
                   bounds=[(.96, 1.04), (.96, 1.04), (-8, 8), (-8, 8)], options={'maxiter': 120})
    assert fit.success and fit.fun < .08, 'Local arm registration requires review'
    sx, sy, tx, ty = fit.x
    raster = nd.affine_transform(binary.astype(float), [[1/sy, 0], [0, 1/sx]],
                                offset=[cy-(cy+ty)/sy, cx-(cx+tx)/sx], output_shape=(1199, 1312), order=1)
    inside = raster > .5
    signed = nd.distance_transform_edt(inside)-nd.distance_transform_edt(~inside)
    region_id = f'biceps-{side}-reference'
    for option in options:
        mask = nd.gaussian_filter((signed > option['radius']).astype(float), .85)*silhouette
        boundary = max(contourpy.contour_generator(z=mask, name='serial').lines(.5), key=len)
        spline, _ = splprep(boundary.T, s=len(boundary)*.02, per=True)
        points = np.asarray(splev(np.linspace(0, 1, 257), spline)).T
        path = 'M'+' L'.join(f'{x:.2f} {y:.2f}' for x, y in points[:-1])+' Z'
        region = {'id': region_id, 'side': side, 'view': 'front', 'muscleGroupId': 'biceps', 'path': path}
        option['regions'].append(region)
        if option['radius'] == selected_insets[side]:
            dx = selected_offsets[side]
            selected_regions.append(dict(region, transform=f'translate({dx} 0)',
                status='visually-approved'))
            shifted = nd.shift(mask, (0, dx), order=1, mode='constant', cval=0)
            Image.fromarray(np.round(shifted*255).astype('uint8')).save(study/(region_id+'.png'))
            (study/(region_id+'.svg')).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1312 1199"><path id="{region_id}" d="{path}" transform="translate({dx} 0)" fill="currentColor"/></svg>\n')
    report['regions'].append({'id': region_id, 'side': side, 'referenceCenter': [cx, cy],
                              'localTransform': dict(zip(['scaleX', 'scaleY', 'translateX', 'translateY'], map(float, fit.x))),
                              'normalizedImageCorrelation': float(1-fit.fun/2)})
(study/'registration.json').write_text(json.dumps(report, indent=2)+'\n')
(study/'geometry.json').write_text(json.dumps({'status': 'visually-approved', 'canvas': [1312, 1199],
    'insetSourcePixelsBySide': selected_insets, 'horizontalOffsetSourcePixelsBySide': selected_offsets,
    'regions': selected_regions}, indent=2)+'\n')
args.options_file.write_text(json.dumps(options, separators=(',', ':')))
print(json.dumps(report, indent=2))
