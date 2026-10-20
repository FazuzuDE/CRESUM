"""Assemble the explicitly selected studies for boundary review, without retracing."""
from pathlib import Path
import argparse
import hashlib
import json
import re
import xml.etree.ElementTree as ET
import contourpy
import numpy as np
from PIL import Image

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
base = Path(__file__).resolve().parent.parent/'assets/muscle-map/male-anatomy-v1'
study = base/'combined-review'
manifest = json.loads((study/'manifest.json').read_text())
assert hashlib.sha256((base/'source.png').read_bytes()).hexdigest() == manifest['sourceSha256']
assert re.fullmatch(r'[a-z][a-z0-9-]*', args.output.stem)
ns = '{http://www.w3.org/2000/svg}'
regions, clips, rasters, provenance = [], {}, [], []
for item in manifest['inputs']:
    geometry_file = base/item['geometry']
    geometry = json.loads(geometry_file.read_text())
    assert geometry['canvas'] == manifest['canvas']
    by_id = {r['id']: r for r in geometry['regions']}
    if geometry_file.name == 'selected-geometry.json':
        assert geometry['status'] == 'visually-approved'
        selection = json.loads((geometry_file.parent/'selection.json').read_text())
        assert selection['status'] == 'visually-approved'
        assert set(item['regions']) == set(selection['regions'])
    provenance.append({'file': item['geometry'], 'sha256': hashlib.sha256(geometry_file.read_bytes()).hexdigest()})
    for region_id in item['regions']:
        original = by_id[region_id]
        region = dict(original, visualStatus=item['visualStatus'], sourceGeometry=item['geometry'])
        region.setdefault('transform', '')
        fallback_labels = {'chest': 'Грудная мышца', 'traps': 'Трапециевидная мышца', 'lats': 'Широчайшая мышца спины', 'biceps': 'Бицепс', 'triceps': 'Трицепс'}
        region.setdefault('label', fallback_labels.get(region.get('muscleGroupId'), 'Задняя поверхность плеча'))
        region.setdefault('muscleGroupId', None)
        svg_file = geometry_file.parent/(region_id+item['exportSuffix']+'.svg')
        region['clipId'] = None
        if svg_file.exists():
            svg = ET.fromstring(svg_file.read_text())
            paths = list(svg.iter(ns+'path'))
            assert len(paths) == 1 and paths[0].get('d') == region['path'], svg_file
            assert paths[0].get('transform', '') == region['transform'], svg_file
            masks = list(svg.iter(ns+'mask'))
            assert len(masks) <= 1
            if masks:
                mask = masks[0]
                for element in mask.iter():
                    element.tag = element.tag.removeprefix(ns)
                mask.attrib.pop('id')
                key = hashlib.sha256(ET.tostring(mask)).hexdigest()[:16]
                region['clipId'] = 'combined-clip-'+key
                mask.set('id', region['clipId'])
                clips[region['clipId']] = ET.tostring(mask, encoding='unicode')
        else:
            # The approved shoulder inset has geometry/PNG, no individual SVG.
            assert item['geometry'] == 'rear-shoulder-reference-study/edge-tuning/geometry.json'
            assert geometry['insetSourcePixels'] == 3.5
        png_file = geometry_file.parent/(region_id+item['exportSuffix']+'.png')
        raster = np.asarray(Image.open(png_file).convert('L')) > 127
        assert raster.shape == (1199, 1312)
        rasters.append(raster)
        region['rasterSha256'] = hashlib.sha256(png_file.read_bytes()).hexdigest()
        region['rasterBounds'] = [int(v) for v in (np.where(raster)[1].min(), np.where(raster)[0].min(), np.where(raster)[1].max()+1, np.where(raster)[0].max()+1)]
        regions.append(region)
assert len({r['id'] for r in regions}) == len(regions)
pairs = []
counts = np.zeros((1199, 1312), dtype=np.uint16)
for i, (region, raster) in enumerate(zip(regions, rasters)):
    counts += raster
    for j in range(i):
        if regions[j]['view'] != region['view']:
            continue
        a, b = region['rasterBounds'], regions[j]['rasterBounds']
        x0, y0, x1, y1 = max(a[0], b[0]), max(a[1], b[1]), min(a[2], b[2]), min(a[3], b[3])
        if x0 >= x1 or y0 >= y1:
            continue
        pixels = int(np.count_nonzero(raster[y0:y1, x0:x1] & rasters[j][y0:y1, x0:x1]))
        if pixels:
            pairs.append({'regions': [regions[j]['id'], region['id']], 'view': region['view'], 'quantizedRasterPixels': pixels, 'sameStudy': regions[j]['sourceGeometry'] == region['sourceGeometry']})
overlap = counts > 1
def overlap_path_for(mask):
    contours = contourpy.contour_generator(z=mask.astype(float)).lines(.5)
    return ' '.join('M'+' L'.join(f'{x:g} {y:g}' for x, y in loop)+' Z' for loop in contours)
surface_counts = counts.copy()
for r, raster in zip(regions, rasters):
    if r.get('representation') == 'schematic-projection-beneath-thoracolumbar-fascia':
        surface_counts -= raster
payload = {'regions': regions, 'defsMarkup': ''.join(clips.values()), 'overlapPath': overlap_path_for(overlap),
    'overlapPathWithoutProjections': overlap_path_for(surface_counts > 1)}
(study/'geometry.json').write_text(json.dumps({'status': manifest['status'], 'canvas': manifest['canvas'], **payload}, ensure_ascii=False, indent=2)+'\n')
report = {'status': manifest['status'], 'sourceSha256': manifest['sourceSha256'], 'independentRegions': len(regions), 'frontRegions': sum(r['view'] == 'front' for r in regions), 'backRegions': sum(r['view'] == 'back' for r in regions), 'unassignedRegions': sum(r['muscleGroupId'] is None for r in regions), 'selectedChestRegionsPendingBoundaryApproval': 2, 'projectionRegions': sum(r.get('representation') == 'schematic-projection-beneath-thoracolumbar-fascia' for r in regions), 'overlapPixelsWithoutProjections': int((surface_counts > 1).sum()), 'quantizedRasterOverlapPixels': int(overlap.sum()), 'overlappingPairs': sorted(pairs, key=lambda p: -p['quantizedRasterPixels']), 'measurement': 'union of delivered PNG interiors >127; pair totals can double-count pixels, and SVG smoothing can differ', 'geometryPolicy': 'exact source paths, transforms and per-export clips; no trimming, subtraction or retracing', 'anatomicalValidation': 'pending', 'productionIntegration': False, 'provenance': provenance}
(study/'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
template = (study/'review-template.html').read_text()
assert template.count('"__COMBINED_PAYLOAD__"') == 1
fragment = template.replace('"__COMBINED_PAYLOAD__"', json.dumps(payload, ensure_ascii=False, separators=(',', ':')))
existing = (base/'tibialis-anterior-surface-study/review-template.html').read_text()
source_preview = re.search(r'href="(data:image/webp;base64,[^"]+)"', existing).group(1)
fragment = fragment.replace('__COMBINED_SOURCE_PREVIEW__', source_preview).replace('cresum-combined-review', args.output.stem)
assert len(fragment.encode()) < 1_000_000
args.output.write_text(fragment)
print(json.dumps({k: report[k] for k in ['independentRegions', 'frontRegions', 'backRegions', 'unassignedRegions', 'quantizedRasterOverlapPixels']}))
