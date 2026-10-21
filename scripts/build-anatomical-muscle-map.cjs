/* Repackage accepted geometry for native SVG; never retrace or assign muscles. */
/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const base = path.join(__dirname, '../assets/muscle-map/male-anatomy-v1');
const read = (p) => JSON.parse(fs.readFileSync(path.join(base, p), 'utf8'));
const hash = (p) =>
  crypto
    .createHash('sha256')
    .update(fs.readFileSync(path.join(base, p)))
    .digest('hex');
const combined = read('combined-review/geometry.json');
const chest = read('chest-regional-study/selected-geometry.json');
const layers = read('layers.json');
assert.equal(hash('source.png'), layers.sourceSha256);
assert.equal(chest.status, 'visually-approved');
assert.equal(chest.sourceSha256, layers.sourceSha256);
assert.equal(combined.regions.length, 92);
assert.deepEqual(combined.canvas, [layers.width, layers.height]);
assert.deepEqual(chest.canvas, combined.canvas);
const clips = [
  ...combined.defsMarkup.matchAll(
    /<mask[^>]*id="([^"]+)"[^>]*><image href="([^"]+)"[^>]*\/><\/mask>/g,
  ),
].map((m) => ({ id: m[1], image: m[2] }));
assert.equal(clips.length, 3);
assert(clips.every((c) => c.image.startsWith('data:image/png;base64,')));
const regions = combined.regions
  .filter((r) => r.muscleGroupId !== 'chest')
  .map((r) => ({
    id: r.id,
    view: r.view,
    groupId: r.muscleGroupId,
    path: r.path,
    transform: r.transform || '',
    clipId: r.clipId,
    partitionPath: null,
    representation: r.representation || 'surface',
  }));
for (const r of chest.regions) {
  const parent = combined.regions.find((p) => p.id === r.parentRegionId);
  assert(parent && parent.path === r.parentPath);
  regions.push({
    id: r.id,
    view: r.view,
    groupId: 'chest',
    path: r.parentPath,
    transform: parent.transform || '',
    clipId: parent.clipId,
    partitionPath: r.partitionPath,
    representation: r.representation,
  });
}
assert.equal(regions.length, 94);
assert.equal(new Set(regions.map((r) => r.id)).size, 94);
assert.equal(regions.filter((r) => r.groupId === null).length, 36);
for (const r of regions)
  assert(!r.clipId || clips.some((c) => c.id === r.clipId));
const files = [
  'source.png',
  'layers.json',
  'combined-review/geometry.json',
  'chest-regional-study/selected-geometry.json',
];
const result = {
  version: 1,
  canvas: combined.canvas,
  views: layers.views,
  provenance: Object.fromEntries(files.map((p) => [p, hash(p)])),
  clips,
  regions,
};
const output = path.join(base, 'runtime-atlas.json');
const encoded = JSON.stringify(result, null, 2) + '\n';
if (process.argv.includes('--check'))
  assert.equal(
    fs.readFileSync(output, 'utf8'),
    encoded,
    'Runtime anatomy atlas is stale; rebuild it.',
  );
else fs.writeFileSync(output, encoded);
console.log(
  'Anatomy atlas: 94 preserved regions, 36 unresolved, four chest partitions.',
);
