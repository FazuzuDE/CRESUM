"""Build the abdominal review fragment from its versioned UI and geometry options."""
from pathlib import Path
import argparse
import hashlib
import json

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--options-file', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
base = Path(__file__).resolve().parent.parent/'assets/muscle-map/male-anatomy-v1'
assert hashlib.sha256((base/'source.png').read_bytes()).hexdigest() == '39c66852a6e3ae4a93fac1b0ca29ede1bc17d15520f6d0106d0d135a5d8a7e4a'
regions = json.loads(args.options_file.read_text())
assert len(regions) == 10 and len({r['id'] for r in regions}) == 10
template = (base/'abs-surface-study/review-template.html').read_text()
token = '"__ABS_GEOMETRY_JSON__"'
assert template.count(token) == 1
fragment = template.replace(token, json.dumps(regions, ensure_ascii=False, separators=(',', ':')))
assert len(fragment.encode()) < 1_000_000
args.output.write_text(fragment)
print('Built abdominal review with independent inset, inward and vertical controls.')
