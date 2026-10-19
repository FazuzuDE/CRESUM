"""Build the extensor-digitorum review fragment from its versioned UI and geometry options."""
from pathlib import Path
import argparse
import hashlib
import base64
import json
import math
import re

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--options-file', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
parser.add_argument('--selection-file', type=Path)
args = parser.parse_args()
base = Path(__file__).resolve().parent.parent/'assets/muscle-map/male-anatomy-v1'
assert hashlib.sha256((base/'source.png').read_bytes()).hexdigest() == '39c66852a6e3ae4a93fac1b0ca29ede1bc17d15520f6d0106d0d135a5d8a7e4a'
regions = json.loads(args.options_file.read_text())
assert len(regions) == 2 and len({r['id'] for r in regions}) == 2
template = (base/'extensor-digitorum-surface-study/review-template.html').read_text()
body_token = '__POSTERIOR_BODY_MASK_URL__'
assert template.count(body_token) == 1
body_url = 'data:image/png;base64,'+base64.b64encode((base/'extensor-digitorum-surface-study/source-silhouette.png').read_bytes()).decode()
template = template.replace(body_token, body_url)
token = '"__EXTENSOR_DIGITORUM_GEOMETRY_JSON__"'
assert template.count(token) == 1
fragment = template.replace(token, json.dumps(regions, ensure_ascii=False, separators=(',', ':')))
selection_file = args.selection_file or base/'extensor-digitorum-surface-study/selection.json'
selection = json.loads(selection_file.read_text())['regions'] if selection_file.exists() else {}
settings = {}
for region in regions:
    state = {'inset': 0, 'shift': 0, 'shiftY': 0} | selection.get(region['id'], {})
    for field, low, high in [('inset', -3, 6), ('shift', -5, 5), ('shiftY', -10, 10)]:
        value = state[field]
        assert isinstance(value, (int, float)) and math.isfinite(value)
        assert low <= value <= high and value*2 == round(value*2)
    settings[region['id']] = state
token = '"__EXTENSOR_DIGITORUM_SETTINGS_JSON__"'
assert fragment.count(token) == 1
fragment = fragment.replace(token, json.dumps(settings, separators=(',', ':')))
assert re.fullmatch(r'[a-z][a-z0-9-]*', args.output.stem)
fragment = fragment.replace('cresum-extensor-digitorum-review', args.output.stem)
assert len(fragment.encode()) < 1_000_000
args.output.write_text(fragment)
print('Built extensor-digitorum review with independent inset, inward and vertical controls.')
