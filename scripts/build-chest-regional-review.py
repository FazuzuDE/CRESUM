"""Prepare a review-only pectoral partition while preserving exact parent silhouettes."""
from pathlib import Path
import argparse
import hashlib
import json
import re
import numpy as np
from PIL import Image

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
assert re.fullmatch(r'[a-z][a-z0-9-]*', args.output.stem)
base = Path(__file__).resolve().parent.parent/'assets/muscle-map/male-anatomy-v1'
study = base/'chest-regional-study'
assert hashlib.sha256((base/'source.png').read_bytes()).hexdigest() == '39c66852a6e3ae4a93fac1b0ca29ede1bc17d15520f6d0106d0d135a5d8a7e4a'
annotations = json.loads((study/'annotations.json').read_text())
original = json.loads((base/'reference-study/geometry.json').read_text())
parents, regions, report = [], [], []
for side in ['left', 'right']:
    parent = next(r for r in original['regions'] if r['id'] == f'pectoralis-major-{side}-reference')
    guide = annotations['guides'][side]
    # Quadratic Bezier has monotonic x; sample densely for the raster partition.
    t = np.linspace(0, 1, 4097)[:, None]
    pts = (1-t)**2*np.array(guide[0])+2*(1-t)*t*np.array(guide[1])+t**2*np.array(guide[2])
    heights = np.interp(np.arange(1312)+.5, pts[:, 0], pts[:, 1])
    upper = np.arange(1199)[:, None]+.5 < heights[None, :]
    parent_file = base/'reference-study'/(parent['id']+'.png')
    pixels = np.asarray(Image.open(parent_file).convert('L'))
    divider = f'M{guide[0][0]} {guide[0][1]} Q{guide[1][0]} {guide[1][1]} {guide[2][0]} {guide[2][1]}'
    parents.append({'id': parent['id'], 'side': side, 'path': parent['path'], 'guide': guide, 'dividerPath': divider})
    exports = []
    for region_name, ownership in [('clavicular', upper), ('sternocostal', ~upper)]:
        region_id = f'pectoralis-major-{region_name}-{side}'
        close = (f'L1312 {guide[2][1]} L1312 0 L0 0 L0 {guide[0][1]} Z' if region_name == 'clavicular'
                 else f'L1312 {guide[2][1]} L1312 1199 L0 1199 L0 {guide[0][1]} Z')
        partition_path = divider+' '+close
        region = {'id': region_id, 'side': side, 'view': 'front', 'muscleGroupId': 'chest',
                  'anatomicalMuscleId': 'pectoralis-major', 'regionName': region_name,
                  'parentPath': parent['path'], 'partitionPath': partition_path,
                  'parentRegionId': parent['id'], 'representation': 'schematic-regional-partition',
                  'status': 'draft-regional-boundary-review', 'exerciseMapping': None}
        regions.append(region)
        raster = np.where(ownership, pixels, 0).astype(np.uint8)
        exports.append(raster)
        Image.fromarray(raster).save(study/(region_id+'.png'))
        # Vector exterior is the original exact path, clipped by a complementary region.
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1312 1199">'
               f'<defs><clipPath id="partition" clipPathUnits="userSpaceOnUse"><path d="{partition_path}"/></clipPath></defs>'
               f'<path d="{parent["path"]}" clip-path="url(#partition)" fill="white"/></svg>\n')
        (study/(region_id+'.svg')).write_text(svg)
    assert np.array_equal(exports[0].astype(int)+exports[1], pixels)
    assert not np.any((exports[0] > 0) & (exports[1] > 0))
    report.append({'side': side, 'parentRasterSha256': hashlib.sha256(parent_file.read_bytes()).hexdigest(),
                   'rasterUnionDifferencePixels': 0, 'mutualRasterOverlapPixels': 0,
                   'regionalInteriorPixels': [int((r > 127).sum()) for r in exports]})
payload = {'status': 'draft-regional-boundary-review', 'canvas': [1312, 1199],
           'parents': parents, 'regions': regions, 'sourceSha256': annotations['sourceSha256']}
(study/'geometry.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2)+'\n')
(study/'fit-report.json').write_text(json.dumps({'status': payload['status'], 'sides': report,
    'anatomicalValidation': 'unresolved-artwork-guided-display-approximation',
    'rasterPolicy': 'pixel-center ownership; complementary original alpha with no inferred load fractions',
    'vectorPolicy': 'exact original exterior path; shared quadratic divider in complementary clips',
    'productionIntegration': False, 'combinedReviewIncluded': False}, indent=2)+'\n')
template = (study/'review-template.html').read_text()
source_template = (base/'tibialis-anterior-surface-study/review-template.html').read_text()
source = re.search(r'href="(data:image/webp;base64,[^"]+)"', source_template).group(1)
fragment = template.replace('"__CHEST_REGIONAL_PAYLOAD__"', json.dumps(payload, ensure_ascii=False, separators=(',', ':')))
fragment = fragment.replace('__CHEST_SOURCE__', source).replace('cresum-regional-chest-review', args.output.stem)
assert len(fragment.encode()) < 1_000_000
args.output.write_text(fragment)
print('Built four draft chest regions; exact parent paths and raster union; original 92-region composition unchanged.')
