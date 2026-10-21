/* Review-only regional partition must preserve its original parent silhouettes. */
/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const sharp = require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');

async function main() {
  const base = path.resolve(__dirname, '../assets/muscle-map/male-anatomy-v1');
  const study = path.join(base, 'chest-regional-study');
  assert(
    fs.existsSync(path.join(study, 'geometry.json')),
    'regional chest study must exist',
  );
  const selection = JSON.parse(
    fs.readFileSync(path.join(study, 'selection.json')),
  );
  assert.equal(selection.status, 'visually-approved');
  assert.deepEqual(selection.dividerShiftSourcePixels, { left: -5, right: -4 });
  const g = JSON.parse(
    fs.readFileSync(path.join(study, 'selected-geometry.json')),
  );
  const original = JSON.parse(
    fs.readFileSync(path.join(base, 'reference-study/geometry.json')),
  );
  assert.equal(g.status, 'visually-approved');
  assert.equal(g.regions.length, 4);
  for (const side of ['left', 'right']) {
    const parent = original.regions.find(
      (r) => r.id === `pectoralis-major-${side}-reference`,
    );
    const regions = g.regions.filter((r) => r.side === side);
    assert.equal(regions.length, 2);
    const images = [];
    for (const r of regions) {
      assert.equal(r.muscleGroupId, 'chest');
      assert.equal(r.parentPath, parent.path);
      assert.equal(r.representation, 'schematic-regional-partition');
      assert.equal(r.exerciseMapping, null);
      images.push(
        await sharp(path.join(study, r.id + '-selected.png'))
          .greyscale()
          .raw()
          .toBuffer(),
      );
    }
    const parentPixels = await sharp(
      path.join(base, 'reference-study', parent.id + '.png'),
    )
      .greyscale()
      .raw()
      .toBuffer();
    for (let i = 0; i < parentPixels.length; i++) {
      assert.equal(
        images[0][i] + images[1][i],
        parentPixels[i],
        `parent alpha union ${side}:${i}`,
      );
      assert(!(images[0][i] && images[1][i]), `overlap ${side}:${i}`);
    }
  }
  const fragment = fs.readFileSync(process.argv[2], 'utf8');
  assert(fragment.length < 1_000_000 && !fragment.includes('fetch('));
  const dom = new JSDOM(fragment, { runScripts: 'dangerously' });
  const d = dom.window.document;
  for (const side of ['left', 'right']) {
    assert.equal(
      Number(d.querySelector('[data-shift="' + side + '"]').value),
      selection.dividerShiftSourcePixels[side],
    );
    assert.equal(
      d.querySelector('[data-guide="' + side + '"]').getAttribute('d'),
      g.parents.find((p) => p.side === side).dividerPath,
    );
  }
  const change = (selector, value) => {
    const el = d.querySelector(selector);
    el.value = value;
    el.dispatchEvent(new dom.window.Event('input'));
  };
  assert.equal(d.querySelectorAll('[data-regional-layer] path').length, 4);
  const left = d.querySelector('[data-guide="left"]');
  const rightBefore = d.querySelector('[data-guide="right"]').getAttribute('d');
  const before = left.getAttribute('d');
  change('[data-shift="left"]', 10);
  assert.notEqual(left.getAttribute('d'), before);
  assert.equal(
    d.querySelector('[data-guide="right"]').getAttribute('d'),
    rightBefore,
  );
  assert(
    [...d.querySelectorAll('[data-shift]')].every(
      (e) => e.min === '-10' && e.max === '10' && e.step === '0.5',
    ),
  );
  change('[data-opacity="clavicular"]', 0);
  assert(
    [...d.querySelectorAll('[data-region="clavicular"]')].every(
      (p) => p.getAttribute('opacity') === '0',
    ),
  );
  assert(
    [...d.querySelectorAll('[data-region="sternocostal"]')].every(
      (p) => p.getAttribute('opacity') === '0.65',
    ),
  );
  d.querySelector('[data-mode="source"]').click();
  assert.equal(
    d.querySelector('[data-regional-layer]').getAttribute('visibility'),
    'hidden',
  );
  d.querySelector('[data-mode="outline"]').click();
  assert.equal(
    d.querySelector('[data-guides]').getAttribute('visibility'),
    'visible',
  );
  assert.equal(
    d.querySelector('[data-regional-layer]').getAttribute('visibility'),
    'hidden',
  );
  d.querySelector('[data-mode="fill"]').click();
  assert.equal(
    d.querySelector('[data-regional-layer]').getAttribute('visibility'),
    'visible',
  );
  console.log(
    'PASS: four approved selected regions, exact screenshot defaults and dividers, parent paths/raster unions, no raster overlap, independent opacity and bilateral controls, source/boundary/fill modes.',
  );
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
