"""Register manually traced full-guide envelopes and extracted cyan triceps contours."""
from pathlib import Path
import argparse
import hashlib
import json
import contourpy
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd
from scipy.interpolate import splprep, splev
from scipy.optimize import minimize

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--options-file', type=Path, required=True)
args = parser.parse_args()
base = Path(__file__).resolve().parent.parent/'assets/muscle-map/male-anatomy-v1'
study = base/'triceps-reference-study'
source_file = base/'source.png'
assert hashlib.sha256(source_file.read_bytes()).hexdigest() == '39c66852a6e3ae4a93fac1b0ca29ede1bc17d15520f6d0106d0d135a5d8a7e4a'
source = np.asarray(Image.open(source_file).convert('RGB'), float)
src_gray = nd.gaussian_filter(source.mean(2), 1)
labels, _ = nd.label(~np.all(source > 248, axis=2))
sizes = np.bincount(labels[:, 656:].ravel()); sizes[0] = 0
silhouette = nd.binary_fill_holes(labels == sizes.argmax())
anchors = json.loads((study/'trace-anchors.json').read_text())
datasets = {}
approved_regions = []
approved_insets = {'left': 1, 'right': 1}
approved_offsets = {'left': 1, 'right': 0}
report = {'status': 'draft-visual-review', 'canvas': [1312, 1199],
          'sourceSha256': hashlib.sha256(source_file.read_bytes()).hexdigest(), 'variants': {}}
for variant, filename in [('full', 'reference.jpeg'), ('cyan', 'cyan-reference.png')]:
    reference_file = study/filename
    expected_hash = ('01cf02ee5af719e0d167fd4c592029f066c7d4a854cfb49247e0d82a8b16aef7' if variant == 'full'
                     else '298b3286e2d433811712b982d21e3606ddcf4f014dc9556796001913180c1b64')
    assert hashlib.sha256(reference_file.read_bytes()).hexdigest() == expected_hash, 'Reference changed; review tracing settings'
    reference = np.asarray(Image.open(reference_file).convert('RGB'), float)
    h, w = reference.shape[:2]
    ref_gray = nd.gaussian_filter(reference.mean(2), 1)
    chromatic = nd.binary_dilation(reference.max(2)-reference.min(2) > 12, iterations=3)
    variant_report = {'sha256': hashlib.sha256(reference_file.read_bytes()).hexdigest(), 'referenceSize': [w, h], 'regions': []}
    datasets[variant] = [{'radius': float(r), 'regions': []} for r in np.arange(-3, 6.01, .5)]
    cyan_masks = {}
    if variant == 'cyan':
        r, g, b = reference.transpose(2, 0, 1)
        color = (g-r > 30) & (b-r > 25) & (g > 80)
        color[:200] = False; color[450:] = False; color[:, :700] = False
        components, n = nd.label(nd.binary_fill_holes(nd.binary_closing(color, iterations=1)))
        for i in range(1, n+1):
            ys, xs = np.where(components == i)
            if len(xs) > 2000:
                cyan_masks['left' if xs.mean() < 940 else 'right'] = components == i
        assert set(cyan_masks) == {'left', 'right'}
    for region in anchors['regions']:
        side = region['side']
        if variant == 'full':
            points = np.asarray(region['points'], float)
            spline, _ = splprep(points.T, s=0, per=True)
            outline = np.asarray(splev(np.linspace(0, 1, 600), spline)).T
            canvas = Image.new('L', (w, h))
            ImageDraw.Draw(canvas).polygon([tuple(p) for p in outline], fill=255)
            mask = np.asarray(canvas) > 127
        else:
            mask = cyan_masks[side]
        ys, xs = np.where(mask)
        yy, xx = np.mgrid[max(0, ys.min()-12):min(h, ys.max()+13):2, max(0, xs.min()-12):min(w, xs.max()+13):2]
        dark_marks = nd.binary_dilation(ref_gray < 95, iterations=3)
        valid = ~chromatic[yy, xx] & ~dark_marks[yy, xx] & (ref_gray[yy, xx] < 240)
        x, y = xx[valid], yy[valid]
        values = ref_gray[y, x]; values = (values-values.mean())/values.std()
        initial = [1312/w, 1199/h, 0, 0]
        cx, cy = float(xs.mean()), float(ys.mean())
        def objective(parameters):
            sx, sy, tx, ty = parameters
            sampled = nd.map_coordinates(src_gray, [initial[1]*cy+sy*(y-cy)+ty, initial[0]*cx+sx*(x-cx)+tx], order=1)
            sampled = (sampled-sampled.mean())/sampled.std()
            return np.mean((sampled-values)**2)
        fit = minimize(objective, initial, method='Powell',
            bounds=[(initial[0]-.025, initial[0]+.025), (initial[1]-.025, initial[1]+.025), (-12, 12), (-12, 12)],
            options={'maxiter': 150, 'xtol': 1e-5, 'ftol': 1e-6})
        # The full-body guide changes local arm texture and contains leader lines.
        # Keep its approximate transfer distinct from the near-identical cyan input.
        tolerance = .30 if variant == 'full' else .08
        assert fit.success and fit.fun < tolerance, f'{variant} {side}: registration requires review ({fit.fun})'
        sx, sy, tx, ty = fit.x
        tx += (initial[0]-sx)*cx
        ty += (initial[1]-sy)*cy
        raster = nd.affine_transform(mask.astype(float), [[1/sy, 0], [0, 1/sx]], offset=[-ty/sy, -tx/sx], output_shape=(1199, 1312), order=1)
        inside = raster > .5
        signed = nd.distance_transform_edt(inside)-nd.distance_transform_edt(~inside)
        for option in datasets[variant]:
            selected = nd.gaussian_filter((signed > option['radius']).astype(float), .85)*silhouette
            boundary = max(contourpy.contour_generator(z=selected, name='serial').lines(.5), key=len)
            spline, _ = splprep(boundary.T, s=len(boundary)*.02, per=True)
            points = np.asarray(splev(np.linspace(0, 1, 257), spline)).T
            path = 'M'+' L'.join(f'{x:.2f} {y:.2f}' for x, y in points[:-1])+' Z'
            name = f'triceps-{side}-{variant}'
            option['regions'].append({'id': name, 'side': side, 'view': 'back', 'muscleGroupId': 'triceps', 'path': path})
            if option['radius'] == 0:
                Image.fromarray(np.round(selected*255).astype('uint8')).save(study/(name+'.png'))
                (study/(name+'.svg')).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1312 1199"><path id="{name}" d="{path}" fill="currentColor"/></svg>\n')
            if variant == 'cyan' and option['radius'] == approved_insets[side]:
                dx = approved_offsets[side]
                approved_name = f'triceps-{side}-approved'
                approved_regions.append({'id': approved_name, 'side': side, 'view': 'back',
                    'muscleGroupId': 'triceps', 'path': path, 'transform': f'translate({dx} 0)',
                    'status': 'visually-approved'})
                shifted = nd.shift(selected, (0, dx), order=1, mode='constant', cval=0)
                Image.fromarray(np.round(shifted*255).astype('uint8')).save(study/(approved_name+'.png'))
                (study/(approved_name+'.svg')).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1312 1199"><path id="{approved_name}" d="{path}" transform="translate({dx} 0)" fill="currentColor"/></svg>\n')
        variant_report['regions'].append({'side': side, 'transform': dict(zip(['scaleX', 'scaleY', 'translateX', 'translateY'], map(float, [sx, sy, tx, ty]))), 'normalizedImageCorrelation': float(1-fit.fun/2), 'quality': 'approximate-manual-envelope-review-required' if variant == 'full' else 'local-grayscale-fit'})
    report['variants'][variant] = variant_report
(study/'registration.json').write_text(json.dumps(report, indent=2)+'\n')
(study/'geometry.json').write_text(json.dumps({'status': 'visually-approved', 'canvas': [1312, 1199],
    'variant': 'cyan', 'insetSourcePixelsBySide': approved_insets,
    'horizontalOffsetSourcePixelsBySide': approved_offsets,
    'opacityMode': 'per-muscle-runtime-variable',
    'regions': approved_regions}, indent=2)+'\n')
args.options_file.write_text(json.dumps(datasets, separators=(',', ':')))
print(json.dumps(report, indent=2))
